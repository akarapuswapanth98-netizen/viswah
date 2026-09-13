import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }) => children,
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true, user: { name: "Test User" } }),
}));

vi.mock("../api/coachApi", () => ({
  coachApi: {
    getSummary: vi.fn(),
    getRecommendation: vi.fn(),
    sendMessage: vi.fn(),
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

import { coachApi } from "../api/coachApi";
import AICoach from "../pages/AICoach";

const mockSummary = {
  greeting: "Your skills are developing well.",
  current_focus: "Pitch & Voice",
  observation: "You're on a 3-day streak. Your average score is 75%.",
  skill_health: {
    pitch: { label: "Pitch & Voice", score: 72, trend: "improving" },
    melody: { label: "Melody & Notes", score: 85, trend: "stable" },
    rhythm: { label: "Rhythm & Timing", score: 60, trend: "declining" },
  },
  today_plan: {
    duration_minutes: 10,
    total_steps: 4,
    steps: [
      { step: 1, activity: "Warm Up", duration: "2 min", description: "Gentle piano exercise", route: "/piano", icon: "🎹", category: "warmup" },
      { step: 2, activity: "Metronome", duration: "4 min", description: "Rhythm focus", route: "/metronome", icon: "⏱", category: "focus" },
      { step: 3, activity: "Vocal Guru", duration: "2 min", description: "Build on strength", route: "/vocal-guru", icon: "🎤", category: "strength" },
      { step: 4, activity: "Review Results", duration: "2 min", description: "Compare results", route: "/practice-history", icon: "📊", category: "review" },
    ],
  },
  coaching_state: "improving",
  strongest_skill: "melody",
  weakest_skill: "rhythm",
  total_sessions: 12,
  current_streak: 3,
  average_score: 75.5,
  recent_score: 82,
};

const mockRecommendation = {
  type: "improve_skill",
  title: "Focus on Rhythm & Timing",
  description: "Your rhythm score is 60%. Let's bring it up.",
  route: "/drums",
  activity_id: null,
  icon: "🥁",
  reason: "A score of 60% suggests this skill area needs focused practice.",
};

let AICoachComponent;

beforeEach(async () => {
  vi.clearAllMocks();
  mockNavigate.mockClear();
  const mod = await import("../pages/AICoach");
  AICoachComponent = mod.default;
});

function renderCoach() {
  return render(<AICoachComponent />);
}

describe("AICoach", () => {
  it("shows loading state initially", () => {
    coachApi.getSummary.mockReturnValue(new Promise(() => {}));
    coachApi.getRecommendation.mockReturnValue(new Promise(() => {}));
    renderCoach();
    const skeletons = document.querySelectorAll('[style*="shimmer"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders coaching summary after loading", async () => {
    coachApi.getSummary.mockResolvedValue({ data: mockSummary });
    coachApi.getRecommendation.mockResolvedValue({ data: mockRecommendation });
    renderCoach();
    await waitFor(() => {
      expect(screen.getByText(/AI Music/)).toBeInTheDocument();
    });
    expect(screen.getByText("Your skills are developing well.")).toBeInTheDocument();
  });

  it("displays skill health bars", async () => {
    coachApi.getSummary.mockResolvedValue({ data: mockSummary });
    coachApi.getRecommendation.mockResolvedValue({ data: mockRecommendation });
    renderCoach();
    await waitFor(() => {
      expect(screen.getByText("Skill Health")).toBeInTheDocument();
    });
    expect(screen.getByText("Pitch & Voice")).toBeInTheDocument();
    expect(screen.getByText("Melody & Notes")).toBeInTheDocument();
    expect(screen.getByText("Rhythm & Timing")).toBeInTheDocument();
  });

  it("displays progress stats", async () => {
    coachApi.getSummary.mockResolvedValue({ data: mockSummary });
    coachApi.getRecommendation.mockResolvedValue({ data: mockRecommendation });
    renderCoach();
    await waitFor(() => {
      expect(screen.getByText("Sessions")).toBeInTheDocument();
    });
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("3d")).toBeInTheDocument();
  });

  it("renders today's practice plan", async () => {
    coachApi.getSummary.mockResolvedValue({ data: mockSummary });
    coachApi.getRecommendation.mockResolvedValue({ data: mockRecommendation });
    renderCoach();
    await waitFor(() => {
      expect(screen.getByText("Today's Practice Plan")).toBeInTheDocument();
    });
    expect(screen.getByText("Warm Up")).toBeInTheDocument();
    expect(screen.getByText("Metronome")).toBeInTheDocument();
  });

  it("renders recommendation card", async () => {
    coachApi.getSummary.mockResolvedValue({ data: mockSummary });
    coachApi.getRecommendation.mockResolvedValue({ data: mockRecommendation });
    renderCoach();
    await waitFor(() => {
      expect(screen.getByText("Recommended Next")).toBeInTheDocument();
    });
    expect(screen.getByText("Focus on Rhythm & Timing")).toBeInTheDocument();
    expect(screen.getByText("Practice Now →")).toBeInTheDocument();
  });

  it("renders coach insight", async () => {
    coachApi.getSummary.mockResolvedValue({ data: mockSummary });
    coachApi.getRecommendation.mockResolvedValue({ data: mockRecommendation });
    renderCoach();
    await waitFor(() => {
      expect(screen.getByText("What I'm Seeing")).toBeInTheDocument();
    });
    expect(screen.getByText(/You're on a 3-day streak/)).toBeInTheDocument();
  });

  it("renders chat input", async () => {
    coachApi.getSummary.mockResolvedValue({ data: mockSummary });
    coachApi.getRecommendation.mockResolvedValue({ data: mockRecommendation });
    renderCoach();
    await waitFor(() => {
      expect(screen.getByText("Ask Your Coach")).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText("What should I practice today?")).toBeInTheDocument();
  });

  it("navigates to piano when clicking plan step", async () => {
    coachApi.getSummary.mockResolvedValue({ data: mockSummary });
    coachApi.getRecommendation.mockResolvedValue({ data: mockRecommendation });
    renderCoach();
    await waitFor(() => {
      expect(screen.getByText("Warm Up")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Warm Up"));
    expect(mockNavigate).toHaveBeenCalledWith("/piano");
  });

  it("navigates to drums when clicking practice now", async () => {
    coachApi.getSummary.mockResolvedValue({ data: mockSummary });
    coachApi.getRecommendation.mockResolvedValue({ data: mockRecommendation });
    renderCoach();
    await waitFor(() => {
      expect(screen.getByText("Practice Now →")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Practice Now →"));
    expect(mockNavigate).toHaveBeenCalledWith("/drums");
  });

  it("shows error state", async () => {
    coachApi.getSummary.mockRejectedValue(new Error("API unavailable"));
    coachApi.getRecommendation.mockRejectedValue(new Error("API unavailable"));
    renderCoach();
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText("API unavailable")).toBeInTheDocument();
  });

  it("does not display fake statistics for empty user", async () => {
    const emptySummary = { ...mockSummary, total_sessions: 0, average_score: null, recent_score: null, current_streak: 0 };
    coachApi.getSummary.mockResolvedValue({ data: emptySummary });
    coachApi.getRecommendation.mockResolvedValue({ data: { ...mockRecommendation, type: "start_practice" } });
    renderCoach();
    await waitFor(() => {
      expect(screen.getByText("Skill Health")).toBeInTheDocument();
    });
    const textContent = document.body.textContent;
    expect(textContent).not.toContain("92%");
    expect(textContent).not.toContain("7-day streak");
  });

  it("shows coaching state label", async () => {
    coachApi.getSummary.mockResolvedValue({ data: mockSummary });
    coachApi.getRecommendation.mockResolvedValue({ data: mockRecommendation });
    renderCoach();
    await waitFor(() => {
      expect(screen.getByText("Improving")).toBeInTheDocument();
    });
  });
});
