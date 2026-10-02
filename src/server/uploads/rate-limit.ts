import "server-only";

import { getPrisma } from "@/server/db/prisma";

const UPLOAD_WINDOW_MS = 10 * 60 * 1000;
const UPLOAD_ATTEMPT_LIMIT = 10;

export class UploadRateLimitError extends Error {
  readonly code = "UPLOAD_RATE_LIMITED";

  constructor() {
    super("Try again in a few minutes.");
    this.name = "UploadRateLimitError";
  }
}

export async function consumeUploadAttempt(input: {
  userId: string;
  workspaceId: string;
}) {
  const prisma = getPrisma();
  const windowStartedAt = new Date(Date.now() - UPLOAD_WINDOW_MS);

  await prisma.$transaction(async (transaction) => {
    const lockedUsers = await transaction.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "user"
      WHERE "id" = CAST(${input.userId} AS uuid)
      FOR UPDATE
    `;
    if (lockedUsers.length !== 1) throw new UploadRateLimitError();

    const attempts = await transaction.auditEvent.count({
      where: {
        actorUserId: input.userId,
        eventType: "document.upload.attempted",
        createdAt: { gte: windowStartedAt },
      },
    });

    if (attempts >= UPLOAD_ATTEMPT_LIMIT) {
      throw new UploadRateLimitError();
    }

    await transaction.auditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorUserId: input.userId,
        eventType: "document.upload.attempted",
        entityType: "document",
      },
    });
  });
}
