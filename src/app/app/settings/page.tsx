import { SettingsPreview } from "@/features/settings/settings-preview";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-[900px] px-4 pb-28 pt-8 sm:px-7 sm:pt-12 lg:px-10 lg:pb-16">
      <p className="eyebrow text-brand">Settings</p>
      <h1 className="display-type mt-3 text-4xl font-medium tracking-[-0.035em] text-ink sm:text-5xl">
        Your CIVORA, on your terms.
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
        Local interaction previews only; no preference is represented as
        persisted yet.
      </p>
      <div className="mt-9">
        <SettingsPreview />
      </div>
    </div>
  );
}
