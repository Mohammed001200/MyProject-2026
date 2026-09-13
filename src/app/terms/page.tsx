import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Useful support, with honest limits."
      intro="These headings establish the future terms surface; they are not yet production terms of service."
    >
      <section>
        <h2>Product role</h2>
        <p>
          CIVORA organizes and explains information. It does not represent
          itself as a lawyer, doctor, financial adviser, government agency, or
          authoritative substitute for the original source.
        </p>
      </section>
      <section>
        <h2>User responsibility</h2>
        <p>
          Consequential decisions should be verified against the original
          document and, when appropriate, a qualified professional or issuing
          organization.
        </p>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <p>
          The final terms will prohibit abuse, unauthorized access, malicious
          uploads, and use that infringes another person’s rights.
        </p>
      </section>
      <section>
        <h2>Commercial terms</h2>
        <p>
          Subscription, cancellation, availability, liability, governing-law,
          and dispute terms will be finalized with professional legal review
          before billing is enabled.
        </p>
      </section>
    </LegalPage>
  );
}
