import { z } from "zod";

const confidence = z.number().min(0).max(1);
const pageNumber = z.number().int().positive().nullable();
const sourceText = z.string().max(500).nullable();
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable();

export const documentAnalysisResultSchema = z.object({
  title: z.string().min(1).max(180),
  category: z.enum([
    "GOVERNMENT",
    "FINANCE",
    "INSURANCE",
    "HOUSING",
    "EMPLOYMENT",
    "EDUCATION",
    "HEALTH_ADMIN",
    "CONTRACT",
    "INVOICE",
    "OTHER",
  ]),
  organizationName: z.string().max(180).nullable(),
  documentDate: date,
  sourceDateText: z.string().max(120).nullable(),
  detectedLanguage: z.string().min(2).max(16),
  summary: z.string().min(1).max(2200),
  simpleExplanation: z.string().min(1).max(2200),
  importance: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  confidence,
  warnings: z.array(z.string().max(300)).max(12),
  entities: z
    .array(
      z.object({
        type: z.string().min(1).max(64),
        label: z.string().min(1).max(120),
        value: z.string().min(1).max(500),
        normalizedValue: z.string().max(500).nullable(),
        confidence,
        pageNumber,
        sourceText,
      }),
    )
    .max(60),
  actions: z
    .array(
      z.object({
        title: z.string().min(1).max(180),
        description: z.string().max(1000).nullable(),
        dueDate: date,
        sourceDateText: z.string().max(120).nullable(),
        priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
        confidence,
        reason: z.string().min(1).max(500),
        pageNumber,
        sourceText,
      }),
    )
    .max(20),
});

export type DocumentAnalysisResult = z.infer<
  typeof documentAnalysisResultSchema
>;
