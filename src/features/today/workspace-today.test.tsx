import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkspaceToday } from "./workspace-today";

const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const action = {
  id: "test-action",
  title: "Respond to the request",
  description: null,
  priority: "HIGH",
  dueAt: null,
  sourceDateText: null,
  sourceDocument: { id: "source", title: "Original request" },
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("workspace action controls", () => {
  it.each(["network", "server"])(
    "retains the action and offers retry after a %s failure",
    async (failure) => {
      const fetcher =
        failure === "network"
          ? vi.fn().mockRejectedValue(new TypeError("Offline"))
          : vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
      vi.stubGlobal("fetch", fetcher);
      render(<WorkspaceToday firstName="Maya" initialActions={[action]} />);
      fireEvent.click(screen.getByRole("button", { name: "Complete" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "could not be updated",
      );
      expect(screen.getByRole("heading", { name: action.title })).toBeVisible();
      expect(screen.getByRole("button", { name: "Complete" })).toBeEnabled();
      expect(refresh).not.toHaveBeenCalled();
    },
  );

  it("blocks conflicting requests while a change is pending and refreshes on success", async () => {
    let resolveRequest!: (response: Response) => void;
    const fetcher = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveRequest = resolve;
      }),
    );
    vi.stubGlobal("fetch", fetcher);
    render(<WorkspaceToday firstName="Maya" initialActions={[action]} />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.getByRole("button", { name: "Complete" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Complete" }));
    expect(fetcher).toHaveBeenCalledTimes(1);
    resolveRequest(new Response(null, { status: 200 }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(screen.getByRole("status")).toHaveTextContent("Action dismissed");
  });

  it("reopens a completed action while preserving the source link", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    render(
      <WorkspaceToday
        firstName="Maya"
        status="COMPLETED"
        initialActions={[action]}
      />,
    );
    expect(
      screen.getByRole("link", { name: "Original request" }),
    ).toHaveAttribute("href", "/workspace/documents/source");
    fireEvent.click(screen.getByRole("button", { name: "Reopen" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(fetcher).toHaveBeenCalledWith(
      "/api/actions/test-action",
      expect.objectContaining({ body: '{"status":"OPEN"}' }),
    );
  });
});
