import {
  ArrowRight,
  Check,
  Database,
  Fingerprint,
  SlidersHorizontal,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui/button-link";
import { SignOutButton } from "@/features/workspace/sign-out-button";

const foundations = [
  {
    icon: Fingerprint,
    title: "Server-validated session",
    detail: "Your identity is resolved on the server.",
  },
  {
    icon: Database,
    title: "Personal workspace",
    detail: "Membership is the boundary for future records.",
  },
  {
    icon: SlidersHorizontal,
    title: "Preferences saved",
    detail: "Language, time zone, and explanation style persist.",
  },
] as const;

type WorkspaceHomeProps = {
  firstName: string;
  workspaceName: string;
};

export function WorkspaceHome({
  firstName,
  workspaceName,
}: WorkspaceHomeProps) {
  return (
    <main className="min-h-dvh bg-canvas">
      <header className="border-b border-line bg-canvas/88 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-5 sm:px-8">
          <Brand />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-line">
        <div className="civora-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid max-w-[1180px] gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-wash px-3 py-2 text-xs font-extrabold text-brand">
              <Check className="h-3.5 w-3.5" />
              Identity foundation active
            </div>
            <h1 className="display-type text-balance mt-7 text-6xl font-medium leading-[0.9] tracking-[-0.05em] text-ink sm:text-7xl">
              Your space is ready,
              <span className="block italic text-brand">{firstName}.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-ink-soft sm:text-lg">
              <strong className="text-ink">{workspaceName}</strong> now has a
              persisted identity and tenant boundary. Real document ingestion
              remains closed until private storage and authorization tests are
              complete.
            </p>
            <ButtonLink href="/app/today" className="mt-8 min-h-13 px-6">
              Explore the fictional product preview
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>

          <div className="border-y border-line bg-surface/65 px-5 py-2 sm:px-6">
            {foundations.map(({ icon: Icon, title, detail }) => (
              <div
                key={title}
                className="grid grid-cols-[44px_1fr] gap-4 border-b border-line py-5 last:border-0"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-wash text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold text-ink">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-ink-soft">
                    {detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8">
        <p className="eyebrow text-ink-faint">Next engineering gate</p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
          Authenticated upload, private object storage, byte-level validation,
          and cross-workspace denial tests must pass before this surface accepts
          personal documents.
        </p>
      </section>
    </main>
  );
}
