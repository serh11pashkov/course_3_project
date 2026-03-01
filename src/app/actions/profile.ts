"use server";

import { requireSession } from "@/lib/db/server";
import { updateUserProfileById } from "@/lib/firebase/users";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const session = await requireSession();
  const userId = (session.user as any).id as string | undefined;
  if (!userId) {
    throw new Error("Користувач не авторизований.");
  }

  const name = formData.get("name")?.toString();
  const email = formData.get("email")?.toString();
  const updatedUser = await updateUserProfileById({ userId, name, email });

  revalidatePath("/");
  revalidatePath("/profile");
  return { success: true, user: updatedUser };
}
