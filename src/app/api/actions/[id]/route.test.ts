// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/authorization", () => ({
  requireViewer: vi.fn(),
  requireActionAccess: vi.fn(),
  principalFromViewer: () => ({ userId: "owner" }),
  UnauthenticatedError: class extends Error {
    code = "UNAUTHENTICATED";
  },
  PrivateResourceNotFoundError: class extends Error {
    code = "PRIVATE_RESOURCE_NOT_FOUND";
  },
}));
const database = vi.hoisted(() => ({
  actionItem: { update: vi.fn() },
  auditEvent: { create: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/server/db/prisma", () => ({ getPrisma: () => database }));

import { PATCH } from "./route";
import {
  requireViewer,
  requireActionAccess,
  UnauthenticatedError,
  PrivateResourceNotFoundError,
} from "@/server/auth/authorization";

function update(body: string) {
  return PATCH(
    new Request("http://localhost/api/actions/action", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body,
    }),
    { params: Promise.resolve({ id: "action" }) },
  );
}

describe("action status updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireViewer).mockResolvedValue({
      session: { user: { id: "owner" } },
    } as Awaited<ReturnType<typeof requireViewer>>);
    vi.mocked(requireActionAccess).mockResolvedValue({
      id: "action",
      workspaceId: "workspace",
    } as Awaited<ReturnType<typeof requireActionAccess>>);
    database.$transaction.mockResolvedValue([]);
  });

  it.each([
    ["OPEN", "action.reopened"],
    ["COMPLETED", "action.completed"],
    ["DISMISSED", "action.dismissed"],
  ])(
    "persists %s with consistent timestamps and audit event",
    async (status, eventType) => {
      const response = await update(JSON.stringify({ status }));
      expect(response.status).toBe(200);
      expect(database.actionItem.update).toHaveBeenCalledWith({
        where: { id: "action" },
        data: {
          status,
          completedAt: status === "COMPLETED" ? expect.any(Date) : null,
          dismissedAt: status === "DISMISSED" ? expect.any(Date) : null,
        },
      });
      expect(database.auditEvent.create).toHaveBeenCalledWith({
        data: {
          workspaceId: "workspace",
          actorUserId: "owner",
          eventType,
          entityType: "action",
          entityId: "action",
        },
      });
      expect(database.$transaction).toHaveBeenCalledOnce();
    },
  );

  it.each([
    "{",
    '{"status":"INVALID"}',
    '{"status":"OPEN","workspaceId":"other"}',
  ])("rejects invalid or excess input: %s", async (body) => {
    expect((await update(body)).status).toBe(400);
    expect(database.$transaction).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated updates before accessing an action", async () => {
    vi.mocked(requireViewer).mockRejectedValue(new UnauthenticatedError());
    expect((await update('{"status":"DISMISSED"}')).status).toBe(401);
    expect(requireActionAccess).not.toHaveBeenCalled();
    expect(database.$transaction).not.toHaveBeenCalled();
  });

  it("denies a foreign or withheld action without a write", async () => {
    vi.mocked(requireActionAccess).mockRejectedValue(
      new PrivateResourceNotFoundError(),
    );
    expect((await update('{"status":"DISMISSED"}')).status).toBe(404);
    expect(database.$transaction).not.toHaveBeenCalled();
  });
});
