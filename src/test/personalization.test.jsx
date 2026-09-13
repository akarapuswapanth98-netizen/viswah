import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: 1, username: "testuser", email: "test@test.com", level: "beginner" } }),
}));

vi.mock("../api/personalizationApi", () => ({
  personalizationApi: {
    getSummary: vi.fn(),
    getSkillMap: vi.fn(),
    getRecommendations: vi.fn(),
    getMission: vi.fn(),
    getStreak: vi.fn(),
  },
}));

vi.mock("../api/practiceApi", () => ({
  practiceApi: {
    getStats: vi.fn().mockResolvedValue({ data: { total_sessions: 0, total_minutes: 0, streak_days: 0, today_minutes: 0, activities_breakdown: {} } }),
    getSummary: vi.fn().mockResolvedValue({ data: { total_sessions: 0, recent_sessions: [], topic_statistics: [], activity_statistics: {} } }),
    getAchievements: vi.fn().mockResolvedValue({ data: [] }),
  },
  dashboardApi: {
    getDashboard: vi.fn().mockResolvedValue({ data: { enrolled_courses: [], progress: [], practice_stats: { total_sessions: 0, total_minutes: 0, streak_days: 0, today_minutes: 0 }, achievements: [], recommendations: [], recent_activity: [] } }),
  },
}));

vi.mock("../api/courseApi", () => ({
  courseApi: {
    getCourses: vi.fn().mockResolvedValue({ data: [] }),
    getEnrolled: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock("../hooks/useAudioFeedback", () => ({
  useAudioFeedback: () => ({ buttonClick: vi.fn(), navChime: vi.fn() }),
}));

describe("SkillMap component", () => {
  it("renders skill map with skills", async () => {
    const { default: SkillMap } = await import("../components/SkillMap");
    const skills = [
      { id: "pitch", label: "Pitch & Voice", icon: "🎤", score: 75, trend: "improving", sessions: 5, description: "Test" },
      { id: "rhythm", label: "Rhythm & Timing", icon: "🥁", score: 60, trend: "stable", sessions: 3, description: "Test" },
    ];
    render(<MemoryRouter><SkillMap skills={skills} /></MemoryRouter>);
    expect(screen.getByText("Pitch & Voice")).toBeTruthy();
    expect(screen.getByText("Rhythm & Timing")).toBeTruthy();
    expect(screen.getByText("75%")).toBeTruthy();
    expect(screen.getByText("60%")).toBeTruthy();
  });

  it("renders empty state when no skills", async () => {
    const { default: SkillMap } = await import("../components/SkillMap");
    render(<MemoryRouter><SkillMap skills={[]} /></MemoryRouter>);
    expect(screen.getByText("Your skill map will appear here")).toBeTruthy();
  });

  it("shows insufficient data message for skills without scores", async () => {
    const { default: SkillMap } = await import("../components/SkillMap");
    const skills = [
      { id: "pitch", label: "Pitch & Voice", icon: "🎤", score: null, trend: "insufficient_data", sessions: 0, description: "Test", insufficient_data_message: "Start practicing to unlock this skill" },
    ];
    render(<MemoryRouter><SkillMap skills={skills} /></MemoryRouter>);
    expect(screen.getByText("Start practicing to unlock this skill")).toBeTruthy();
  });
});

describe("DailyMission component", () => {
  it("renders mission with title and description", async () => {
    const { default: DailyMission } = await import("../components/DailyMission");
    const mission = { id: "mission_1", title: "Your First Note", description: "Play a melody", route: "/piano", icon: "🎹", estimated_duration: "5 min", reason: "Everyone starts here" };
    render(<MemoryRouter><DailyMission mission={mission} /></MemoryRouter>);
    expect(screen.getByText("Today's Mission")).toBeTruthy();
    expect(screen.getByText("Your First Note")).toBeTruthy();
    expect(screen.getByText("Play a melody")).toBeTruthy();
    expect(screen.getByText("5 min")).toBeTruthy();
  });

  it("returns null when no mission", async () => {
    const { default: DailyMission } = await import("../components/DailyMission");
    const { container } = render(<MemoryRouter><DailyMission mission={null} /></MemoryRouter>);
    expect(container.innerHTML).toBe("");
  });
});

describe("Recommendations component", () => {
  it("renders recommendations", async () => {
    const { default: Recommendations } = await import("../components/Recommendations");
    const recs = [
      { id: "1", type: "practice", title: "Practice Rhythm", description: "Improve timing", reason: "Your rhythm needs work", route: "/drums", icon: "🥁", estimated_duration: "8 min" },
      { id: "2", type: "lesson", title: "Continue Course", description: "Next lesson", reason: "Keep going", route: "/courses/1", icon: "📖", estimated_duration: "10 min" },
    ];
    render(<MemoryRouter><Recommendations recommendations={recs} /></MemoryRouter>);
    expect(screen.getByText("Practice Rhythm")).toBeTruthy();
    expect(screen.getByText("Continue Course")).toBeTruthy();
  });

  it("returns null when no recommendations", async () => {
    const { default: Recommendations } = await import("../components/Recommendations");
    const { container } = render(<MemoryRouter><Recommendations recommendations={[]} /></MemoryRouter>);
    expect(container.innerHTML).toBe("");
  });
});

describe("Home page personalization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders personalized dashboard", async () => {
    const { personalizationApi } = await import("../api/personalizationApi");
    personalizationApi.getSummary.mockResolvedValue({
      data: {
        coaching_state: "improving",
        skill_map: [
          { id: "pitch", label: "Pitch", icon: "🎤", score: 75, trend: "improving", sessions: 5, description: "Test" },
        ],
        daily_mission: { id: "m1", title: "Practice Melody", description: "Play piano", route: "/piano", icon: "🎹", estimated_duration: "5 min", reason: "Build skills" },
        recommendations: [{ id: "r1", type: "practice", title: "Try Drums", description: "New skill", reason: "Explore rhythm", route: "/drums", icon: "🥁", estimated_duration: "5 min" }],
        streak_data: { current_streak: 3, total_sessions: 10, total_minutes: 60, today_minutes: 15 },
        strongest_skill: "pitch",
        weakest_skill: "rhythm",
        recently_improved: ["pitch"],
        needs_attention: [],
        insufficient_data_skills: ["world_music", "creativity"],
      },
    });

    const { default: Home } = await import("../pages/Home");
    render(
      <MemoryRouter initialEntries={["/home"]}>
        <Home />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).toBeNull();
    });

    expect(screen.getByText(/Good (morning|afternoon|evening)/)).toBeTruthy();
    expect(screen.getByText("Making Progress")).toBeTruthy();
    expect(screen.getByText("Today's Mission")).toBeTruthy();
    expect(screen.getByText("Practice Melody")).toBeTruthy();
    expect(screen.getByText("Recommended for you")).toBeTruthy();
    expect(screen.getByText("Try Drums")).toBeTruthy();
    expect(screen.getByText("Music Skill Map")).toBeTruthy();
  });
});
