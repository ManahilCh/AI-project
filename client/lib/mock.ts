export type MetricKey = "passRate" | "avgScore";
export type YearData = {
  year: number;
  subject: string;
  passRate: number; // 0-100
  avgScore: number; // 0-100
};

export const SUBJECTS = ["Math", "Science", "English", "Computer"] as const;
export const YEARS = [2021, 2022, 2023, 2024, 2025] as const;

export const MOCK_DATA: YearData[] = [
  { year: 2021, subject: "Math", passRate: 72, avgScore: 68 },
  { year: 2021, subject: "Science", passRate: 76, avgScore: 70 },
  { year: 2021, subject: "English", passRate: 81, avgScore: 73 },
  { year: 2021, subject: "Computer", passRate: 78, avgScore: 75 },

  { year: 2022, subject: "Math", passRate: 74, avgScore: 70 },
  { year: 2022, subject: "Science", passRate: 77, avgScore: 72 },
  { year: 2022, subject: "English", passRate: 82, avgScore: 75 },
  { year: 2022, subject: "Computer", passRate: 80, avgScore: 77 },

  { year: 2023, subject: "Math", passRate: 76, avgScore: 72 },
  { year: 2023, subject: "Science", passRate: 79, avgScore: 74 },
  { year: 2023, subject: "English", passRate: 84, avgScore: 77 },
  { year: 2023, subject: "Computer", passRate: 83, avgScore: 80 },

  { year: 2024, subject: "Math", passRate: 78, avgScore: 74 },
  { year: 2024, subject: "Science", passRate: 81, avgScore: 76 },
  { year: 2024, subject: "English", passRate: 85, avgScore: 79 },
  { year: 2024, subject: "Computer", passRate: 85, avgScore: 82 },

  { year: 2025, subject: "Math", passRate: 80, avgScore: 76 },
  { year: 2025, subject: "Science", passRate: 83, avgScore: 78 },
  { year: 2025, subject: "English", passRate: 86, avgScore: 80 },
  { year: 2025, subject: "Computer", passRate: 87, avgScore: 84 },
];

export const MOCK_UPLOAD_HISTORY = [
  { id: "u_1001", fileName: "results_q1_2024.csv", rows: 1200, uploadedAt: "2024-03-15T10:32:00Z" },
  { id: "u_1002", fileName: "midterm_2024.csv", rows: 980, uploadedAt: "2024-06-03T14:10:00Z" },
  { id: "u_1003", fileName: "fsd_2024_schoolA.csv", rows: 1500, uploadedAt: "2024-09-21T08:05:00Z" },
  { id: "u_1004", fileName: "annual_2025.csv", rows: 1760, uploadedAt: "2025-01-09T09:40:00Z" },
] as const;

export type GenderBySubject = {
  subject: (typeof SUBJECTS)[number];
  malePass: number;
  maleFail: number;
  femalePass: number;
  femaleFail: number;
};

export const GENDER_BY_SUBJECT: GenderBySubject[] = [
  { subject: "Math", malePass: 180, maleFail: 45, femalePass: 200, femaleFail: 30 },
  { subject: "Science", malePass: 190, maleFail: 40, femalePass: 210, femaleFail: 28 },
  { subject: "English", malePass: 220, maleFail: 25, femalePass: 240, femaleFail: 20 },
  { subject: "Computer", malePass: 210, maleFail: 30, femalePass: 225, femaleFail: 18 },
];

export const GENDER_TOTALS = (() => {
  const t = GENDER_BY_SUBJECT.reduce(
    (acc, s) => {
      acc.malePass += s.malePass;
      acc.maleFail += s.maleFail;
      acc.femalePass += s.femalePass;
      acc.femaleFail += s.femaleFail;
      return acc;
    },
    { malePass: 0, maleFail: 0, femalePass: 0, femaleFail: 0 },
  );
  return {
    male: { pass: t.malePass, fail: t.maleFail },
    female: { pass: t.femalePass, fail: t.femaleFail },
  } as const;
})();
