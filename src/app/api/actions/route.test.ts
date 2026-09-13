// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/server/auth/authorization", () => ({
  requireViewer: vi.fn(),
  UnauthenticatedError: class extends Error {
    code = "UNAUTHENTICATED";
  },
}));
const database = vi.hoisted(() => ({
  actionItem: { create: vi.fn() },
  auditEvent: { create: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@/server/db/prisma", () => ({ getPrisma: () => database }));
import { POST } from "./route";
import {
  requireViewer,
  UnauthenticatedError,
} from "@/server/auth/authorization";
const details = {
  title: "Call the office",
  description: null,
  priority: "NORMAL",
  dueDate: null,
};
function create(body: unknown) {
  return POST(
    new Request("http://localhost/api/actions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}
describe("manual action creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireViewer).mockResolvedValue({
      session: { user: { id: "owner" } },
      workspaceId: "own-workspace",
    } as Awaited<ReturnType<typeof requireViewer>>);
    database.$transaction.mockResolvedValue([]);
  });
  it("binds the action and audit to the authenticated owner", async () => {
    const response = await create(details);
    expect(response.status).toBe(201);
    const { id } = await response.json();
    expect(database.actionItem.create).toHaveBeenCalledWith({
      data: {
        id,
        workspaceId: "own-workspace",
        createdById: "owner",
        title: details.title,
        description: null,
        priority: "NORMAL",
        dueAt: null,
        dueDateIsAllDay: true,
      },
    });
    expect(database.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entityId: id,
        workspaceId: "own-workspace",
        actorUserId: "owner",
        eventType: "action.created",
      }),
    });
    expect(database.$transaction).toHaveBeenCalledOnce();
  });
  it.each(["workspaceId", "createdById", "sourceDocumentId", "status"])(
    "rejects injected %s",
    async (field) => {
      expect((await create({ ...details, [field]: "other" })).status).toBe(400);
      expect(database.$transaction).not.toHaveBeenCalled();
    },
  );
  it("requires authentication before writes", async () => {
    vi.mocked(requireViewer).mockRejectedValue(new UnauthenticatedError());
    expect((await create(details)).status).toBe(401);
    expect(database.$transaction).not.toHaveBeenCalled();
  });
  it("does not claim success when persistence fails", async () => {
    database.$transaction.mockRejectedValueOnce(
      new Error("database unavailable"),
    );
    expect((await create(details)).status).toBe(500);
  });
});
