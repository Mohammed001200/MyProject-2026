import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { RealDocumentDetail } from "./real-document-detail";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("recovers a failed document load through the Swedish retry control", async () => {
  const fetcher = vi
    .fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(
      Response.json({
        id: "source",
        title: "Original title",
        status: "READY",
        category: "OTHER",
        organizationName: null,
        failureMessage: null,
        file: null,
        analysis: null,
        actions: [],
      }),
    );
  vi.stubGlobal("fetch", fetcher);
  render(<RealDocumentDetail locale="sv" documentId="source" />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Dokumentet kunde inte laddas",
  );
  fireEvent.click(screen.getByRole("button", { name: "Försök igen." }));
  expect(
    await screen.findByRole("heading", { name: "Original title" }),
  ).toBeVisible();
  expect(fetcher).toHaveBeenCalledTimes(2);
});
