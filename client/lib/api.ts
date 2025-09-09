export const PY_API = {
  upload: "/py/upload",
  train: "/py/train",
  predict: "/py/predict",
} as const;

export type PredictRequest = {
  year?: number;
  subject?: string;
  metric?: "passRate" | "avgScore";
};

export type PredictResponse = {
  year: number;
  subject: string;
  metric: "passRate" | "avgScore";
  value: number;
};
