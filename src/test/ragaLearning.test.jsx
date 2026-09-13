import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

vi.mock("react-router-dom", () => ({
  useParams: () => ({ ragaId: "yaman" }),
  useNavigate: () => vi.fn(),
}));

vi.mock("../api/indianMusicApi", () => ({
  indianMusicApi: { getRaga: vi.fn() },
}));

vi.mock("../api/speechApi", () => ({
  speechApi: { analyzePitch: vi.fn(), score: vi.fn() },
}));

vi.mock("../hooks/usePracticeSession", () => ({
  usePracticeSession: () => ({ startSession: vi.fn(), endSession: vi.fn() }),
}));

vi.mock("../hooks/useAudioFeedback", () => ({
  useAudioFeedback: () => ({
    buttonClick: vi.fn(), navChime: vi.fn(), completion: vi.fn(), error: vi.fn(),
  }),
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock("../utils/keyboard", () => ({
  onKeyDown: vi.fn(),
}));

const mockRaga = {
  id: "yaman",
  name: "Yaman (Kalyan)",
  thaat: "yaman",
  time: "Evening (9 PM - 12 AM)",
  vadi: "Ga",
  samvadi: "Ni",
  mood: "Peaceful, devotional, romantic",
  description: "One of the most popular ragas",
  arohana: ["Sa", "Re", "Ga", "tivra_Ma", "Pa", "Dha", "Ni", "Sa_high"],
  avarohana: ["Sa_high", "Ni", "Dha", "Pa", "tivra_Ma", "Ga", "Re", "Sa"],
  phrases: ["Re Ga Ma Pa Dha Ni Sa", "Ni Dha Pa Ma Ga Re Sa"],
  lessons: [{ type: "sargam", pattern: "Sa Re Ga Ma Pa Dha Ni Sa", difficulty: "beginner" }],
};

let RagaLearning;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import("../pages/RagaLearning");
  RagaLearning = mod.default;
});

function clickButton(text) {
  fireEvent.click(screen.getByRole("button", { name: text }));
}

function waitForText(text) {
  return waitFor(() => expect(screen.getAllByText(text).length).toBeGreaterThan(0));
}

describe("RagaLearning", () => {
  it("loads and displays raga name in header", async () => {
    const { indianMusicApi } = await import("../api/indianMusicApi");
    indianMusicApi.getRaga.mockResolvedValue({ data: mockRaga });
    render(<RagaLearning />);
    await waitFor(() => {
      expect(screen.getAllByText("Yaman (Kalyan)").length).toBeGreaterThan(0);
    });
  });

  it("shows error for invalid raga", async () => {
    const { indianMusicApi } = await import("../api/indianMusicApi");
    indianMusicApi.getRaga.mockResolvedValue({ data: null });
    render(<RagaLearning />);
    await waitFor(() => {
      expect(screen.getByText("Raga not found")).toBeTruthy();
    });
  });

  it("shows error on API failure", async () => {
    const { indianMusicApi } = await import("../api/indianMusicApi");
    indianMusicApi.getRaga.mockRejectedValue(new Error("Network error"));
    render(<RagaLearning />);
    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeTruthy();
    });
  });

  it("displays overview with characteristics", async () => {
    const { indianMusicApi } = await import("../api/indianMusicApi");
    indianMusicApi.getRaga.mockResolvedValue({ data: mockRaga });
    render(<RagaLearning />);
    await waitForText("Yaman (Kalyan)");
    expect(screen.getByText("yaman")).toBeTruthy();
    expect(screen.getAllByText("Ga").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Ni").length).toBeGreaterThanOrEqual(1);
  });

  it("shows arohana and avarohana preview", async () => {
    const { indianMusicApi } = await import("../api/indianMusicApi");
    indianMusicApi.getRaga.mockResolvedValue({ data: mockRaga });
    render(<RagaLearning />);
    await waitFor(() => {
      expect(screen.getByText("Arohana Preview")).toBeTruthy();
    });
    expect(screen.getByText("Avarohana Preview")).toBeTruthy();
  });

  it("shows all 8 phase navigation buttons", async () => {
    const { indianMusicApi } = await import("../api/indianMusicApi");
    indianMusicApi.getRaga.mockResolvedValue({ data: mockRaga });
    render(<RagaLearning />);
    await waitForText("Yaman (Kalyan)");
    ["Overview", "Listen", "Arohana", "Avarohana", "Phrases", "Practice", "Quiz", "Complete"].forEach((p) => {
      expect(screen.getByRole("button", { name: p })).toBeTruthy();
    });
  });

  it("navigates to listen on Begin Learning click", async () => {
    const { indianMusicApi } = await import("../api/indianMusicApi");
    indianMusicApi.getRaga.mockResolvedValue({ data: mockRaga });
    render(<RagaLearning />);
    await waitFor(() => screen.getByRole("button", { name: "Begin Learning \u2192" }));
    clickButton("Begin Learning \u2192");
    await waitFor(() => {
      expect(screen.getByText("Listen to Yaman (Kalyan)")).toBeTruthy();
    });
  });

  it("navigates through all learning phases", async () => {
    const { indianMusicApi } = await import("../api/indianMusicApi");
    indianMusicApi.getRaga.mockResolvedValue({ data: mockRaga });
    render(<RagaLearning />);
    await waitFor(() => screen.getByRole("button", { name: "Begin Learning \u2192" }));
    clickButton("Begin Learning \u2192");
    await waitFor(() => expect(screen.getByText("Listen to Yaman (Kalyan)")).toBeTruthy());
    clickButton("Continue \u2192");
    await waitFor(() => expect(screen.getByText("Arohana \u2014 Ascending Sequence")).toBeTruthy());
    clickButton("I Know This \u2192");
    await waitFor(() => expect(screen.getByText("Avarohana \u2014 Descending Sequence")).toBeTruthy());
    clickButton("I Know This \u2192");
    await waitFor(() => expect(screen.getByText("Characteristic Phrases")).toBeTruthy());
    expect(screen.getByText("Re Ga Ma Pa Dha Ni Sa")).toBeTruthy();
    expect(screen.getByText("Ni Dha Pa Ma Ga Re Sa")).toBeTruthy();
  });

  it("shows empty phrases message", async () => {
    const { indianMusicApi } = await import("../api/indianMusicApi");
    indianMusicApi.getRaga.mockResolvedValue({ data: { ...mockRaga, phrases: [] } });
    render(<RagaLearning />);
    await waitFor(() => screen.getByRole("button", { name: "Begin Learning \u2192" }));
    clickButton("Begin Learning \u2192");
    await waitFor(() => expect(screen.getByText("Listen to Yaman (Kalyan)")).toBeTruthy());
    clickButton("Continue \u2192");
    await waitFor(() => expect(screen.getByText("Arohana \u2014 Ascending Sequence")).toBeTruthy());
    clickButton("I Know This \u2192");
    await waitFor(() => expect(screen.getByText("Avarohana \u2014 Descending Sequence")).toBeTruthy());
    clickButton("I Know This \u2192");
    await waitFor(() => expect(screen.getByText("No characteristic phrases available for this raga.")).toBeTruthy());
  });

  it("shows practice mode selection", async () => {
    const { indianMusicApi } = await import("../api/indianMusicApi");
    indianMusicApi.getRaga.mockResolvedValue({ data: mockRaga });
    render(<RagaLearning />);
    await waitFor(() => screen.getByRole("button", { name: "Begin Learning \u2192" }));
    clickButton("Begin Learning \u2192");
    await waitFor(() => expect(screen.getByText("Listen to Yaman (Kalyan)")).toBeTruthy());
    clickButton("Continue \u2192");
    await waitFor(() => expect(screen.getByText("Arohana \u2014 Ascending Sequence")).toBeTruthy());
    clickButton("I Know This \u2192");
    await waitFor(() => expect(screen.getByText("Avarohana \u2014 Descending Sequence")).toBeTruthy());
    clickButton("I Know This \u2192");
    await waitFor(() => expect(screen.getByText("Characteristic Phrases")).toBeTruthy());
    clickButton("Start Practice \u2192");
    await waitFor(() => expect(screen.getByText("Choose what to practice")).toBeTruthy());
  });

  it("Back to Ragas button exists", async () => {
    const { indianMusicApi } = await import("../api/indianMusicApi");
    indianMusicApi.getRaga.mockResolvedValue({ data: mockRaga });
    render(<RagaLearning />);
    await waitFor(() => expect(screen.getByText("\u2190 Ragas")).toBeTruthy());
  });

  it("complete phase shows completion UI", async () => {
    const { indianMusicApi } = await import("../api/indianMusicApi");
    indianMusicApi.getRaga.mockResolvedValue({ data: mockRaga });
    render(<RagaLearning />);
    await waitFor(() => screen.getAllByText("Yaman (Kalyan)").length > 0);
    clickButton("Complete");
    await waitFor(() => expect(screen.getByText("Yaman (Kalyan) Completed!")).toBeTruthy());
    expect(screen.getByText("Practice Again")).toBeTruthy();
    expect(screen.getByText("Explore Another Raga")).toBeTruthy();
  });

  it("handles raga with missing optional fields", async () => {
    const { indianMusicApi } = await import("../api/indianMusicApi");
    indianMusicApi.getRaga.mockResolvedValue({
      data: { id: "test", name: "Minimal Raga", arohana: ["Sa", "Re", "Pa", "Sa_high"], avarohana: ["Sa_high", "Pa", "Re", "Sa"] },
    });
    render(<RagaLearning />);
    await waitFor(() => expect(screen.getAllByText("Minimal Raga").length).toBeGreaterThan(0));
    expect(screen.getByRole("button", { name: "Begin Learning \u2192" })).toBeTruthy();
  });
});
