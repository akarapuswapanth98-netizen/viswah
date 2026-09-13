const ACTIVITY_ROUTES = {
  vocal_guru: "/vocal-guru",
  speech_analysis: "/speech-analysis",
  piano: "/piano",
  drums: "/drums",
  metronome: "/metronome",
  sargam: "/sargam",
  raga: "/ragas",
  lesson: "/courses",
  quiz: "/courses",
};

export function generateRecommendations({ recentSessions, activityStats, summary }) {
  const recs = [];

  if (!recentSessions || recentSessions.length === 0) {
    recs.push({
      type: "start_practice",
      title: "Start your first practice session",
      reason: "No sessions yet — pick an activity below to begin",
      path: null,
    });
    return recs;
  }

  const byActivity = {};
  recentSessions.forEach((s) => {
    if (!byActivity[s.activity]) byActivity[s.activity] = [];
    byActivity[s.activity].push(s);
  });

  const scored = recentSessions.filter((s) => s.score != null);
  if (scored.length > 0) {
    const worst = scored.reduce((min, s) => (s.score < min.score ? s : min), scored[0]);
    if (worst.score < 60) {
      recs.push({
        type: "repeat_exercise",
        title: `Repeat ${formatActivity(worst.activity)}`,
        reason: `Your last score was ${Math.round(worst.score)}% — try again to improve`,
        path: ACTIVITY_ROUTES[worst.activity] || "/practice",
      });
    }
  }

  const allActivities = ["vocal_guru", "speech_analysis", "piano", "drums", "raga"];
  const practiced = Object.keys(activityStats || {});
  const untried = allActivities.filter((a) => !practiced.includes(a));
  if (untried.length > 0 && recs.length < 3) {
    const next = untried[0];
    recs.push({
      type: "try_activity",
      title: `Try ${formatActivity(next)}`,
      reason: `You haven't practiced ${formatActivity(next)} yet`,
      path: ACTIVITY_ROUTES[next] || "/practice",
    });
  }

  if (summary && summary.current_streak === 0 && summary.total_sessions > 0) {
    recs.push({
      type: "maintain_streak",
      title: "Start a new streak",
      reason: "Practice today to begin a new streak",
      path: "/practice",
    });
  }

  const highScoring = scored.filter((s) => s.score >= 80);
  if (highScoring.length > 0 && recs.length < 3) {
    const latest = highScoring[0];
    recs.push({
      type: "great_work",
      title: `Great work on ${formatActivity(latest.activity)}!`,
      reason: `You scored ${Math.round(latest.score)}% — keep it up`,
      path: ACTIVITY_ROUTES[latest.activity] || "/practice",
    });
  }

  return recs.slice(0, 3);
}

export function formatActivity(activity) {
  const labels = {
    vocal_guru: "Vocal Guru",
    speech_analysis: "Speech Analysis",
    piano: "Piano",
    drums: "Drums",
    metronome: "Metronome",
    sargam: "Sargam",
    raga: "Raga Learning",
    lesson: "Lessons",
    quiz: "Quizzes",
  };
  return labels[activity] || activity?.replace(/_/g, " ") || "Practice";
}

export function formatScore(score) {
  if (score == null) return "–";
  return `${Math.round(score)}%`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isYesterday = d.toDateString() === new Date(now - 86400000).toDateString();
  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function getGradeColor(score) {
  if (score >= 80) return "#6DBF73";
  if (score >= 60) return "#5BA8A0";
  if (score >= 40) return "#D4A84A";
  return "#D46A6A";
}
