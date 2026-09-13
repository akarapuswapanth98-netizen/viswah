import { describe, it, expect } from "vitest";
import {
  generateRecommendations,
  formatActivity,
  formatScore,
  formatDate,
  getGradeColor,
} from "../utils/practiceRecommendations";

describe("practiceRecommendations", () => {
  describe("generateRecommendations", () => {
    it("recommends starting first practice when no sessions", () => {
      const recs = generateRecommendations({ recentSessions: [], activityStats: {}, summary: null });
      expect(recs).toHaveLength(1);
      expect(recs[0].type).toBe("start_practice");
    });

    it("recommends repeating exercise when score is low", () => {
      const recs = generateRecommendations({
        recentSessions: [{ activity: "piano", activity_id: "c_major", score: 45 }],
        activityStats: { piano: 1 },
        summary: { current_streak: 1, total_sessions: 1 },
      });
      expect(recs.some((r) => r.type === "repeat_exercise")).toBe(true);
    });

    it("recommends trying untried activities", () => {
      const recs = generateRecommendations({
        recentSessions: [{ activity: "piano", activity_id: "c_major", score: 80 }],
        activityStats: { piano: 1 },
        summary: { current_streak: 1, total_sessions: 1 },
      });
      expect(recs.some((r) => r.type === "try_activity")).toBe(true);
    });

    it("recommends maintaining streak when broken", () => {
      const recs = generateRecommendations({
        recentSessions: [{ activity: "piano", activity_id: "c_major", score: 80 }],
        activityStats: { piano: 1 },
        summary: { current_streak: 0, total_sessions: 5 },
      });
      expect(recs.some((r) => r.type === "maintain_streak")).toBe(true);
    });

    it("returns max 3 recommendations", () => {
      const recs = generateRecommendations({
        recentSessions: [],
        activityStats: {},
        summary: { current_streak: 0, total_sessions: 5 },
      });
      expect(recs.length).toBeLessThanOrEqual(3);
    });
  });

  describe("formatActivity", () => {
    it("formats known activities", () => {
      expect(formatActivity("vocal_guru")).toBe("Vocal Guru");
      expect(formatActivity("piano")).toBe("Piano");
      expect(formatActivity("drums")).toBe("Drums");
      expect(formatActivity("speech_analysis")).toBe("Speech Analysis");
      expect(formatActivity("raga")).toBe("Raga Learning");
      expect(formatActivity("metronome")).toBe("Metronome");
    });

    it("formats unknown activities", () => {
      expect(formatActivity("my_activity")).toBe("my activity");
    });

    it("handles null", () => {
      expect(formatActivity(null)).toBe("Practice");
    });
  });

  describe("formatScore", () => {
    it("formats number score", () => {
      expect(formatScore(85)).toBe("85%");
    });

    it("rounds decimal scores", () => {
      expect(formatScore(85.7)).toBe("86%");
    });

    it("shows dash for null", () => {
      expect(formatScore(null)).toBe("–");
    });
  });

  describe("formatDate", () => {
    it("returns Today for current date", () => {
      const now = new Date().toISOString();
      expect(formatDate(now)).toBe("Today");
    });

    it("returns Yesterday for previous day", () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      expect(formatDate(yesterday)).toBe("Yesterday");
    });

    it("returns empty for null", () => {
      expect(formatDate(null)).toBe("");
    });
  });

  describe("getGradeColor", () => {
    it("returns success color for high scores", () => {
      expect(getGradeColor(85)).toBe("#6DBF73");
    });

    it("returns teal for mid scores", () => {
      expect(getGradeColor(65)).toBe("#5BA8A0");
    });

    it("returns warning for low scores", () => {
      expect(getGradeColor(45)).toBe("#D4A84A");
    });

    it("returns error for very low scores", () => {
      expect(getGradeColor(20)).toBe("#D46A6A");
    });
  });
});
