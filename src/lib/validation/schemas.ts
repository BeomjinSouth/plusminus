import { z } from "zod";

const modelSchema = z.enum(["rabbit-sign-parser"]);
const difficultySchema = z.enum(["low", "medium", "high"]);

export const sessionStartSchema = z.object({
  school: z.string().trim().min(1),
  grade: z.number().int().min(1).max(6),
  classNo: z.number().int().min(1).max(20),
  studentNo: z.number().int().min(1).max(50),
});

export const attemptEventSchema = z.object({
  eventId: z.string().min(1),
  createdAt: z.string().min(1),
  sessionId: z.string().min(1),
  school: z.string().trim().min(1),
  grade: z.number().int().min(1).max(6),
  classNo: z.number().int().min(1).max(20),
  studentNo: z.number().int().min(1).max(50),
  model: modelSchema,
  difficulty: difficultySchema,
  setId: z.string().min(1),
  problemId: z.string().min(1),
  stepId: z.string().min(1),
  attemptNo: z.number().int().min(1),
  inputRaw: z.string(),
  normalizedInput: z.string(),
  isCorrect: z.boolean(),
  responseTimeMs: z.number().int().min(0),
  currentPosition: z.string().optional(),
  expectedValue: z.string().optional(),
});

export const attemptsLogSchema = z.object({
  sessionId: z.string().min(1),
  events: z.array(attemptEventSchema).min(1),
});

export const setResultSchema = z.object({
  sessionId: z.string().min(1),
  school: z.string().trim().min(1),
  grade: z.number().int().min(1).max(6),
  classNo: z.number().int().min(1).max(20),
  studentNo: z.number().int().min(1).max(50),
  model: modelSchema,
  difficulty: difficultySchema,
  setId: z.string().min(1),
  correctCount: z.number().int().min(0),
  retryCount: z.number().int().min(0),
  bestStreak: z.number().int().min(0),
  completedAt: z.string().min(1),
});

export const progressFlushSchema = z.object({
  sessionId: z.string().min(1),
  events: z.array(attemptEventSchema).optional(),
  setResult: setResultSchema.optional(),
});
