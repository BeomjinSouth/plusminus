export type ModelId = "rabbit-sign-parser";

export type Difficulty = "low" | "medium" | "high";

export type ProblemRecord = {
  id: string;
  expression: string;
  terms: string[];
  answer: string;
  intermediateSums: string[];
  gridDenominator: number;
  suggestedTick: string;
  lineMin: string;
  lineMax: string;
  supports: ModelId[];
  raw_split?: string[];
};

export type Problem = {
  id: string;
  expression: string;
  rawSplit: string[];
  terms: string[];
  answer: string;
  intermediateSums: string[];
  gridDenominator: number;
  suggestedTick: string;
  lineMin: string;
  lineMax: string;
  supports: ModelId[];
};

export type PlayerProfile = {
  school: string;
  grade: number;
  classNo: number;
  studentNo: number;
  studentKey: string;
};

export type SessionState = {
  sessionId: string;
  student: PlayerProfile;
};

export type AttemptEvent = {
  eventId: string;
  createdAt: string;
  sessionId: string;
  school: string;
  grade: number;
  classNo: number;
  studentNo: number;
  model: ModelId;
  difficulty: Difficulty;
  setId: string;
  problemId: string;
  stepId: string;
  attemptNo: number;
  inputRaw: string;
  normalizedInput: string;
  isCorrect: boolean;
  responseTimeMs: number;
  currentPosition?: string;
  expectedValue?: string;
};

export type SetResult = {
  sessionId: string;
  school: string;
  grade: number;
  classNo: number;
  studentNo: number;
  model: ModelId;
  difficulty: Difficulty;
  setId: string;
  correctCount: number;
  retryCount: number;
  bestStreak: number;
  completedAt: string;
};

export type ChallengeAttempt = {
  stepId: string;
  attemptNo: number;
  inputRaw: string;
  normalizedInput: string;
  isCorrect: boolean;
  responseTimeMs: number;
  currentPosition?: string;
  expectedValue?: string;
  flushNow?: boolean;
};

export type ChallengeComplete = {
  retriesUsed: number;
};
