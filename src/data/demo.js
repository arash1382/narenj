export const SOURCE_GAPS = [
  "The skills spreadsheet has no skill IDs, sequence, prerequisites, successors or question-type mappings.",
  "The supplied files do not include a skill-linked question bank, hint content or worked explanations.",
  "SmartScore calculation, mastery transition criteria, coin earning rates, recommendation order and quiz parameters are not defined.",
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const inThreeDays = new Date(today);
inThreeDays.setDate(today.getDate() + 3);
const isoDate = (date) => date.toISOString().slice(0, 10);

// All people, classes, roster rows and this initial assignment are demo-only
// fixtures, not source records. The student can sign in as student.demo.
export const demoSeed = {
  version: 2,
  signedInAs: null,
  studentAvatarId: null,
  studentTourSeen: false,
  studentTourStatus: "not-started",
  activeClassId: "class-4a",
  preferredClassId: "class-4a",
  coins: 0,
  classes: [
    {
      id: "class-4a",
      title: "کلاس نمونهٔ چهارم الف",
      school: "مدرسهٔ نمونه",
      subject: "ریاضی",
      grade: "۴",
      roster: [
        { id: "student-demo", username: "student.demo", name: "دانش‌آموز نمونه", membership: "عضو کلاس" },
        { id: "student-two", username: "student.two", name: "دانش‌آموز نمونهٔ ۲", membership: "عضو کلاس" },
        { id: "student-three", username: "student.three", name: "دانش‌آموز نمونهٔ ۳", membership: "عضو کلاس" },
      ],
    },
    {
      id: "class-4b",
      title: "کلاس نمونهٔ چهارم ب",
      school: "مدرسهٔ نمونه",
      subject: "ریاضی",
      grade: "۴",
      roster: [
        { id: "student-four", username: "student.four", name: "دانش‌آموز نمونهٔ ۴", membership: "عضو کلاس" },
        { id: "student-five", username: "student.five", name: "دانش‌آموز نمونهٔ ۵", membership: "عضو کلاس" },
      ],
    },
  ],
  assignments: [
    {
      id: "assignment-demo-1",
      title: "تمرین نمونهٔ کلاسی",
      classId: "class-4a",
      recipientMode: "class",
      recipientIds: ["student-demo", "student-two", "student-three"],
      skillRows: [3],
      createdAt: today.toISOString(),
      startDate: isoDate(today),
      dueDate: isoDate(inThreeDays),
      instructions: "",
      status: "active",
      demoFixture: true,
      reorderedSkillRows: {},
    },
  ],
  skillProgress: {},
  practiceSession: null,
  lastSessionSummary: null,
  dismissedRecommendations: [],
};

export const demoAccounts = {
  "student.demo": { password: "naranj-demo", role: "student", displayName: "دانش‌آموز نمونه", rosterId: "student-demo" },
  "teacher.demo": { password: "naranj-demo", role: "teacher", displayName: "معلم نمونه" },
};
