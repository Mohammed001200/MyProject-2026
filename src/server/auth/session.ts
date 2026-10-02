import "server-only";

import { headers } from "next/headers";
import { getAuth } from "@/server/auth/auth";
import { getPrisma } from "@/server/db/prisma";
import { ensurePersonalWorkspace } from "@/server/workspaces/service";

export async function getViewerContext() {
  const session = await getAuth().api.getSession({ headers: await headers() });

  if (!session) return null;

  const workspaceId = await ensurePersonalWorkspace(getPrisma(), {
    id: session.user.id,
    name: session.user.name,
  });

  return { session, workspaceId };
}
