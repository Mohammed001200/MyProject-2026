import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <LegalPage
      eyebrow="Security"
      title="Trust must be designed, tested, and earned."
      intro="CIVORA’s security model starts with private data, explicit authorization, and evidence-backed AI."
    >
      <section>
        <h2>Current status</h2>
        <p>
          CIVORA is in active development and is not yet approved for storing
          real personal documents. The visible application currently uses
          fictional fixtures and local-only interactions.
        </p>
      </section>
      <section>
        <h2>Engineering direction</h2>
        <p>
          The production architecture targets workspace-scoped authorization,
          private object storage, server-side input validation, signed access,
          rate limiting, audit metadata, secret isolation, and dependency
          monitoring.
        </p>
      </section>
      <section>
        <h2>AI boundary</h2>
        <p>
          Uploaded content is untrusted data, never application instruction.
          Authorization filtering must occur before context construction, and
          important extracted values must be validated and traceable to source
          evidence.
        </p>
      </section>
      <section>
        <h2>Reporting</h2>
        <p>
          A coordinated vulnerability-reporting channel and response policy will
          be published before beta users are invited.
        </p>
      </section>
    </LegalPage>
  );
}
