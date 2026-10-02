type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export function isExplicitCiE2EEnvironment(
  source: EnvironmentSource = process.env,
) {
  return (
    source.CI === "true" &&
    source.CIVORA_E2E_DATABASE === "true" &&
    source.CIVORA_INTEGRATION_TESTS === "true" &&
    source.CIVORA_AI_DRIVER === "integration-test"
  );
}
