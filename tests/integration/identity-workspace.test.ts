import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import {
  PrivateResourceNotFoundError,
  requireDocumentAccess,
  requireWorkspaceAccess,
} from "@/server/auth/authorization";
import { getAuth } from "@/server/auth/auth";
import { getPrisma } from "@/server/db/prisma";
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
  });
});
