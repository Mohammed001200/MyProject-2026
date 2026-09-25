// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/server/auth/authorization", () => ({
  requireViewer: vi.fn(),
  UnauthenticatedError: class extends Error {},
  PrivateResourceNotFoundError: class extends Error {},
}));
vi.mock("@/server/privacy/export", () => ({
  exportWorkspace: vi.fn(),
  ExportTooLargeError: class extends Error {},
}));
import {
  requireViewer,
  UnauthenticatedError,
  PrivateResourceNotFoundError,
} from "@/server/auth/authorization";
import { exportWorkspace, ExportTooLargeError } from "@/server/privacy/export";
import { GET } from "./route";
describe("workspace export endpoint", () => {
  beforeEach(() => vi.resetAllMocks());
  it("requires authentication before reading any data", async () => {
    vi.mocked(requireViewer).mockRejectedValue(new UnauthenticatedError());
    expect((await GET()).status).toBe(401);
    expect(exportWorkspace).not.toHaveBeenCalled();
  });
  it("downloads only the export resolved from the session", async () => {
    const viewer = {} as Awaited<ReturnType<typeof requireViewer>>;
    vi.mocked(requireViewer).mockResolvedValue(viewer);
    vi.mocked(exportWorkspace).mockResolvedValue('{"format":"test"}');
    const response = await GET();
    expect(exportWorkspace).toHaveBeenCalledWith(viewer);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await response.json()).toEqual({ format: "test" });
  });
  it.each([
    [new PrivateResourceNotFoundError(), 404, "NOT_FOUND"],
    [new ExportTooLargeError(), 413, "EXPORT_TOO_LARGE"],
    [new Error("private credentials"), 500, "EXPORT_FAILED"],
  ])("returns safe failures", async (error, status, code) => {
    vi.mocked(requireViewer).mockResolvedValue(
      {} as Awaited<ReturnType<typeof requireViewer>>,
    );
    vi.mocked(exportWorkspace).mockRejectedValue(error);
    const response = await GET();
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ code });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
