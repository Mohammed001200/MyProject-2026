// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const jobs = vi.hoisted(() => ({
  process: vi.fn(),
  cleanup: vi.fn(),
}));
vi.mock("@/server/jobs/process-document", () => ({
  processAvailableDocumentJobs: jobs.process,
}));
vi.mock("@/server/documents/delete-document", () => ({
  cleanupPendingDocumentDeletions: jobs.cleanup,
}));
import { GET, POST } from "./route";

const cronSecret = "c".repeat(32);
const workerSecret = "w".repeat(32);

describe("document scheduler authorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("CRON_SECRET", cronSecret);
    vi.stubEnv("CIVORA_JOB_SECRET", workerSecret);
    jobs.process.mockResolvedValue({ selected: 0, ready: 0 });
    jobs.cleanup.mockResolvedValue({ selected: 0 });
  });
  afterEach(() => vi.unstubAllEnvs());

  for (const [method, handler, envName, secret, otherSecret] of [
    ["GET", GET, "CRON_SECRET", cronSecret, workerSecret],
    ["POST", POST, "CIVORA_JOB_SECRET", workerSecret, cronSecret],
  ] as const) {
    describe(method, () => {
      function request(token?: string) {
        return new Request("http://localhost/api/internal/jobs/documents", {
          method,
          headers: token ? { authorization: `Bearer ${token}` } : {},
        });
      }

      it.each(["", "short"])(
        "fails closed with invalid configuration %s",
        async (value) => {
          vi.stubEnv(envName, value);
          expect((await handler(request(secret))).status).toBe(503);
          expect(jobs.process).not.toHaveBeenCalled();
          expect(jobs.cleanup).not.toHaveBeenCalled();
        },
      );

      it.each([undefined, "wrong", otherSecret])(
        "rejects invalid credentials %s",
        async (token) => {
          expect((await handler(request(token))).status).toBe(401);
          expect(jobs.process).not.toHaveBeenCalled();
          expect(jobs.cleanup).not.toHaveBeenCalled();
        },
      );

      it("runs processing and deletion cleanup with the correct credential", async () => {
        const response = await handler(request(secret));
        expect(response.status).toBe(200);
        expect(response.headers.get("cache-control")).toContain("no-store");
        expect(jobs.process).toHaveBeenCalledOnce();
        expect(jobs.cleanup).toHaveBeenCalledOnce();
        expect(await response.json()).toEqual({
          processing: { selected: 0, ready: 0 },
          deletions: { selected: 0 },
        });
      });
    });
  }
});
