import { exportWorkspace, ExportTooLargeError } from "@/server/privacy/export";
import * as chatProviders from "@/server/chat/provider";
import { askDocument, readChat } from "@/server/chat/service";
import type { ViewerContext } from "@/server/auth/authorization";
import { createHash, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import {
  PrivateResourceNotFoundError,
  requireActionAccess,
  requireDocumentAccess,
  requireWorkspaceAccess,
} from "@/server/auth/authorization";
import { getAuth } from "@/server/auth/auth";
import { getPrisma } from "@/server/db/prisma";
import {
  cleanupPendingDocumentDeletions,
  deleteDocument,
} from "@/server/documents/delete-document";
import {
  processAvailableDocumentJobs,
  processDocument,
} from "@/server/jobs/process-document";
import { createDocumentObjectKey, getDocumentStorage } from "@/server/storage";
import {
  abandonDocumentUploadIntent,
  createDocumentUploadIntent,
  promoteDocumentUploadIntent,
} from "@/server/uploads/document-intent";
import {
  UploadRateLimitError,
  consumeUploadAttempt,
} from "@/server/uploads/rate-limit";
import { ensurePersonalWorkspace } from "@/server/workspaces/service";

const databaseUrl = process.env.DATABASE_URL;

if (process.env.CIVORA_INTEGRATION_TESTS !== "true" || !databaseUrl) {
  throw new Error(
    "Integration tests require CIVORA_INTEGRATION_TESTS=true and DATABASE_URL.",
  );
}

if (new URL(databaseUrl).pathname !== "/civora_test") {
  throw new Error("Refusing to run destructive tests outside civora_test.");
}

const prisma = getPrisma();

function sha256(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function resetTestDatabase() {
  await prisma.actionItem.deleteMany();
  await prisma.document.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
}

beforeAll(resetTestDatabase);

afterAll(async () => {
  await resetTestDatabase();
  await prisma.$disconnect();
});

describe("identity and workspace persistence", () => {
  it("creates an account, personal workspace, and reusable session", async () => {
    const email = "founder.integration@example.test";
    const password = "correct-horse-battery-staple";
    const baseUrl = "http://127.0.0.1:3000";

    const signUp = await getAuth().handler(
      new Request(`${baseUrl}/api/auth/sign-up/email`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: baseUrl,
        },
        body: JSON.stringify({ name: "Maya Lind", email, password }),
      }),
    );

    expect(signUp.status).toBe(200);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
      include: {
        profile: true,
        memberships: { include: { workspace: true } },
      },
    });

    expect(user.profile).toMatchObject({
      preferredLocale: "en",
      explanationStyle: "BALANCED",
      onboardingDone: false,
    });
    expect(user.memberships).toHaveLength(1);
    expect(user.memberships[0]).toMatchObject({
      role: "OWNER",
      workspace: { kind: "PERSONAL" },
    });

    const signIn = await getAuth().handler(
      new Request(`${baseUrl}/api/auth/sign-in/email`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: baseUrl,
        },
        body: JSON.stringify({ email, password }),
      }),
    );

    expect(signIn.status).toBe(200);
    expect(signIn.headers.get("set-cookie")).toContain("civora.session_token");
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(1);
  });

  it("keeps workspace bootstrap idempotent", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Alex River",
        email: "alex.integration@example.test",
        emailVerified: true,
      },
    });

    const firstWorkspace = await ensurePersonalWorkspace(prisma, user);
    const secondWorkspace = await ensurePersonalWorkspace(prisma, user);

    expect(secondWorkspace).toBe(firstWorkspace);
    expect(
      await prisma.workspaceMember.count({ where: { userId: user.id } }),
    ).toBe(1);
    expect(
      await prisma.auditEvent.count({
        where: {
          actorUserId: user.id,
          eventType: "workspace.personal.created",
        },
      }),
    ).toBe(1);
  });

  it("denies cross-workspace reads and enforces confidence constraints", async () => {
    const [owner, outsider] = await Promise.all([
      prisma.user.create({
        data: {
          name: "Owner One",
          email: "owner.integration@example.test",
          emailVerified: true,
        },
      }),
      prisma.user.create({
        data: {
          name: "Outside User",
          email: "outsider.integration@example.test",
          emailVerified: true,
        },
      }),
    ]);

    const [ownerWorkspaceId] = await Promise.all([
      ensurePersonalWorkspace(prisma, owner),
      ensurePersonalWorkspace(prisma, outsider),
    ]);

    const document = await prisma.document.create({
      data: {
        workspaceId: ownerWorkspaceId,
        uploadedById: owner.id,
        title: "Fictional integration notice",
        originalFileName: "fictional-notice.pdf",
      },
    });

    await expect(
      requireWorkspaceAccess({ userId: outsider.id }, ownerWorkspaceId),
    ).rejects.toBeInstanceOf(PrivateResourceNotFoundError);
    await expect(
      requireDocumentAccess({ userId: outsider.id }, document.id),
    ).rejects.toBeInstanceOf(PrivateResourceNotFoundError);
    await expect(
      requireDocumentAccess({ userId: owner.id }, document.id),
    ).resolves.toMatchObject({ id: document.id });
    await expect(
      deleteDocument({ userId: outsider.id }, document.id),
    ).rejects.toBeInstanceOf(PrivateResourceNotFoundError);
    await expect(
      prisma.document.findUnique({ where: { id: document.id } }),
    ).resolves.toMatchObject({ id: document.id });

    await expect(
      prisma.documentAnalysis.create({
        data: {
          documentId: document.id,
          version: 1,
          provider: "integration-test",
          model: "none",
          schemaVersion: "test-1",
          promptVersion: "test-1",
          confidence: new Prisma.Decimal("1.001"),
        },
      }),
    ).rejects.toThrow();

    const reviewAnalysis = await prisma.documentAnalysis.create({
      data: {
        documentId: document.id,
        version: 1,
        status: "NEEDS_REVIEW",
        provider: "integration-test",
        model: "deterministic-v1",
        schemaVersion: "test-1",
        promptVersion: "test-1",
        warnings: ["Ambiguous source"],
      },
    });
    const withheldAction = await prisma.actionItem.create({
      data: {
        workspaceId: ownerWorkspaceId,
        sourceDocumentId: document.id,
        sourceAnalysisId: reviewAnalysis.id,
        title: "Unsafe unreviewed suggestion",
      },
    });

    await expect(
      requireActionAccess({ userId: owner.id }, withheldAction.id),
    ).rejects.toBeInstanceOf(PrivateResourceNotFoundError);
    await expect(
      requireDocumentAccess({ userId: owner.id }, document.id),
    ).resolves.toMatchObject({ actions: [] });
  });

  it("keeps a durable upload intent private and jobless until promotion", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Upload Intent User",
        email: "upload-intent.integration@example.test",
        emailVerified: true,
      },
    });
    const workspaceId = await ensurePersonalWorkspace(prisma, user);
    const documentId = crypto.randomUUID();
    const storage = getDocumentStorage();
    const bytes = new TextEncoder().encode("%PDF-1.7\nintent fixture");
    const objectKey = createDocumentObjectKey(workspaceId, documentId, "pdf");
    const cleanupAt = new Date(Date.now() + 60 * 60 * 1000);

    const intent = await createDocumentUploadIntent({
      documentId,
      workspaceId,
      userId: user.id,
      storageProvider: storage.provider,
      objectKey,
      cleanupAt,
    });

    try {
      await expect(
        prisma.document.findUniqueOrThrow({
          where: { id: documentId },
          include: { file: true, job: true },
        }),
      ).resolves.toMatchObject({
        status: "UPLOADED",
        title: "Upload pending",
        originalFileName: "pending",
        failureCode: "DOCUMENT_UPLOAD_INTENT_PENDING",
        deletedAt: cleanupAt,
        job: null,
        file: {
          storageProvider: storage.provider,
          objectKey,
          verifiedMimeType: "application/octet-stream",
          extension: "bin",
          sizeBytes: 1n,
          sha256: "0".repeat(64),
        },
      });
      await expect(
        requireDocumentAccess({ userId: user.id }, documentId),
      ).rejects.toBeInstanceOf(PrivateResourceNotFoundError);
      await expect(processDocument(documentId)).resolves.toEqual({
        status: "not-claimed",
      });
      expect(
        await prisma.auditEvent.count({
          where: { entityId: documentId, eventType: "document.uploaded" },
        }),
      ).toBe(0);

      await storage.put(objectKey, bytes);
      await promoteDocumentUploadIntent(intent, {
        title: "Intent fixture",
        originalFileName: "intent-fixture.pdf",
        verifiedMimeType: "application/pdf",
        extension: "pdf",
        sizeBytes: bytes.byteLength,
        sha256: "d".repeat(64),
      });

      await expect(
        prisma.document.findUniqueOrThrow({
          where: { id: documentId },
          include: { file: true, job: true },
        }),
      ).resolves.toMatchObject({
        status: "QUEUED",
        title: "Intent fixture",
        originalFileName: "intent-fixture.pdf",
        failureCode: null,
        deletedAt: null,
        job: { status: "QUEUED", attempts: 0 },
        file: {
          verifiedMimeType: "application/pdf",
          extension: "pdf",
          sizeBytes: BigInt(bytes.byteLength),
          sha256: "d".repeat(64),
        },
      });
      await expect(
        requireDocumentAccess({ userId: user.id }, documentId),
      ).resolves.toMatchObject({ id: documentId, status: "QUEUED" });
      expect(
        await prisma.auditEvent.count({
          where: { entityId: documentId, eventType: "document.uploaded" },
        }),
      ).toBe(1);
    } finally {
      try {
        await deleteDocument({ userId: user.id }, documentId);
      } finally {
        await storage.delete(objectKey);
      }
    }
  });

  it("coordinates cleanup when an upload fails before promotion", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Failed Upload User",
        email: "failed-upload.integration@example.test",
        emailVerified: true,
      },
    });
    const workspaceId = await ensurePersonalWorkspace(prisma, user);
    const documentId = crypto.randomUUID();
    const storage = getDocumentStorage();
    const bytes = new TextEncoder().encode("%PDF-1.7\nfailed upload");
    const objectKey = createDocumentObjectKey(workspaceId, documentId, "pdf");
    const intent = await createDocumentUploadIntent({
      documentId,
      workspaceId,
      userId: user.id,
      storageProvider: storage.provider,
      objectKey,
    });

    try {
      await storage.put(objectKey, bytes);
      await abandonDocumentUploadIntent(intent, storage);

      await expect(
        prisma.document.findUnique({ where: { id: documentId } }),
      ).resolves.toBeNull();
      await expect(storage.read(objectKey)).rejects.toThrow();
      for (const eventType of [
        "document.upload.cleanup.requested",
        "document.deleted",
      ]) {
        await expect(
          prisma.auditEvent.count({
            where: { actorUserId: user.id, entityId: documentId, eventType },
          }),
        ).resolves.toBe(1);
      }
    } finally {
      await storage.delete(objectKey);
    }
  });

  it("backs off a failed tombstone so later deletions can progress", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Deletion Cleanup User",
        email: "deletion-cleanup.integration@example.test",
        emailVerified: true,
      },
    });
    const workspaceId = await ensurePersonalWorkspace(prisma, user);
    const storage = getDocumentStorage();
    const blockedDocumentId = crypto.randomUUID();
    const healthyDocumentId = crypto.randomUUID();
    const blockedKey = createDocumentObjectKey(
      workspaceId,
      blockedDocumentId,
      "pdf",
    );
    const healthyKey = createDocumentObjectKey(
      workspaceId,
      healthyDocumentId,
      "pdf",
    );
    await storage.put(
      healthyKey,
      new TextEncoder().encode("%PDF-1.7\ncleanup fixture"),
    );

    try {
      const baseDocument = {
        workspaceId,
        uploadedById: user.id,
        title: "Deletion pending",
        originalFileName: "deleted",
        status: "UPLOADED" as const,
        failureCode: "DOCUMENT_DELETION_PENDING",
      };
      await prisma.document.create({
        data: {
          ...baseDocument,
          id: blockedDocumentId,
          deletedAt: new Date(Date.now() - 2 * 60 * 1000),
          file: {
            create: {
              storageProvider: "s3-private-00000000000000000000",
              objectKey: blockedKey,
              verifiedMimeType: "application/octet-stream",
              extension: "bin",
              sizeBytes: 1,
              sha256: "0".repeat(64),
            },
          },
        },
      });
      await prisma.document.create({
        data: {
          ...baseDocument,
          id: healthyDocumentId,
          deletedAt: new Date(Date.now() - 60 * 1000),
          file: {
            create: {
              storageProvider: storage.provider,
              objectKey: healthyKey,
              verifiedMimeType: "application/octet-stream",
              extension: "bin",
              sizeBytes: 1,
              sha256: "0".repeat(64),
            },
          },
        },
      });

      await expect(cleanupPendingDocumentDeletions(1)).resolves.toEqual({
        selected: 1,
        deleted: 0,
        failed: 1,
      });
      const blocked = await prisma.document.findUniqueOrThrow({
        where: { id: blockedDocumentId },
        select: { deletedAt: true, failureCode: true },
      });
      expect(blocked.failureCode).toBe("DOCUMENT_DELETION_RETRY");
      expect(blocked.deletedAt!.getTime()).toBeGreaterThan(Date.now());

      await expect(cleanupPendingDocumentDeletions(1)).resolves.toEqual({
        selected: 1,
        deleted: 1,
        failed: 0,
      });
      await expect(
        prisma.document.findUnique({ where: { id: healthyDocumentId } }),
      ).resolves.toBeNull();
      await expect(storage.read(healthyKey)).rejects.toThrow();
    } finally {
      await storage.delete(healthyKey);
      await prisma.document.deleteMany({ where: { id: blockedDocumentId } });
    }
  });

  it("processes a private source into evidence and a Today action", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Pipeline User",
        email: "pipeline.integration@example.test",
        emailVerified: true,
      },
    });
    const workspaceId = await ensurePersonalWorkspace(prisma, user);
    const documentId = crypto.randomUUID();
    const bytes = new TextEncoder().encode("%PDF-1.7\nfictional test source");
    const objectKey = createDocumentObjectKey(workspaceId, documentId, "pdf");
    await getDocumentStorage().put(objectKey, bytes);

    try {
      await prisma.document.create({
        data: {
          id: documentId,
          workspaceId,
          uploadedById: user.id,
          title: "Pending analysis",
          originalFileName: "fixture.pdf",
          status: "QUEUED",
          file: {
            create: {
              storageProvider: "local-private",
              objectKey,
              verifiedMimeType: "application/pdf",
              extension: "pdf",
              sizeBytes: bytes.byteLength,
              sha256: sha256(bytes),
            },
          },
          job: { create: {} },
        },
      });

      await expect(processDocument(documentId)).resolves.toEqual({
        status: "ready",
      });

      const stored = await prisma.document.findUniqueOrThrow({
        where: { id: documentId },
        include: {
          analyses: { include: { entities: true } },
          actions: true,
          job: true,
        },
      });
      expect(stored.status).toBe("READY");
      expect(stored.job?.status).toBe("READY");
      expect(stored.analyses[0]?.entities[0]).toMatchObject({
        type: "deadline",
        pageNumber: 1,
      });
      expect(stored.actions[0]).toMatchObject({
        title: "Submit requested information",
        status: "OPEN",
        sourceDocumentId: documentId,
        sourcePageNumber: 1,
      });

      const actionId = stored.actions[0]!.id;
      await expect(
        deleteDocument({ userId: user.id }, documentId),
      ).resolves.toEqual({ deleted: true, pending: false });
      await expect(getDocumentStorage().read(objectKey)).rejects.toThrow();
      await expect(
        prisma.document.findUnique({ where: { id: documentId } }),
      ).resolves.toBeNull();
      await expect(
        prisma.actionItem.findUnique({ where: { id: actionId } }),
      ).resolves.toBeNull();
      for (const eventType of [
        "document.deletion.requested",
        "document.deleted",
      ]) {
        await expect(
          prisma.auditEvent.count({
            where: {
              actorUserId: user.id,
              entityId: documentId,
              eventType,
            },
          }),
        ).resolves.toBe(1);
      }
    } finally {
      await getDocumentStorage().delete(objectKey);
    }
  });

  it("fails terminally when the stored source no longer matches its verified hash", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Integrity User",
        email: "integrity.integration@example.test",
        emailVerified: true,
      },
    });
    const workspaceId = await ensurePersonalWorkspace(prisma, user);
    const documentId = crypto.randomUUID();
    const expectedBytes = new TextEncoder().encode(
      "%PDF-1.7\nexpected integrity source",
    );
    const storedBytes = new TextEncoder().encode(
      "%PDF-1.7\nmodified integrity source",
    );
    const objectKey = createDocumentObjectKey(workspaceId, documentId, "pdf");
    await getDocumentStorage().put(objectKey, storedBytes);

    try {
      await prisma.document.create({
        data: {
          id: documentId,
          workspaceId,
          uploadedById: user.id,
          title: "Integrity fixture",
          originalFileName: "integrity.pdf",
          status: "QUEUED",
          file: {
            create: {
              storageProvider: "local-private",
              objectKey,
              verifiedMimeType: "application/pdf",
              extension: "pdf",
              sizeBytes: storedBytes.byteLength,
              sha256: sha256(expectedBytes),
            },
          },
          job: { create: {} },
        },
      });

      await expect(processDocument(documentId)).resolves.toEqual({
        status: "failed",
        errorCode: "DOCUMENT_SOURCE_INTEGRITY_FAILED",
      });

      await expect(
        prisma.document.findUniqueOrThrow({
          where: { id: documentId },
          select: {
            status: true,
            failureCode: true,
            failureMessage: true,
            job: { select: { status: true, attempts: true } },
            _count: { select: { analyses: true, actions: true } },
          },
        }),
      ).resolves.toMatchObject({
        status: "FAILED",
        failureCode: "DOCUMENT_SOURCE_INTEGRITY_FAILED",
        failureMessage:
          "The stored source no longer matches the verified upload. Analysis stopped safely.",
        job: { status: "FAILED", attempts: 1 },
        _count: { analyses: 0, actions: 0 },
      });
      await expect(
        prisma.auditEvent.count({
          where: {
            workspaceId,
            actorUserId: user.id,
            entityId: documentId,
            eventType: "document.source.integrity_failed",
          },
        }),
      ).resolves.toBe(1);
      await expect(processDocument(documentId)).resolves.toEqual({
        status: "not-claimed",
      });
    } finally {
      await getDocumentStorage().delete(objectKey);
    }
  });

  it("invalidates a processing lease before deleting its private source", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Deletion Race User",
        email: "deletion-race.integration@example.test",
        emailVerified: true,
      },
    });
    const workspaceId = await ensurePersonalWorkspace(prisma, user);
    const documentId = crypto.randomUUID();
    const bytes = new TextEncoder().encode("%PDF-1.7\nleased deletion fixture");
    const objectKey = createDocumentObjectKey(workspaceId, documentId, "pdf");
    await getDocumentStorage().put(objectKey, bytes);

    try {
      await prisma.document.create({
        data: {
          id: documentId,
          workspaceId,
          uploadedById: user.id,
          title: "Leased analysis",
          originalFileName: "leased.pdf",
          status: "PROCESSING",
          file: {
            create: {
              storageProvider: "local-private",
              objectKey,
              verifiedMimeType: "application/pdf",
              extension: "pdf",
              sizeBytes: bytes.byteLength,
              sha256: "c".repeat(64),
            },
          },
          job: {
            create: {
              status: "PROCESSING",
              attempts: 1,
              lockedAt: new Date(),
              lockedBy: "leased-worker",
            },
          },
        },
      });

      await expect(
        deleteDocument({ userId: user.id }, documentId),
      ).resolves.toEqual({ deleted: true, pending: false });
      await expect(processDocument(documentId)).resolves.toEqual({
        status: "not-claimed",
      });
      await expect(
        prisma.document.findUnique({ where: { id: documentId } }),
      ).resolves.toBeNull();
      expect(
        await prisma.actionItem.count({
          where: { sourceDocumentId: documentId },
        }),
      ).toBe(0);
      await expect(getDocumentStorage().read(objectKey)).rejects.toThrow();
    } finally {
      await getDocumentStorage().delete(objectKey);
    }
  });

  it("recovers a stale processing lease through the durable runner", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Recovery User",
        email: "recovery.integration@example.test",
        emailVerified: true,
      },
    });
    const workspaceId = await ensurePersonalWorkspace(prisma, user);
    const documentId = crypto.randomUUID();
    const bytes = new TextEncoder().encode("%PDF-1.7\nrecovery fixture");
    const objectKey = createDocumentObjectKey(workspaceId, documentId, "pdf");
    await getDocumentStorage().put(objectKey, bytes);

    try {
      await prisma.document.create({
        data: {
          id: documentId,
          workspaceId,
          uploadedById: user.id,
          title: "Interrupted analysis",
          originalFileName: "recovery.pdf",
          status: "PROCESSING",
          file: {
            create: {
              storageProvider: "local-private",
              objectKey,
              verifiedMimeType: "application/pdf",
              extension: "pdf",
              sizeBytes: bytes.byteLength,
              sha256: sha256(bytes),
            },
          },
          job: {
            create: {
              status: "PROCESSING",
              attempts: 1,
              lockedAt: new Date(Date.now() - 20 * 60 * 1000),
              lockedBy: "interrupted-worker",
            },
          },
        },
      });

      await expect(processAvailableDocumentJobs(1)).resolves.toMatchObject({
        selected: 1,
        ready: 1,
      });
      await expect(
        prisma.document.findUniqueOrThrow({
          where: { id: documentId },
          select: {
            status: true,
            job: { select: { status: true, attempts: true } },
            _count: { select: { analyses: true, actions: true } },
          },
        }),
      ).resolves.toMatchObject({
        status: "READY",
        job: { status: "READY", attempts: 2 },
        _count: { analyses: 1, actions: 1 },
      });
    } finally {
      await getDocumentStorage().delete(objectKey);
    }
  });

  it("atomically limits all upload attempts, not only successful files", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Rate Limited User",
        email: "rate-limit.integration@example.test",
        emailVerified: true,
      },
    });
    const workspaceId = await ensurePersonalWorkspace(prisma, user);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await consumeUploadAttempt({ userId: user.id, workspaceId });
    }

    await expect(
      consumeUploadAttempt({ userId: user.id, workspaceId }),
    ).rejects.toBeInstanceOf(UploadRateLimitError);
    expect(
      await prisma.auditEvent.count({
        where: {
          actorUserId: user.id,
          eventType: "document.upload.attempted",
        },
      }),
    ).toBe(10);
  });
});

describe("document chat persistence", () => {
  it("cannot resurrect a chat when its source is deleted during generation", async () => {
    const { viewer, document } = await fixture();
    let started!: () => void;
    let release!: () => void;
    const waiting = new Promise<void>((resolve) => {
      started = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const spy = vi.spyOn(chatProviders, "getChatProvider").mockReturnValue({
      async answer(context) {
        started();
        await gate;
        return {
          result: {
            answer: "Source answer",
            sourceIds: [context.sources[0]!.id],
            insufficientEvidence: false,
          },
          provider: "test",
          model: "test",
          inputTokens: 0,
          outputTokens: 0,
        };
      },
    });
    try {
      const pending = askDocument(viewer, document.id, {
        requestId: randomUUID(),
        question: "Deadline?",
      });
      const rejected = expect(pending).rejects.toMatchObject({
        code: "CHAT_NO_LONGER_AVAILABLE",
      });
      await waiting;
      await prisma.documentAnalysis.deleteMany({
        where: { documentId: document.id },
      });
      release();
      await rejected;
      expect(
        await prisma.chatTurn.count({ where: { documentId: document.id } }),
      ).toBe(0);
    } finally {
      release();
      spy.mockRestore();
    }
  });

  async function fixture() {
    const user = await prisma.user.create({
      data: { name: "Chat Owner", email: `chat-${randomUUID()}@example.test` },
    });
    const workspaceId = await ensurePersonalWorkspace(prisma, user);
    const document = await prisma.document.create({
      data: {
        workspaceId,
        uploadedById: user.id,
        title: "Chat source",
        originalFileName: "chat.pdf",
        status: "READY",
        analyses: {
          create: {
            version: 1,
            status: "READY",
            provider: "test",
            model: "test",
            schemaVersion: "v1",
            promptVersion: "v1",
            summary: "Reply by 31 December 2099.",
          },
        },
      },
      include: { analyses: true },
    });
    const viewer = { session: { user }, workspaceId } as ViewerContext;
    return { user, workspaceId, document, viewer };
  }
  it("persists an answer once for repeated request IDs and rejects changed reuse", async () => {
    const { viewer, document } = await fixture();
    const input = {
      requestId: randomUUID(),
      question: "What is the deadline?",
    };
    const [id, duplicate] = await Promise.all([
      askDocument(viewer, document.id, input),
      askDocument(viewer, document.id, input),
    ]);
    expect(duplicate).toBe(id);
    const chat = await readChat(viewer, document.id);
    expect(chat.turns).toHaveLength(1);
    expect(chat.turns[0]).toMatchObject({
      status: "COMPLETE",
      citations: [{ id: document.analyses[0]!.id }],
    });
    await expect(
      askDocument(viewer, document.id, { ...input, question: "Changed" }),
    ).rejects.toMatchObject({ code: "REQUEST_CONFLICT" });
  });
  it("denies outsiders and keeps conversations private even between workspace members", async () => {
    const a = await fixture();
    const b = await fixture();
    await askDocument(a.viewer, a.document.id, {
      requestId: randomUUID(),
      question: "Deadline?",
    });
    await expect(readChat(b.viewer, a.document.id)).rejects.toBeInstanceOf(
      PrivateResourceNotFoundError,
    );
    await expect(
      askDocument(b.viewer, a.document.id, {
        requestId: randomUUID(),
        question: "Read secret",
      }),
    ).rejects.toBeInstanceOf(PrivateResourceNotFoundError);
    await prisma.workspaceMember.create({
      data: { workspaceId: a.workspaceId, userId: b.user.id, role: "MEMBER" },
    });
    expect((await readChat(b.viewer, a.document.id)).turns).toEqual([]);
  });
  it("removes chat derivatives when the analysis is deleted", async () => {
    const { viewer, document } = await fixture();
    await askDocument(viewer, document.id, {
      requestId: randomUUID(),
      question: "Deadline?",
    });
    await prisma.documentAnalysis.deleteMany({
      where: { documentId: document.id },
    });
    expect(
      await prisma.chatTurn.count({ where: { documentId: document.id } }),
    ).toBe(0);
    await expect(
      askDocument(viewer, document.id, {
        requestId: randomUUID(),
        question: "Again?",
      }),
    ).rejects.toMatchObject({ code: "DOCUMENT_NOT_READY" });
  });
  it("enforces the daily limit from audit records even after history was cleared", async () => {
    const { viewer, document, workspaceId, user } = await fixture();
    await prisma.auditEvent.createMany({
      data: Array.from({ length: 50 }, () => ({
        workspaceId,
        actorUserId: user.id,
        eventType: "chat.requested",
        entityType: "chat",
      })),
    });
    await expect(
      askDocument(viewer, document.id, {
        requestId: randomUUID(),
        question: "Again?",
      }),
    ).rejects.toMatchObject({ code: "CHAT_DAILY_LIMIT" });
    expect(
      await prisma.chatTurn.count({ where: { documentId: document.id } }),
    ).toBe(0);
  });
});

describe("personal workspace exports", () => {
  it("excludes outsiders, deleted records, other members' chats and credentials", async () => {
    const a = await prisma.user.create({
      data: {
        name: "Export Owner",
        email: `export-${randomUUID()}@example.test`,
      },
    });
    const b = await prisma.user.create({
      data: {
        name: "Export Other",
        email: `export-${randomUUID()}@example.test`,
      },
    });
    const workspaceId = await ensurePersonalWorkspace(prisma, a);
    const otherId = await ensurePersonalWorkspace(prisma, b);
    await prisma.workspaceMember.create({
      data: { workspaceId, userId: b.id, role: "MEMBER" },
    });
    await prisma.session.create({
      data: {
        userId: a.id,
        token: "export-secret-token",
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    const source = await prisma.document.create({
      data: {
        workspaceId,
        uploadedById: a.id,
        title: "Included source",
        originalFileName: "source.pdf",
        status: "READY",
        analyses: {
          create: {
            version: 1,
            provider: "test",
            model: "test",
            schemaVersion: "v1",
            promptVersion: "v1",
            summary: "Included summary",
            status: "READY",
          },
        },
      },
      include: { analyses: true },
    });
    await prisma.document.createMany({
      data: [
        {
          workspaceId,
          uploadedById: a.id,
          title: "Deleted secret",
          originalFileName: "deleted.pdf",
          deletedAt: new Date(),
        },
        {
          workspaceId: otherId,
          uploadedById: b.id,
          title: "Outsider secret",
          originalFileName: "other.pdf",
        },
      ],
    });
    await prisma.chatTurn.createMany({
      data: [a, b].map((user) => ({
        userId: user.id,
        documentId: source.id,
        analysisId: source.analyses[0]!.id,
        requestId: randomUUID(),
        question: user.id === a.id ? "Own question" : "Other member secret",
        status: "COMPLETE",
        answer: "Answer",
      })),
    });
    const viewer = { session: { user: a }, workspaceId } as ViewerContext;
    const body = await exportWorkspace(viewer);
    const data = JSON.parse(body);
    expect(data.documents).toHaveLength(1);
    expect(data.documents[0].analyses[0].summary).toBe("Included summary");
    expect(data.conversations).toHaveLength(1);
    expect(data.conversations[0].question).toBe("Own question");
    for (const forbidden of [
      "Deleted secret",
      "Outsider secret",
      "Other member secret",
      "export-secret-token",
      "objectKey",
      "password",
    ])
      expect(body).not.toContain(forbidden);
    await expect(
      exportWorkspace({ ...viewer, workspaceId: otherId }),
    ).rejects.toBeInstanceOf(PrivateResourceNotFoundError);
    await expect(
      exportWorkspace({ session: { user: b }, workspaceId } as ViewerContext),
    ).rejects.toBeInstanceOf(PrivateResourceNotFoundError);
    expect(
      await prisma.auditEvent.count({
        where: { actorUserId: a.id, eventType: "workspace.exported" },
      }),
    ).toBe(1);
    await prisma.actionItem.createMany({
      data: Array.from({ length: 501 }, (_, i) => ({
        workspaceId,
        createdById: a.id,
        title: `Action ${i}`,
      })),
    });
    await expect(exportWorkspace(viewer)).rejects.toBeInstanceOf(
      ExportTooLargeError,
    );
    expect(
      await prisma.auditEvent.count({
        where: { actorUserId: a.id, eventType: "workspace.exported" },
      }),
    ).toBe(1);
  });
});
