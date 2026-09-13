import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor, fireEvent } from "@testing-library/react";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }) => children,
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true, user: { name: "Test User" } }),
}));

vi.mock("../api/practiceApi", () => ({
  practiceApi: {
    getSummary: vi.fn(),
    getStats: vi.fn(),
    getHistory: vi.fn(),
  },
}));

vi.mock("../hooks/useAudioFeedback", () => ({
  useAudioFeedback: () => ({
    buttonClick: vi.fn(), navChime: vi.fn(), completion: vi.fn(), error: vi.fn(),
  }),
}));

vi.mock("../utils/keyboard", () => ({
  onKeyDown: vi.fn(),
}));

import { practiceApi } from "../api/practiceApi";
import PracticeStudio from "../pages/PracticeStudio";

const mockSummary = {
  total_sessions: 12,
  total_minutes: 45,
  current_streak: 3,
  longest_streak: 7,
  average_score: 75.5,
  best_score: 95,
  recent_score: 82,
  recent_sessions: [
    { id: 1, activity: "piano", activity_id: "c_major_scale", duration_seconds: 300, score: 91, completed: true, created_at: new Date().toISOString() },
    { id: 2, activity: "drums", activity_id: "basic_beat", duration_seconds: 240, score: 84, completed: true, created_at: new Date(Date.now() - 86400000).toISOString() },
  ],
  topic_statistics: [],
  activity_statistics: { piano: 5, drums: 4, vocal_guru: 3 },
};

const mockStats = {
  total_sessions: 12,
  total_minutes: 45,
  streak_days: 3,
  today_minutes: 15,
  favorite_activity: "piano",
  weekly_minutes: [5, 8, 10, 12, 0, 5, 5],
  activities_breakdown: { piano: 5, drums: 4, vocal_guru: 3 },
};

let PracticeStudioComponent;

beforeEach(async () => {
  vi.clearAllMocks();
  mockNavigate.mockClear();
  const mod = await import("../pages/PracticeStudio");
  PracticeStudioComponent = mod.default;
});

function renderStudio() {
  return render(<PracticeStudioComponent />);
}

describe("PracticeStudio", () => {
  it("shows loading state initially", () => {
    practiceApi.getSummary.mockReturnValue(new Promise(() => {}));
    practiceApi.getStats.mockReturnValue(new Promise(() => {}));
    renderStudio();
    const skeletons = document.querySelectorAll('[style*="shimmer"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders activity cards after loading", async () => {
    practiceApi.getSummary.mockResolvedValue({ data: mockSummary });
    practiceApi.getStats.mockResolvedValue({ data: mockStats });
    renderStudio();
    await waitFor(() => {
      expect(screen.getByTestId("activity-cards")).toBeInTheDocument();
    });
    const cards = screen.getByTestId("activity-cards");
    expect(within(cards).getByText("Vocal Guru")).toBeInTheDocument();
    expect(within(cards).getByText("Piano")).toBeInTheDocument();
    expect(within(cards).getByText("Drums")).toBeInTheDocument();
    expect(within(cards).getByText("Speech Analysis")).toBeInTheDocument();
    expect(within(cards).getByText("Raga Learning")).toBeInTheDocument();
    expect(within(cards).getByText("Metronome")).toBeInTheDocument();
  });

  it("displays real practice summary stats", async () => {
    practiceApi.getSummary.mockResolvedValue({ data: mockSummary });
    practiceApi.getStats.mockResolvedValue({ data: mockStats });
    renderStudio();
    await waitFor(() => {
      expect(screen.getByText("12")).toBeInTheDocument();
    });
    expect(screen.getByText("3d")).toBeInTheDocument();
    expect(screen.getByText("95%")).toBeInTheDocument();
  });

  it("shows continue practicing section", async () => {
    practiceApi.getSummary.mockResolvedValue({ data: mockSummary });
    practiceApi.getStats.mockResolvedValue({ data: mockStats });
    renderStudio();
    await waitFor(() => {
      expect(screen.getByTestId("continue-practice")).toBeInTheDocument();
    });
    const section = screen.getByTestId("continue-practice");
    expect(within(section).getByText(/Piano/)).toBeTruthy();
    expect(within(section).getByText(/c major scale/)).toBeTruthy();
  });

  it("shows recent practice sessions", async () => {
    practiceApi.getSummary.mockResolvedValue({ data: mockSummary });
    practiceApi.getStats.mockResolvedValue({ data: mockStats });
    renderStudio();
    await waitFor(() => {
      expect(screen.getByTestId("recent-practice")).toBeInTheDocument();
    });
  });

  it("shows recommendations", async () => {
    practiceApi.getSummary.mockResolvedValue({ data: mockSummary });
    practiceApi.getStats.mockResolvedValue({ data: mockStats });
    renderStudio();
    await waitFor(() => {
      expect(screen.getByTestId("recommendations")).toBeInTheDocument();
    });
  });

  it("navigates to piano when clicking activity card", async () => {
    practiceApi.getSummary.mockResolvedValue({ data: mockSummary });
    practiceApi.getStats.mockResolvedValue({ data: mockStats });
    renderStudio();
    await waitFor(() => {
      expect(screen.getByTestId("activity-card-piano")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("activity-card-piano"));
    expect(mockNavigate).toHaveBeenCalledWith("/piano");
  });

  it("navigates to practice history from View Full History", async () => {
    practiceApi.getSummary.mockResolvedValue({ data: mockSummary });
    practiceApi.getStats.mockResolvedValue({ data: mockStats });
    renderStudio();
    await waitFor(() => {
      expect(screen.getByText("View Full Practice History")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("View Full Practice History"));
    expect(mockNavigate).toHaveBeenCalledWith("/practice-history");
  });

  it("shows empty state for new user", async () => {
    const emptySummary = { ...mockSummary, total_sessions: 0, recent_sessions: [] };
    const emptyStats = { ...mockStats, total_sessions: 0, activities_breakdown: {} };
    practiceApi.getSummary.mockResolvedValue({ data: emptySummary });
    practiceApi.getStats.mockResolvedValue({ data: emptyStats });
    renderStudio();
    await waitFor(() => {
      expect(screen.getByText(/Your practice journey starts here/)).toBeInTheDocument();
    });
  });

  it("shows error state", async () => {
    practiceApi.getSummary.mockRejectedValue(new Error("API unavailable"));
    practiceApi.getStats.mockRejectedValue(new Error("API unavailable"));
    renderStudio();
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText("API unavailable")).toBeInTheDocument();
  });

  it("shows skill progress section", async () => {
    practiceApi.getSummary.mockResolvedValue({ data: mockSummary });
    practiceApi.getStats.mockResolvedValue({ data: mockStats });
    renderStudio();
    await waitFor(() => {
      expect(screen.getByTestId("skill-progress")).toBeInTheDocument();
    });
  });

  it("has filter buttons for categories", async () => {
    practiceApi.getSummary.mockResolvedValue({ data: mockSummary });
    practiceApi.getStats.mockResolvedValue({ data: mockStats });
    renderStudio();
    await waitFor(() => {
      expect(screen.getByText("All")).toBeInTheDocument();
    });
    expect(screen.getByText("Voice")).toBeInTheDocument();
    expect(screen.getByText("Melody")).toBeInTheDocument();
    expect(screen.getByText("Rhythm")).toBeInTheDocument();
  });

  it("does not display fake statistics", async () => {
    practiceApi.getSummary.mockResolvedValue({ data: mockSummary });
    practiceApi.getStats.mockResolvedValue({ data: mockStats });
    renderStudio();
    await waitFor(() => {
      expect(screen.getByTestId("activity-cards")).toBeInTheDocument();
    });
    const textContent = document.body.textContent;
    expect(textContent).not.toContain("Mastery");
    expect(textContent).not.toContain("AI knows");
    expect(textContent).not.toContain("Skill Level");
  });

  it("activity and activity_id remain distinct", async () => {
    practiceApi.getSummary.mockResolvedValue({ data: mockSummary });
    practiceApi.getStats.mockResolvedValue({ data: mockStats });
    renderStudio();
    await waitFor(() => {
      expect(screen.getByTestId("continue-practice")).toBeInTheDocument();
    });
    const section = screen.getByTestId("continue-practice");
    expect(within(section).getByText(/Piano/)).toBeTruthy();
    expect(within(section).getByText(/c major scale/)).toBeTruthy();
  });

  it("renders all 6 activity cards", async () => {
    practiceApi.getSummary.mockResolvedValue({ data: mockSummary });
    practiceApi.getStats.mockResolvedValue({ data: mockStats });
    renderStudio();
    await waitFor(() => {
      expect(screen.getByTestId("activity-cards")).toBeInTheDocument();
    });
    expect(screen.getByTestId("activity-card-vocal_guru")).toBeInTheDocument();
    expect(screen.getByTestId("activity-card-piano")).toBeInTheDocument();
    expect(screen.getByTestId("activity-card-drums")).toBeInTheDocument();
    expect(screen.getByTestId("activity-card-speech_analysis")).toBeInTheDocument();
    expect(screen.getByTestId("activity-card-raga")).toBeInTheDocument();
    expect(screen.getByTestId("activity-card-metronome")).toBeInTheDocument();
  });

  it("filters activities by category", async () => {
    practiceApi.getSummary.mockResolvedValue({ data: mockSummary });
    practiceApi.getStats.mockResolvedValue({ data: mockStats });
    renderStudio();
    await waitFor(() => {
      expect(screen.getByTestId("activity-cards")).toBeInTheDocument();
    });
    const voiceBtn = screen.getByText("Voice");
    fireEvent.click(voiceBtn);
    await waitFor(() => {
      expect(screen.getByTestId("activity-card-vocal_guru")).toBeInTheDocument();
      expect(screen.getByTestId("activity-card-speech_analysis")).toBeInTheDocument();
      expect(screen.queryByTestId("activity-card-piano")).not.toBeInTheDocument();
    });
  });
});
