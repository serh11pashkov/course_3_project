import { config } from "dotenv";
config({ path: ".env.local" });

import { randomBytes, scryptSync } from "node:crypto";
import { getAdminDb } from "@/lib/firebase/admin";

interface CourseData {
  title: string;
  description: string;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

async function main() {
  const db = getAdminDb();
  const demoPassword = process.env.DEMO_USER_PASSWORD ?? "password123";

  // Create/ensure sample teacher and student records by email.
  const users = db.collection("users");
  const ensureUser = async (
    email: string,
    name: string,
    role: "teacher" | "student",
  ) => {
    const snap = await users.where("email", "==", email).limit(1).get();
    if (!snap.empty) {
      const doc = snap.docs[0]!;
      const data = doc.data() as {
        passwordHash?: string;
        role?: "teacher" | "student";
      };

      const patch: Record<string, unknown> = {};
      if (!data.passwordHash) {
        patch.passwordHash = hashPassword(demoPassword);
      }
      if (!data.role) {
        patch.role = role;
      }

      if (Object.keys(patch).length > 0) {
        await doc.ref.set(patch, { merge: true });
        console.log(`Updated demo user: ${email}`);
      }

      return { id: doc.id };
    }
    const ref = await users.add({
      email,
      name,
      role,
      passwordHash: hashPassword(demoPassword),
      createdAt: new Date().toISOString(),
    });
    console.log(`Created ${role}: ${name}`);
    return { id: ref.id };
  };

  const teacher = await ensureUser(
    "teacher@example.com",
    "Демо Викладач",
    "teacher",
  );
  const student = await ensureUser(
    "student@example.com",
    "Демо Студент",
    "student",
  );

  // Courses data (Ukrainian)
  const coursesList: CourseData[] = [
    {
      title: "Основи веб-розробки",
      description:
        "Опануйте HTML, CSS, JavaScript та сучасні фреймворки. Дізнайтесь, як створювати адаптивні веб-сайти.",
    },
    {
      title: "Вступ до ШІ та Machine Learning",
      description:
        "Вивчіть основи штучного інтелекту, нейронні мережі та практичні застосування в реальних проектах.",
    },
    {
      title: "Python для Data Science",
      description:
        "Опануйте Python, Pandas, NumPy та Scikit-learn для аналізу та обробки даних.",
    },
    {
      title: "JavaScript Advanced",
      description:
        "Глибоке вивчення асинхронного коду, замикань, прототипів та сучасних паттернів проектування.",
    },
    {
      title: "Основи Git та GitHub",
      description:
        "Навчіться контролювати версії коду, працювати в команді та розміщувати проекти на GitHub.",
    },
    {
      title: "React.js для початківців",
      description:
        "Створюйте інтерактивні веб-додатки з React. Вивчіть хуки, управління станом та компоненти.",
    },
  ];

  // Create courses
  const courses = db.collection("courses");
  const courseEntries: Array<{ id: string; title: string }> = [];

  for (const courseData of coursesList) {
    const courseSnap = await courses
      .where("title", "==", courseData.title)
      .limit(1)
      .get();
    if (courseSnap.empty) {
      const ref = await courses.add({
        title: courseData.title,
        description: courseData.description,
        teacherId: teacher.id,
        createdAt: new Date().toISOString(),
      });
      console.log(`Created course: ${courseData.title}`);
      courseEntries.push({ id: ref.id, title: courseData.title });
    } else {
      courseEntries.push({
        id: courseSnap.docs[0]!.id,
        title: courseData.title,
      });
    }
  }

  // Create enrollments for student
  const enrollments = db.collection("enrollments");
  for (const courseId of courseEntries.map((c) => c.id).slice(0, 3)) {
    const existingEnrollment = await enrollments
      .where("studentId", "==", student.id)
      .where("courseId", "==", courseId)
      .limit(1)
      .get();

    if (existingEnrollment.empty) {
      await enrollments.add({
        studentId: student.id,
        courseId,
        enrolledAt: new Date().toISOString(),
        status: "active",
      });
      console.log(`Enrolled student in course: ${courseId}`);
    }
  }

  // Create assignments for all courses
  const assignments = db.collection("assignments");
  const assignmentTemplates = [
    {
      title: "Розробіть REST API",
      description:
        "Спроектуйте та реалізуйте RESTful API. Включіть валідацію, обробку помилок та документацію.",
      daysUntilDue: 7,
    },
    {
      title: "Компонент React UI",
      description:
        "Створіть переиспользуваний компонент React з пропсами, стилями та обробкою подій.",
      daysUntilDue: 5,
    },
    {
      title: "Аналіз даних з Python",
      description:
        "Завантажте набір даних CSV і виконайте аналіз з використанням Pandas та Matplotlib.",
      daysUntilDue: 10,
    },
  ];

  for (const course of courseEntries) {
    const { id: courseId, title: courseTitle } = course;
    const existingAssignments = await assignments
      .where("courseId", "==", courseId)
      .limit(50)
      .get();
    if (existingAssignments.empty) {
      for (const template of assignmentTemplates.slice(0, 2)) {
        await assignments.add({
          courseId,
          title: `${template.title} (${courseTitle})`,
          description: `${template.description} Курс: ${courseTitle}.`,
          rubric: {
            criteria: [
              {
                name: "Якість коду",
                maxScore: 25,
                description: "Чистота, іменування та модульність.",
              },
              {
                name: "Функціональність",
                maxScore: 40,
                description: "Коректна реалізація всіх вимог.",
              },
              {
                name: "Документація",
                maxScore: 20,
                description: "README, коментарі та API документація.",
              },
              {
                name: "Best Practices",
                maxScore: 15,
                description: "Безпека, конвенції та паттерни.",
              },
            ],
            totalPoints: 100,
          },
          dueDate: new Date(
            Date.now() + template.daysUntilDue * 24 * 60 * 60 * 1000,
          ).toISOString(),
          createdAt: new Date().toISOString(),
        });
      }
      console.log(`Created assignments for course: ${courseId}`);
    } else {
      const batch = db.batch();
      let hasUpdates = false;

      existingAssignments.docs.forEach((doc, index) => {
        const assignment = doc.data() as {
          title?: string;
          description?: string;
        };
        const originalTitle = assignment.title ?? `Завдання ${index + 1}`;
        const nextTitle = originalTitle.includes(courseTitle)
          ? originalTitle
          : `${originalTitle} (${courseTitle})`;

        const originalDescription = assignment.description ?? "";
        const nextDescription = originalDescription.includes(
          `Курс: ${courseTitle}.`,
        )
          ? originalDescription
          : `${originalDescription} Курс: ${courseTitle}.`.trim();

        if (
          nextTitle !== originalTitle ||
          nextDescription !== originalDescription
        ) {
          batch.set(
            doc.ref,
            { title: nextTitle, description: nextDescription },
            { merge: true },
          );
          hasUpdates = true;
        }
      });

      if (hasUpdates) {
        await batch.commit();
        console.log(`Updated assignment titles for course: ${courseId}`);
      }
    }
  }

  console.log("✅ Seed script completed successfully!");
}

main()
  .then(() => {
    console.log("Seed complete");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
