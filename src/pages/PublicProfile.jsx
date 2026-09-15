import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import communityApi from "../api/communityApi";
import FollowButton from "../components/community/FollowButton";

import C from "../components/ui/colors";

export default function PublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await communityApi.getPublicProfile(username);
      setProfile(data);
    } catch (e) {
      setError(e.message || "Profile not found");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const result = await communityApi.followUser(profile.user_id);
      setIsFollowing(result.following);
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.textMuted, fontSize: 14 }}>Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{
          background: C.surface, borderRadius: 14, padding: 40,
          textAlign: "center", color: C.textMuted, fontSize: 14,
        }}>
          {error || "Profile not found"}
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none", border: "none", color: C.secondary,
            fontSize: 13, cursor: "pointer", marginTop: 12,
          }}
        >{"\u{2190}"} Back</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 20px" }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "none", border: "none", color: C.secondary,
          fontSize: 13, cursor: "pointer", marginBottom: 20,
        }}
        >{"\u{2190}"} Back</button>

      <div style={{
        background: C.surface, borderRadius: 18, padding: 28,
        border: `1px solid ${C.border}`, marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: `linear-gradient(135deg, ${C.primary}22, ${C.secondary}22)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 700, color: C.primary,
          }}>
            {(profile.display_name || profile.username || "?")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.text, fontSize: 20, fontWeight: 700 }}>
              {profile.display_name || profile.username}
            </div>
            <div style={{ color: C.textMuted, fontSize: 13 }}>
              @{profile.username}
              {profile.country ? ` \u{00B7} ${profile.country}` : ""}
            </div>
          </div>
          <FollowButton isFollowing={isFollowing} onClick={handleFollow} />
        </div>

        {profile.bio && (
          <p style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.5, margin: "0 0 16px" }}>
            {profile.bio}
          </p>
        )}

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: C.primary, fontSize: 20, fontWeight: 700 }}>Level {profile.level}</div>
            <div style={{ color: C.textMuted, fontSize: 11 }}>{profile.level_title}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: C.secondary, fontSize: 20, fontWeight: 700 }}>{profile.xp}</div>
            <div style={{ color: C.textMuted, fontSize: 11 }}>XP</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: C.primary, fontSize: 20, fontWeight: 700 }}>{profile.achievements_count}</div>
            <div style={{ color: C.textMuted, fontSize: 11 }}>Achievements</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: C.secondary, fontSize: 20, fontWeight: 700 }}>{profile.practice_hours}h</div>
            <div style={{ color: C.textMuted, fontSize: 11 }}>Practice</div>
          </div>
        </div>

        <div style={{
          display: "flex", gap: 16, marginTop: 16, paddingTop: 14,
          borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.textSecondary,
        }}>
          <span>{"\u{1F525}"} {profile.current_streak} day streak</span>
          <span>{"\u{1F465}"} {profile.followers_count} followers</span>
          <span>Following {profile.following_count}</span>
        </div>
      </div>

      {profile.skills && profile.skills.length > 0 && (
        <div style={{
          background: C.surface, borderRadius: 14, padding: 20,
          border: `1px solid ${C.border}`,
        }}>
          <div style={{ color: C.text, fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
            Skills
          </div>
          {profile.skills.map((skill) => (
            <div key={skill.id} style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
            }}>
              <div style={{ color: C.textSecondary, fontSize: 13, width: 100 }}>
                {skill.label}
              </div>
              <div style={{
                flex: 1, height: 6, borderRadius: 3, background: C.elevated, overflow: "hidden",
              }}>
                <div style={{
                  width: `${skill.score}%`, height: "100%", borderRadius: 3,
                  background: skill.score >= 60 ? C.secondary : C.primary,
                }} />
              </div>
              <div style={{ color: C.textMuted, fontSize: 12, width: 35, textAlign: "right" }}>
                {skill.score}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
