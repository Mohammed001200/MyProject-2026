import { DemoAi } from "@/features/ai/demo-ai";

export default function AiPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-28 pt-8 sm:px-7 sm:pt-12 lg:px-10 lg:pb-16">
      <p className="eyebrow text-brand">CIVORA AI</p>
      <h1 className="display-type mt-3 text-4xl font-medium tracking-[-0.035em] text-ink sm:text-5xl">
        Ask your information, not the internet.
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
        A source-grounded interaction preview using only clearly fictional
        fixtures.
      </p>
      <div className="mt-9">
        <DemoAi />
      </div>
    </div>
  );
}
