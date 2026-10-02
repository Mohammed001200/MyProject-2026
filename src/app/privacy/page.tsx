import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Important information deserves careful boundaries."
      intro="This page records the intended privacy posture while CIVORA’s production data flows are being built."
    >
      <section>
        <h2>Data minimization</h2>
        <p>
          CIVORA should collect and retain only what is needed to provide the
          requested service. Sensitive source documents must not be copied into
          logs, analytics, or unrelated systems.
        </p>
      </section>
      <section>
        <h2>AI processing</h2>
        <p>
          Information sent to an AI provider should be limited to the material
          needed for the specific analysis. Summaries, translations, and the
          original source must remain clearly distinguishable.
        </p>
      </section>
      <section>
        <h2>Your controls</h2>
        <p>
          The production product is intended to support document deletion,
          account deletion, data export, and integration revocation with
          explicit deletion semantics for stored files and derived records.
        </p>
      </section>
      <section>
        <h2>Review required</h2>
        <p>
          Retention periods, legal bases, subprocessors, cross-border transfers,
          and user-rights procedures require jurisdiction-specific legal review
          before public launch.
        </p>
      </section>
    </LegalPage>
  );
}
