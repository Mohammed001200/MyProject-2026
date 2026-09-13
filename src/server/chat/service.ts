import "server-only";
import { Prisma } from "@/generated/prisma/client";
import {
  requireDocumentAccess,
  principalFromViewer,
  type ViewerContext,
} from "@/server/auth/authorization";
import { getPrisma } from "@/server/db/prisma";
import { ChatError, getChatProvider } from "./provider";
import { citationSchema, validateAnswer, type Citation } from "./schema";

export async function readChat(viewer: ViewerContext, documentId: string) {
  const document = await requireDocumentAccess(
    principalFromViewer(viewer),
    documentId,
  );
  const turns = await getPrisma().chatTurn.findMany({
    where: { userId: viewer.session.user.id, documentId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 40,
    select: {
      id: true,
      question: true,
      answer: true,
      citations: true,
      status: true,
      createdAt: true,
    },
  });
  return {
    title: document.title,
    turns: turns.map((turn) => ({
      ...turn,
      createdAt: turn.createdAt.toISOString(),
      status:
        turn.status === "PENDING" &&
        turn.createdAt.getTime() < Date.now() - 120_000
          ? "FAILED"
          : turn.status,
      citations: citationSchema.array().safeParse(turn.citations).data ?? [],
    })),
  };
}

export async function askDocument(
  viewer: ViewerContext,
  documentId: string,
  input: { requestId: string; question: string },
) {
  const document = await requireDocumentAccess(
    principalFromViewer(viewer),
    documentId,
  );
  const analysis = document.analyses[0];
  if (!analysis || analysis.status !== "READY" || document.status !== "READY")
    throw new ChatError("DOCUMENT_NOT_READY", 409);
  const sources: Citation[] = analysis.entities
    .filter((entity) => entity.sourceText)
    .slice(0, 20)
    .map((entity) => ({
      id: entity.id,
      label: entity.label.slice(0, 200),
      text: entity.sourceText!.slice(0, 1500),
      page: entity.pageNumber,
    }));
  if (analysis.summary)
    sources.push({
      id: analysis.id,
      label: "Analysis summary",
      text: analysis.summary.slice(0, 3000),
      page: null,
    });
  if (!sources.length) throw new ChatError("NO_DOCUMENT_EVIDENCE", 409);
  const provider = getChatProvider();
  const prisma = getPrisma();
  const userId = viewer.session.user.id;
  const reserved = await prisma.$transaction(async (tx) => {
    // Serialize reservations per user, including requests from different tabs/documents.
    await tx.$queryRaw(
      Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${userId}))::text`,
    );
    const existing = await tx.chatTurn.findUnique({
      where: { userId_requestId: { userId, requestId: input.requestId } },
    });
    if (existing) {
      if (
        existing.documentId !== documentId ||
        existing.question !== input.question
      )
        throw new ChatError("REQUEST_CONFLICT", 409);
      if (existing.status === "FAILED")
        throw new ChatError("CHAT_PREVIOUS_FAILED", 409);
      return { id: existing.id, fresh: false };
    }
    const cutoff = new Date(Date.now() - 120_000);
    const pending = await tx.chatTurn.count({
      where: { userId, status: "PENDING", createdAt: { gt: cutoff } },
    });
    if (pending) throw new ChatError("CHAT_BUSY", 409);
    const daily = await tx.auditEvent.count({
      where: {
        actorUserId: userId,
        eventType: "chat.requested",
        createdAt: { gte: new Date(Date.now() - 86_400_000) },
      },
    });
    if (daily >= 50) throw new ChatError("CHAT_DAILY_LIMIT", 429);
    if ((await tx.chatTurn.count({ where: { userId, documentId } })) >= 40)
      throw new ChatError("CHAT_HISTORY_LIMIT", 409);
    await tx.chatTurn.updateMany({
      where: { userId, status: "PENDING", createdAt: { lte: cutoff } },
      data: { status: "FAILED", completedAt: new Date() },
    });
    const turn = await tx.chatTurn.create({
      data: {
        userId,
        documentId,
        analysisId: analysis.id,
        requestId: input.requestId,
        question: input.question,
      },
    });
    await tx.auditEvent.create({
      data: {
        workspaceId: document.workspaceId,
        actorUserId: userId,
        eventType: "chat.requested",
        entityType: "chat",
        entityId: turn.id,
      },
    });
    return { id: turn.id, fresh: true };
  });
  if (!reserved.fresh) return reserved.id;
  try {
    const [history, profile] = await Promise.all([
      prisma.chatTurn.findMany({
        where: { userId, documentId, status: "COMPLETE" },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { question: true, answer: true },
      }),
      prisma.profile.findUnique({
        where: { userId },
        select: { preferredLocale: true, explanationStyle: true },
      }),
    ]);
    const output = await provider.answer({
      question: input.question,
      sources,
      history: history.reverse(),
      locale: profile?.preferredLocale ?? "en",
      style: profile?.explanationStyle ?? "BALANCED",
    });
    await prisma.chatTurn.updateMany({
      where: { id: reserved.id, userId, status: "PENDING" },
      data: {
        provider: output.provider,
        model: output.model,
        inputTokens: output.inputTokens,
        outputTokens: output.outputTokens,
      },
    });
    const validated = validateAnswer(output.result, sources);
    const answer = validated.insufficientEvidence
      ? profile?.preferredLocale === "sv"
        ? "Jag hittar inte tillräckligt stöd i det valda dokumentet för att besvara frågan. Kontrollera originalet eller välj ett annat dokument."
        : "I could not find enough evidence in the selected document to answer this question. Check the original or choose another document."
      : validated.answer;
    const updated = await prisma.chatTurn.updateMany({
      where: {
        id: reserved.id,
        userId,
        status: "PENDING",
        document: { is: { deletedAt: null } },
      },
      data: {
        answer,
        citations: validated.insufficientEvidence ? [] : validated.citations,
        status: "COMPLETE",
        completedAt: new Date(),
        provider: output.provider,
        model: output.model,
        inputTokens: output.inputTokens,
        outputTokens: output.outputTokens,
      },
    });
    if (updated.count !== 1)
      throw new ChatError("CHAT_NO_LONGER_AVAILABLE", 409);
    return reserved.id;
  } catch (error) {
    await prisma.chatTurn.updateMany({
      where: { id: reserved.id, userId, status: "PENDING" },
      data: { status: "FAILED", completedAt: new Date() },
    });
    throw error;
  }
}
