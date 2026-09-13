import { z } from "zod";

export const actionDetailsSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).nullable(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  dueDate: z.iso.date().nullable(),
});

export const actionUpdateSchema = z.union([
  z.strictObject({ status: z.enum(["OPEN", "COMPLETED", "DISMISSED"]) }),
  actionDetailsSchema,
]);

export type ActionDetails = z.infer<typeof actionDetailsSchema>;

export function actionDetailsData(input: ActionDetails) {
  return {
    title: input.title,
    description: input.description || null,
    priority: input.priority,
    dueAt: input.dueDate ? new Date(`${input.dueDate}T00:00:00.000Z`) : null,
    dueDateIsAllDay: true,
  };
}
