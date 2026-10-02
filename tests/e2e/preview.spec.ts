import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const artifactDirectory = join(process.cwd(), "artifacts", "ui");

test.beforeAll(async () => {
  await mkdir(artifactDirectory, { recursive: true });
});

test("landing page communicates the product and has no horizontal overflow", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: /Life admin, finally clear/i }),
  ).toBeVisible();
  await expect(page.getByText("Source-backed answers")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Explore your day" }),
  ).toHaveAttribute("href", "/app/today");
  if (testInfo.project.name === "desktop-edge") {
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/auth/sign-in",
    );
  } else {
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/auth/sign-in",
    );
  }

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);

  if (testInfo.project.name === "desktop-edge") {
    await page.screenshot({
      path: join(artifactDirectory, "landing-desktop.png"),
      fullPage: true,
    });
  }
});

test("Today preview is explicit and interactive", async ({
  page,
}, testInfo) => {
  await page.goto("/app/today");
  await expect(
    page.getByRole("heading", { level: 1, name: /Good afternoon, Maya/i }),
  ).toBeVisible();
  await expect(page.getByText("Fictional preview data")).toBeVisible();

  const firstDone = page
    .getByRole("button", { name: /^Mark .* complete$/ })
    .first();
  await firstDone.click();
  await expect(page.getByText("Completed in this preview")).toBeVisible();

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);

  await page.screenshot({
    path: join(
      artifactDirectory,
      testInfo.project.name === "mobile-edge"
        ? "today-mobile.png"
        : "today-desktop.png",
    ),
    fullPage: true,
  });
});

test("auth stays honest when server credentials are absent", async ({
  page,
}, testInfo) => {
  await page.goto("/auth/sign-in");
  await expect(
    page.getByRole("heading", { level: 1, name: "Continue calmly." }),
  ).toBeVisible();

  const configured = Boolean(
    process.env.DATABASE_URL?.trim() &&
    process.env.BETTER_AUTH_SECRET &&
    process.env.BETTER_AUTH_SECRET.length >= 32,
  );

  if (configured) {
    await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  } else {
    await expect(
      page.getByText("Sign-in is not enabled in this preview environment yet"),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeDisabled();

    const response = await page.request.get("/api/auth/get-session");
    expect(response.status()).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "AUTH_NOT_CONFIGURED",
    });

    await page.goto("/workspace");
    await expect(page).toHaveURL(/\/auth\/sign-in$/);
  }

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);

  await page.goto("/auth/sign-in");
  await page.screenshot({
    path: join(
      artifactDirectory,
      testInfo.project.name === "mobile-edge"
        ? "auth-mobile.png"
        : "auth-desktop.png",
    ),
    fullPage: true,
  });
});

test("password recovery has honest unavailable and invalid-link states", async ({
  page,
}) => {
  test.skip(
    Boolean(process.env.RESEND_API_KEY),
    "This check targets an unconfigured mail environment.",
  );
  await page.goto("/auth/sign-in");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/\/auth\/forgot-password$/);
  await expect(page.getByRole("status")).toContainText("not enabled");
  await expect(
    page.getByRole("button", { name: "Send reset link" }),
  ).toHaveCount(0);
  const response = await page.request.post("/api/auth/request-password-reset", {
    data: { email: "fictional@example.test" },
  });
  expect(response.status()).toBe(503);
  await page.goto("/auth/reset-password?token=bad");
  await expect(page.getByRole("status")).toContainText("missing or invalid");
  await expect(
    page.getByRole("link", { name: "Request a new link" }),
  ).toBeVisible();
  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute(
    "content",
    "no-referrer",
  );
});
