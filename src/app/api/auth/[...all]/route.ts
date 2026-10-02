import { passwordRecoveryAvailable } from "@/server/email/password-reset";
import { getAuth } from "@/server/auth/auth";
import { isConfigurationError } from "@/server/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleAuthRequest(request: Request) {
  try {
    const path = new URL(request.url).pathname.replace(/\/+$/, "");
    if (
      request.method === "POST" &&
      path === "/api/auth/request-password-reset" &&
      !passwordRecoveryAvailable()
    ) {
      return Response.json(
        {
          code: "PASSWORD_RECOVERY_UNAVAILABLE",
          message: "Password recovery is not available in this environment.",
        },
        { status: 503, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    const response = await getAuth().handler(request);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch (error) {
    if (isConfigurationError(error)) {
      return Response.json(
        {
          code: "AUTH_NOT_CONFIGURED",
          message: "Authentication is not available in this environment.",
        },
        { status: 503 },
      );
    }

    console.error("[auth] Request failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    return Response.json(
      {
        code: "AUTH_UNAVAILABLE",
        message: "Authentication is temporarily unavailable.",
      },
      { status: 503 },
    );
  }
}

export {
  handleAuthRequest as DELETE,
  handleAuthRequest as GET,
  handleAuthRequest as PATCH,
  handleAuthRequest as POST,
  handleAuthRequest as PUT,
};
