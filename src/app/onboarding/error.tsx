"use client";

import { ServiceUnavailable } from "@/components/service-unavailable";

export default function OnboardingError({ reset }: { reset: () => void }) {
  return <ServiceUnavailable reset={reset} />;
}
