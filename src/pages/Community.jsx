import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import communityApi from "../api/communityApi";
import CommunityPost from "../components/community/CommunityPost";
import PostComposer from "../components/community/PostComposer";
import GroupCard from "../components/community/GroupCard";
import ChallengeCard from "../components/community/ChallengeCard";
import PartnerCard from "../components/community/PartnerCard";
import CommunityLeaderboard from "../components/community/CommunityLeaderboard";
import NotificationCenter from "../components/community/NotificationCenter";

const C = {
  ink: "#0C0A14", surface: "#161222", elevated: "#241E38",
  saffron: "#E8A838", teal: "#5BA8A0", text: "#F0EBE3",
  textSecondary: "#A89FB8", textMuted: "#6B6080",
  border: "rgba(240, 235, 227, 0.06)",
};

const TABS = ["Feed", "Groups", "Challenges", "Partners", "Leaderboard", "Notifications"];

export default function Community() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Feed");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [feed, setFeed] = useState([]);
  const [groups, setGroups] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [partners, setPartners] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [feedData, groupData, challengeData, partnerData, lbData, notifData, unread] =
        await Promise.all([
          communityApi.getFeed(20, 0).catch(() => []),
          communityApi.getGroups(20, 0).catch(() => []),
          communityApi.getChallenges(20).catch(() => []),
          communityApi.getPartners(10).catch(() => []),
          communityApi.getLeaderboard("weekly", 20).catch(() => []),
          communityApi.getNotifications(20).catch(() => []),
          communityApi.getUnreadCount().catch(() => ({ count: 0 })),
        ]);
      setFeed(Array.isArray(feedData) ? feedData : []);
      setGroups(Array.isArray(groupData) ? groupData : []);
      setChallenges(Array.isArray(challengeData) ? challengeData : []);
      setPartners(Array.isArray(partnerData) ? partnerData : []);
      setLeaderboard(Array.isArray(lbData) ? lbData : []);
      setNotifications(Array.isArray(notifData) ? notifData : []);
      setUnreadCount(unread.count || 0);
    } catch (e) {
      setError(e.message || "Failed to load community data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (data) => {
    try {
      const post = await communityApi.createPost(data);
      setFeed((prev) => [post, ...prev]);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleLike = async (postId) => {
    try {
      const result = await communityApi.likePost(postId);
      setFeed((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, liked_by_me: result.liked, likes_count: result.likes_count }
            : p
        )
      );
    } catch (e) {
      setError(e.message);
    }
  };

  const handleComment = async (postId, content) => {
    try {
      await communityApi.addComment(postId, content);
      setFeed((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
        )
      );
    } catch (e) {
      setError(e.message);
    }
  };

  const handleFollow = async (userId) => {
    try {
      await communityApi.followUser(userId);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const result = await communityApi.joinGroup(groupId);
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, is_member: result.joined, members_count: result.members_count }
            : g
        )
      );
    } catch (e) {
      setError(e.message);
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    try {
      await communityApi.joinChallenge(challengeId);
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === challengeId
            ? { ...c, participants_count: c.participants_count + 1 }
            : c
        )
      );
    } catch (e) {
      setError(e.message);
    }
  };

  const handleLbChange = async (type) => {
    try {
      const data = await communityApi.getLeaderboard(type, 20);
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleMarkRead = async () => {
    try {
      await communityApi.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.textMuted, fontSize: 14 }}>Loading community...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: C.text, fontSize: 28, fontWeight: 700, margin: "0 0 4px" }}>
          Community
        </h1>
        <p style={{ color: C.textSecondary, fontSize: 14, margin: 0 }}>
          Connect, collaborate, and learn together
        </p>
      </div>

      {error && (
        <div style={{
          background: "#3a1520", border: "1px solid #5a2030",
          borderRadius: 10, padding: 12, marginBottom: 16, color: "#ff6b6b", fontSize: 13,
        }}>{error}</div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 24, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 4 }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? C.saffron : C.surface,
              color: activeTab === tab ? C.ink : C.textSecondary,
              border: "none", borderRadius: 8, padding: "8px 14px",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              position: "relative", whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            {tab}
            {tab === "Notifications" && unreadCount > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -4,
                background: C.saffron, color: C.ink, borderRadius: 8,
                width: 18, height: 18, fontSize: 10, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "Feed" && (
        <>
          <PostComposer onSubmit={handleCreatePost} />
          {feed.length === 0 ? (
            <div style={{
              background: C.surface, borderRadius: 14, padding: 40,
              textAlign: "center", color: C.textMuted, fontSize: 14,
            }}>
              No posts yet. Be the first to share your progress!
            </div>
          ) : (
            feed.map((post) => (
              <CommunityPost key={post.id} post={post} onLike={handleLike} onComment={handleComment} />
            ))
          )}
        </>
      )}

      {activeTab === "Groups" && (
        <>
          {groups.length === 0 ? (
            <div style={{
              background: C.surface, borderRadius: 14, padding: 40,
              textAlign: "center", color: C.textMuted, fontSize: 14,
            }}>No groups yet</div>
          ) : (
            groups.map((g) => (
              <div key={g.id} style={{ marginBottom: 12 }}>
                <GroupCard group={g} onJoin={handleJoinGroup} onNavigate={(p) => navigate(p)} />
              </div>
            ))
          )}
        </>
      )}

      {activeTab === "Challenges" && (
        <>
          {challenges.length === 0 ? (
            <div style={{
              background: C.surface, borderRadius: 14, padding: 40,
              textAlign: "center", color: C.textMuted, fontSize: 14,
            }}>No active challenges</div>
          ) : (
            challenges.map((c) => (
              <ChallengeCard key={c.id} challenge={c} onJoin={handleJoinChallenge} />
            ))
          )}
        </>
      )}

      {activeTab === "Partners" && (
        <>
          {partners.length === 0 ? (
            <div style={{
              background: C.surface, borderRadius: 14, padding: 40,
              textAlign: "center", color: C.textMuted, fontSize: 14,
            }}>No partners found</div>
          ) : (
            partners.map((p) => (
              <div key={p.user_id} style={{ marginBottom: 8 }}>
                <PartnerCard partner={p} onFollow={handleFollow} onNavigate={(p) => navigate(p)} />
              </div>
            ))
          )}
        </>
      )}

      {activeTab === "Leaderboard" && (
        <CommunityLeaderboard entries={leaderboard} onTypeChange={handleLbChange} />
      )}

      {activeTab === "Notifications" && (
        <NotificationCenter
          notifications={notifications}
          onMarkRead={handleMarkRead}
          unreadCount={unreadCount}
        />
      )}
    </div>
  );
}
