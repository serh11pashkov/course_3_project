import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getAdminDb } from "@/lib/firebase/admin";

export type DbUserRole = "student" | "teacher";

export type DbUser = {
  id: string;
  name: string | null;
  email: string;
  role: DbUserRole | null;
  createdAt: string;
};

type DbUserRecord = Omit<DbUser, "id"> & {
  passwordHash?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toPublicUser(id: string, data: DbUserRecord): DbUser {
  return {
    id,
    name: data.name,
    email: data.email,
    role: data.role,
    createdAt: data.createdAt,
  };
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

function isPasswordValid(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(":");
  if (!salt || !storedHash) return false;

  const derivedKey = scryptSync(password, salt, 64);
  const storedKey = Buffer.from(storedHash, "hex");
  if (derivedKey.length !== storedKey.length) return false;

  return timingSafeEqual(derivedKey, storedKey);
}

async function findUserDocumentByEmail(email: string) {
  const db = getAdminDb();
  const snap = await db
    .collection("users")
    .where("email", "==", normalizeEmail(email))
    .limit(1)
    .get();

  return snap.empty ? null : snap.docs[0]!;
}

export async function getOrCreateUserByEmail(
  email: string,
  name: string | null,
): Promise<DbUser> {
  const db = getAdminDb();
  const users = db.collection("users");
  const normalizedEmail = normalizeEmail(email);

  const existingDoc = await findUserDocumentByEmail(normalizedEmail);
  if (existingDoc) {
    const data = existingDoc.data() as DbUserRecord;
    if (name && data.name !== name) {
      await existingDoc.ref.set({ name }, { merge: true });
      data.name = name;
    }

    return toPublicUser(existingDoc.id, data);
  }

  const createdAt = new Date().toISOString();
  const ref = await users.add({
    name,
    email: normalizedEmail,
    role: null,
    createdAt,
  });

  return { id: ref.id, name, email: normalizedEmail, role: null, createdAt };
}

export async function setUserRole(userId: string, role: DbUserRole) {
  const db = getAdminDb();
  await db.collection("users").doc(userId).set({ role }, { merge: true });
}

export async function verifyUserCredentials(
  email: string,
  password: string,
): Promise<DbUser | null> {
  const userDoc = await findUserDocumentByEmail(email);
  if (!userDoc) return null;

  const data = userDoc.data() as DbUserRecord;
  if (!data.passwordHash || !isPasswordValid(password, data.passwordHash)) {
    return null;
  }

  return toPublicUser(userDoc.id, data);
}

export async function registerUserWithPassword(input: {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  role: DbUserRole;
}): Promise<DbUser> {
  const db = getAdminDb();
  const users = db.collection("users");
  const email = normalizeEmail(input.email);
  const password = input.password.trim();
  const name =
    [input.firstName?.trim(), input.lastName?.trim()]
      .filter(Boolean)
      .join(" ") || null;

  if (password.length < 6) {
    throw new Error("Пароль має містити щонайменше 6 символів.");
  }

  const existingDoc = await findUserDocumentByEmail(email);
  if (existingDoc) {
    const data = existingDoc.data() as DbUserRecord;

    if (data.passwordHash) {
      throw new Error("Користувач з такою email-адресою вже існує.");
    }

    const passwordHash = hashPassword(password);
    const nextData: Partial<DbUserRecord> = {
      passwordHash,
      role: data.role ?? input.role,
    };

    if (name) nextData.name = name;

    await existingDoc.ref.set(nextData, { merge: true });

    return toPublicUser(existingDoc.id, {
      ...data,
      ...nextData,
      email: data.email,
      createdAt: data.createdAt,
      name: (nextData.name as string | null | undefined) ?? data.name,
      role: (nextData.role as DbUserRole | null | undefined) ?? data.role,
    });
  }

  const createdAt = new Date().toISOString();
  const ref = await users.add({
    name,
    email,
    role: input.role,
    createdAt,
    passwordHash: hashPassword(password),
  });

  return { id: ref.id, name, email, role: input.role, createdAt };
}

export async function getUserById(userId: string): Promise<DbUser | null> {
  const db = getAdminDb();
  const doc = await db.collection("users").doc(userId).get();
  if (!doc.exists) return null;
  return toPublicUser(doc.id, doc.data() as DbUserRecord);
}

export async function updateUserProfileById(input: {
  userId: string;
  name?: string;
  email?: string;
}): Promise<DbUser> {
  const db = getAdminDb();
  const docRef = db.collection("users").doc(input.userId);
  const existing = await docRef.get();
  if (!existing.exists) {
    throw new Error("Користувача не знайдено.");
  }

  const data = existing.data() as DbUserRecord;
  const patch: Partial<DbUserRecord> = {};

  if (typeof input.name === "string" && input.name.trim()) {
    patch.name = input.name.trim();
  }

  if (typeof input.email === "string" && input.email.trim()) {
    const normalizedEmail = normalizeEmail(input.email);

    if (normalizedEmail !== data.email) {
      const duplicate = await findUserDocumentByEmail(normalizedEmail);
      if (duplicate && duplicate.id !== input.userId) {
        throw new Error("Користувач з такою email-адресою вже існує.");
      }
    }

    patch.email = normalizedEmail;
  }

  if (Object.keys(patch).length > 0) {
    await docRef.set(patch, { merge: true });
  }

  const updated = await docRef.get();
  return toPublicUser(updated.id, updated.data() as DbUserRecord);
}
