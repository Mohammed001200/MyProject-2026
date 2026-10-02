import { z } from "zod";

export const chatInputSchema = z.strictObject({
  requestId: z.uuid(),
  question: z.string().trim().min(1).max(2000),
});
export const answerSchema = z.strictObject({
  answer: z.string().min(1).max(6000),
  sourceIds: z.array(z.string().max(80)).max(5),
  insufficientEvidence: z.boolean(),
});
export const citationSchema = z.strictObject({
  id: z.string(),
  label: z.string(),
  text: z.string(),
  page: z.number().int().positive().nullable(),
});
export type Citation = z.infer<typeof citationSchema>;
export function validateAnswer(answer: unknown, sources: Citation[]) {
  const parsed = answerSchema.parse(answer);
  const ids = [...new Set(parsed.sourceIds)];
  if (ids.some((id) => !sources.some((source) => source.id === id)))
    throw new Error("Unknown citation");
  if (!parsed.insufficientEvidence && ids.length === 0)
    throw new Error("Missing evidence");
  return {
    ...parsed,
    citations: ids.map((id) => sources.find((source) => source.id === id)!),
  };
}
