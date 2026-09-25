// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/server/auth/authorization", () => ({
  requireViewer: vi.fn(),
  UnauthenticatedError: class extends Error {},
  PrivateResourceNotFoundError: class extends Error {},
}));
vi.mock("@/server/chat/service", () => ({
  readChat: vi.fn(),
  askDocument: vi.fn(),
}));
vi.mock("@/server/chat/provider", () => ({
  ChatError: class extends Error {
    constructor(
      public code: string,
      public status: number,
    ) {
      super(code);
    }
  },
}));
vi.mock("@/server/db/prisma", () => ({ getPrisma: vi.fn() }));
import {
  requireViewer,
  UnauthenticatedError,
  PrivateResourceNotFoundError,
} from "@/server/auth/authorization";
import { askDocument, readChat } from "@/server/chat/service";
import { GET, POST, DELETE } from "./route";
const params = {
  params: Promise.resolve({ id: "90000000-0000-4000-8000-000000000001" }),
};
describe("chat route boundaries", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  it.each([GET, POST, DELETE])(
    "requires a session before any access",
    async (handler) => {
      vi.mocked(requireViewer).mockRejectedValue(new UnauthenticatedError());
      expect(
        (await handler(new Request("http://localhost/chat"), params)).status,
      ).toBe(401);
      expect(readChat).not.toHaveBeenCalled();
      expect(askDocument).not.toHaveBeenCalled();
    },
  );
  it("does not reveal another user's document", async () => {
    vi.mocked(requireViewer).mockResolvedValue(
      {} as Awaited<ReturnType<typeof requireViewer>>,
    );
    vi.mocked(readChat).mockRejectedValue(new PrivateResourceNotFoundError());
    const response = await GET(new Request("http://localhost/chat"), params);
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("rejects an oversized body before model access", async () => {
    vi.mocked(requireViewer).mockResolvedValue(
      {} as Awaited<ReturnType<typeof requireViewer>>,
    );
    const response = await POST(
      new Request("http://localhost/chat", {
        method: "POST",
        body: "x".repeat(12001),
      }),
      params,
    );
    expect(response.status).toBe(400);
    expect(askDocument).not.toHaveBeenCalled();
  });
});
