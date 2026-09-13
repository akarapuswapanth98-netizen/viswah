import { useRef, useCallback } from "react";
import { practiceApi } from "../api/practiceApi";

export function usePracticeSession(activity) {
  const startTimeRef = useRef(null);
  const sessionIdRef = useRef(null);

  const startSession = useCallback((activityId = null) => {
    startTimeRef.current = Date.now();
    sessionIdRef.current = null;
    return { activity, activityId };
  }, [activity]);

  const endSession = useCallback(async (data = {}) => {
    if (!startTimeRef.current) return null;
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    startTimeRef.current = null;

    try {
      const res = await practiceApi.createSession({
        activity,
        activity_id: data.activityId || null,
        duration_seconds: duration,
        score: data.score ?? null,
        completed: data.completed ?? false,
        metadata_json: data.metadata ? JSON.stringify(data.metadata) : null,
      });
      const result = res.data ?? res;
      sessionIdRef.current = result?.id || null;
      return result;
    } catch {
      return null;
    }
  }, [activity]);

  const getElapsed = useCallback(() => {
    if (!startTimeRef.current) return 0;
    return Math.round((Date.now() - startTimeRef.current) / 1000);
  }, []);

  return { startSession, endSession, getElapsed };
}
