import { useState } from "react";

const C = {
  ink: "#0C0A14", surface: "#161222", elevated: "#241E38",
  saffron: "#E8A838", teal: "#5BA8A0", text: "#F0EBE3",
  textSecondary: "#A89FB8", textMuted: "#6B6080",
  border: "rgba(240, 235, 227, 0.06)",
};

const POST_TYPE_ICONS = {
  achievement: "\u{1F3C6}", practice_share: "\u{1F3B9}", level_up: "\u{1F31F}",
  milestone: "\u{1F4CD}", discovery: "\u{1F50D}", mission_complete: "\u{2705}",
  learning_update: "\u{1F4DA}", default: "\u{1F3B5}",
};

export default function CommunityPost({ post, onLike, onComment }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const icon = POST_TYPE_ICONS[post.post_type] || POST_TYPE_ICONS.default;

  const handleLike = () => onLike && onLike(post.id);
  const handleSubmitComment = () => {
    if (commentText.trim() && onComment) {
      onComment(post.id, commentText.trim());
      setCommentText("");
    }
  };

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: 20, marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: C.elevated, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 18,
        }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.saffron, fontSize: 14, fontWeight: 600 }}>
            {post.username}
          </div>
          <div style={{ color: C.textMuted, fontSize: 11 }}>
            {post.post_type.replace(/_/g, " ")}
          </div>
        </div>
        <div style={{ color: C.textMuted, fontSize: 11 }}>
          {post.created_at ? new Date(post.created_at).toLocaleDateString() : ""}
        </div>
      </div>

      <p style={{ color: C.text, fontSize: 14, lineHeight: 1.5, margin: "0 0 12px" }}>
        {post.content}
      </p>

      {post.metadata && (
        <div style={{
          background: C.elevated, borderRadius: 10, padding: 12,
          marginBottom: 12, fontSize: 12, color: C.textSecondary,
        }}>
          {post.metadata.activity && <span>Activity: {post.metadata.activity} </span>}
          {post.metadata.score != null && <span>Score: {post.metadata.score} </span>}
          {post.metadata.duration_minutes && <span>Duration: {post.metadata.duration_minutes}min</span>}
        </div>
      )}

      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <button
          onClick={handleLike}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: post.liked_by_me ? C.saffron : C.textMuted, fontSize: 13,
            display: "flex", alignItems: "center", gap: 4, padding: "4px 8px",
            borderRadius: 6,
          }}
        >
          {post.liked_by_me ? "\u{2764}\u{FE0F}" : "\u{1F44D}"} {post.likes_count}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: C.textMuted, fontSize: 13, display: "flex",
            alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6,
          }}
        >
          {"\u{1F4AC}"} {post.comments_count}
        </button>
      </div>

      {showComments && (
        <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
              placeholder="Write a comment..."
              style={{
                flex: 1, background: C.elevated, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13,
                outline: "none",
              }}
            />
            <button onClick={handleSubmitComment} style={{
              background: C.saffron, color: C.ink, border: "none",
              borderRadius: 8, padding: "8px 14px", fontSize: 12,
              fontWeight: 600, cursor: "pointer",
            }}>Post</button>
          </div>
        </div>
      )}
    </div>
  );
}
