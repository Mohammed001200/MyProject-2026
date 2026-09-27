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
  it("localizes deadlines and priorities without rewriting source content", () => {
    render(
      <WorkspaceToday
        locale="sv"
        firstName="Maya"
        initialActions={[
          {
            ...action,
            dueAt: "2020-01-01T00:00:00.000Z",
            deadline: { date: "2020-01-01", label: "Overdue" },
          },
        ]}
      />,
    );
    expect(screen.getByRole("main")).toHaveAttribute("lang", "sv");
    expect(screen.getByText("Försenad")).toBeVisible();
    expect(screen.getByText("Hög")).toBeVisible();
    expect(screen.getByText("Senast 2020-01-01")).toBeVisible();
    expect(screen.getByRole("heading", { name: action.title })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Original request" }),
    ).toHaveAttribute("href", "/workspace/documents/source");
  });
  it("submits stable API status values from Swedish controls", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    render(
      <WorkspaceToday locale="sv" firstName="Maya" initialActions={[action]} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Slutför" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(fetcher).toHaveBeenCalledWith(
      "/api/actions/test-action",
      expect.objectContaining({ body: '{"status":"COMPLETED"}' }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Åtgärden har slutförts.",
    );
  });
  it("does not flag completed actions as overdue", () => {
    render(
      <WorkspaceToday
        firstName="Maya"
        status="COMPLETED"
        initialActions={[
          { ...action, deadline: { date: "2020-01-01", label: "Overdue" } },
        ]}
      />,
    );
    expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
  });

  it("shows an overdue warning on open actions", () => {
    render(
      <WorkspaceToday
        firstName="Maya"
        initialActions={[
          { ...action, deadline: { date: "2020-01-01", label: "Overdue" } },
        ]}
      />,
    );
    expect(screen.getByText("Overdue")).toBeVisible();
  });

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
