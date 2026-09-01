import { expect, test, type Page } from "@playwright/test";

const password = "correct-horse-battery-staple";

async function createAccountAndOnboard(
  page: Page,
  account: { email: string; name: string },
) {
  await page.goto("/auth/sign-up");
  await page.getByLabel("Full name").fill(account.name);
  await page.getByLabel("Email").fill(account.email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="passwordConfirmation"]').fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/auth\/sign-in\?created=1$/);
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/onboarding$/);
  const simpleStyle = page.getByRole("radio", { name: /Simple/ });
  await page.getByText("Simple", { exact: true }).click();
  await expect(simpleStyle).toBeChecked();
  await page.getByRole("button", { name: "Enter my workspace" }).click();
  await expect(page).toHaveURL(/\/workspace$/);
}

test.describe("authenticated critical path", () => {
  test.skip(
    process.env.CIVORA_E2E_DATABASE !== "true",
    "Requires an isolated PostgreSQL database and deterministic AI provider.",
  );

  test("signup to source-backed completed action, with tenant isolation", async ({
    browser,
    page,
  }) => {
    test.setTimeout(90_000);
    const runId = crypto.randomUUID();
    await createAccountAndOnboard(page, {
      email: `owner-${runId}@example.test`,
      name: "Maya Owner",
    });

    await page.goto("/workspace/upload");
    await page.locator('input[type="file"]').setInputFiles({
      name: "fictional-information-request.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(
        "%PDF-1.7\nFictional E2E source. Respond no later than 31 December 2099.",
      ),
    });
    await expect(
      page.getByText("fictional-information-request.pdf"),
    ).toBeVisible();

    const uploadResponsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/documents") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Upload and analyze" }).click();
    const uploadResponse = await uploadResponsePromise;
    expect(uploadResponse.status()).toBe(202);
    const upload = (await uploadResponse.json()) as { documentId: string };

    await expect(page).toHaveURL(
      new RegExp(`/workspace/documents/${upload.documentId}$`),
    );
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Fictional information request",
      }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByText(
        "Send the requested fictional information before the deadline.",
      ),
    ).toBeVisible();
    await expect(
      page.getByText("A fictional agency requests additional information."),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Submit requested information" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Evidence from the source" }),
    ).toBeVisible();
    await expect(page.getByText("Response deadline")).toBeVisible();
    await expect(page.getByText("Page 1")).toBeVisible();
    await expect(
      page.getByText("Respond no later than 31 December 2099."),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Download source" }),
    ).toHaveAttribute("href", `/api/documents/${upload.documentId}/source`);

    const documentResponse = await page.evaluate(async (documentId) => {
      const response = await fetch(`/api/documents/${documentId}`);
      return {
        status: response.status,
        cacheControl: response.headers.get("cache-control"),
        body: (await response.json()) as {
          actions: Array<{ id: string; sourcePageNumber: number }>;
          status: string;
        },
      };
    }, upload.documentId);
    expect(documentResponse.status).toBe(200);
    expect(documentResponse.cacheControl).toContain("no-store");
    const document = documentResponse.body;
    expect(document.status).toBe("READY");
    expect(document.actions).toHaveLength(1);
    expect(document.actions[0]?.sourcePageNumber).toBe(1);
    const actionId = document.actions[0]!.id;

    const sourceResponse = await page.evaluate(async (documentId) => {
      const response = await fetch(`/api/documents/${documentId}/source`);
      return {
        status: response.status,
        contentType: response.headers.get("content-type"),
        cacheControl: response.headers.get("cache-control"),
        contentDisposition: response.headers.get("content-disposition"),
        prefix: Array.from(
          new Uint8Array(await response.arrayBuffer()).subarray(0, 5),
        ),
      };
    }, upload.documentId);
    expect(sourceResponse.status).toBe(200);
    expect(sourceResponse.contentType).toContain("application/pdf");
    expect(sourceResponse.cacheControl).toContain("no-store");
    expect(sourceResponse.contentDisposition).toContain("attachment");
    expect(String.fromCharCode(...sourceResponse.prefix)).toBe("%PDF-");

    const outsiderContext = await browser.newContext();
    try {
      const outsiderPage = await outsiderContext.newPage();
      await createAccountAndOnboard(outsiderPage, {
        email: `outsider-${runId}@example.test`,
        name: "Outside User",
      });
      const outsiderStatuses = await outsiderPage.evaluate(
        async ({ documentId, actionId }) => {
          const [document, source, deletion, action] = await Promise.all([
            fetch(`/api/documents/${documentId}`),
            fetch(`/api/documents/${documentId}/source`),
            fetch(`/api/documents/${documentId}`, { method: "DELETE" }),
            fetch(`/api/actions/${actionId}`, {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ status: "COMPLETED" }),
            }),
          ]);
          return [
            document.status,
            source.status,
            deletion.status,
            action.status,
          ];
        },
        { documentId: upload.documentId, actionId },
      );
      expect(outsiderStatuses).toEqual([404, 404, 404, 404]);
    } finally {
      await outsiderContext.close();
    }

    await page.goto("/workspace/today");
    const action = page.getByRole("article").filter({
      has: page.getByRole("heading", { name: "Submit requested information" }),
    });
    await expect(action).toBeVisible();
    await expect(
      action.getByRole("link", { name: "Fictional information request" }),
    ).toHaveAttribute("href", `/workspace/documents/${upload.documentId}`);

    const completeResponsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/actions/${actionId}`) &&
        response.request().method() === "PATCH",
    );
    await action.getByRole("button", { name: "Complete" }).click();
    expect((await completeResponsePromise).status()).toBe(200);
    await expect(action).toBeHidden();
    await expect(
      page.getByRole("heading", { name: "Nothing needs your attention." }),
    ).toBeVisible();

    await page.goto("/workspace/documents?q=Fictional");
    const libraryDocument = page.getByRole("article").filter({
      has: page.getByRole("heading", {
        name: "Fictional information request",
      }),
    });
    await expect(libraryDocument).toBeVisible();
    const openDocument = libraryDocument.getByRole("link", {
      name: "View document",
    });
    await expect(openDocument).toHaveAttribute(
      "href",
      `/workspace/documents/${upload.documentId}`,
    );
    await openDocument.click();
    await expect(page).toHaveURL(
      new RegExp(`/workspace/documents/${upload.documentId}$`),
    );

    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(
      page.getByRole("group", { name: "Confirm document deletion" }),
    ).toBeVisible();
    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/documents/${upload.documentId}`) &&
        response.request().method() === "DELETE",
    );
    await page.getByRole("button", { name: "Delete permanently" }).click();
    expect((await deleteResponsePromise).status()).toBe(200);
    await expect(page).toHaveURL(/\/workspace\/documents$/);
    await expect(libraryDocument).toHaveCount(0);

    const deletedStatuses = await page.evaluate(async (documentId) => {
      const [document, source] = await Promise.all([
        fetch(`/api/documents/${documentId}`),
        fetch(`/api/documents/${documentId}/source`),
      ]);
      return [document.status, source.status];
    }, upload.documentId);
    expect(deletedStatuses).toEqual([404, 404]);
  });
});
