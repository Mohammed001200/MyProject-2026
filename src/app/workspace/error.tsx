"use client";

import { ServiceUnavailable } from "@/components/service-unavailable";

export default function WorkspaceError({ reset }: { reset: () => void }) {
  return <ServiceUnavailable reset={reset} />;
}
