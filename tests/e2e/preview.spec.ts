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
