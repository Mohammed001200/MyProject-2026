import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentChat } from "./document-chat";
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("document chat feedback", () => {
  it("keeps a question after network failure without exposing raw errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("private transport details")),
    );
    render(
      <DocumentChat
        locale="sv"
        documentId="source"
        title="Original title"
        initialTurns={[]}
      />,
    );
    fireEvent.change(screen.getByLabelText("Din fråga"), {
      target: { value: "Vad ska jag göra?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Skicka fråga" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Anslutningen bröts. Din fråga finns kvar.",
    );
    expect(screen.getByLabelText("Din fråga")).toHaveValue("Vad ska jag göra?");
    expect(
      screen.queryByText("private transport details"),
    ).not.toBeInTheDocument();
  });
  it("translates service codes while preserving English source excerpts", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        Response.json({ code: "AI_NOT_CONFIGURED" }, { status: 503 }),
      );
    vi.stubGlobal("fetch", fetcher);
    render(
      <DocumentChat
        locale="sv"
        documentId="source"
        title="Original title"
        initialTurns={[]}
      />,
    );
    fireEvent.change(screen.getByLabelText("Din fråga"), {
      target: { value: "Question" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Skicka fråga" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "AI-chatten är inte ansluten ännu.",
      ),
    );
    expect(
      screen.getByRole("link", { name: "Original title" }),
    ).toHaveAttribute("href", "/workspace/documents/source");
  });
});
