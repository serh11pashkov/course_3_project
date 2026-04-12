import { Course, Assignment, Submission, User } from "./types";

const globalStore = global as unknown as {
  user: User;
  courses: Course[];
  assignments: Assignment[];
  submissions: Submission[];
};

const initialUser: User = {
  id: "u1",
  name: "Олександр Шевченко",
  email: "student@example.com",
  role: "student",
  createdAt: new Date().toISOString()
};

const initialCourses: Course[] = [
  {
    id: "c1",
    title: "Основи веб-розробки",
    description: "Опануйте основи HTML, CSS та сучасного JavaScript для створення веб-сайтів.",
    teacherId: "t1",
    createdAt: new Date().toISOString()
  },
  {
    id: "c2",
    title: "Вступ до ШІ та Data Science",
    description: "Вивчіть основи машинного навчання та аналізу даних за допомогою Python.",
    teacherId: "t1",
    createdAt: new Date().toISOString()
  }
];

const initialAssignments: Assignment[] = [
  {
    id: "a1",
    courseId: "c1",
    title: "Створення REST API",
    description: "Спроектуйте та реалізуйте RESTful API за допомогою Node.js та Express. Забезпечте обробку помилок.",
    rubric: {
      totalPoints: 100,
      criteria: [
        { name: "Якість коду", maxScore: 25, description: "Чистота коду, іменування та модульність." },
        { name: "Функціональність", maxScore: 40, description: "Коректна реалізація всіх ендпоінтів." },
        { name: "Документація", maxScore: 20, description: "Наявність README або Swagger." },
        { name: "Best Practices", maxScore: 15, description: "Заголовки безпеки та правильні статус-коди." }
      ]
    },
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  }
];

if (!globalStore.user) globalStore.user = initialUser;
if (!globalStore.courses) globalStore.courses = initialCourses;
if (!globalStore.assignments) globalStore.assignments = initialAssignments;
if (!globalStore.submissions) globalStore.submissions = [];

export const MOCK_USER = globalStore.user;
export const MOCK_COURSES = globalStore.courses;
export const MOCK_ASSIGNMENTS = globalStore.assignments;
export const MOCK_SUBMISSIONS = globalStore.submissions;

export const updateMockUser = (newData: Partial<User>) => {
  Object.assign(globalStore.user, newData);
};

export const addSubmission = (submission: Submission) => {
  globalStore.submissions.push(submission);
};

export const updateSubmission = (id: string, updates: Partial<Submission>) => {
  const index = globalStore.submissions.findIndex(s => s.id === id);
  if (index !== -1) {
    globalStore.submissions[index] = { ...globalStore.submissions[index], ...updates };
    return globalStore.submissions[index];
  }
  return undefined;
};

export const addCourse = (course: Course) => {
  globalStore.courses.push(course);
};

export const addAssignment = (assignment: Assignment) => {
  globalStore.assignments.push(assignment);
};
