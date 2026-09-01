import { timingSafeEqual } from "node:crypto";
import { cleanupPendingDocumentDeletions } from "@/server/documents/delete-document";
import { processAvailableDocumentJobs } from "@/server/jobs/process-document";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request, secret: string) {
  const authorization = request.headers.get("authorization");
  if (!authorization) return false;

  const actual = Buffer.from(authorization);
  const expected = Buffer.from(`Bearer ${secret}`);
  return (
    actual.byteLength === expected.byteLength &&
    timingSafeEqual(actual, expected)
  );
}

export async function POST(request: Request) {
  const secret = process.env.CIVORA_JOB_SECRET?.trim();
  if (!secret || secret.length < 32) {
    return Response.json(
      { code: "JOB_RUNNER_NOT_CONFIGURED" },
      { status: 503 },
    );
  }
  if (!isAuthorized(request, secret)) {
    return Response.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }

  const [processing, deletions] = await Promise.all([
    processAvailableDocumentJobs(),
    cleanupPendingDocumentDeletions(),
  ]);
  return Response.json(
    { processing, deletions },
    {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    },
  );
}
