import { useState } from "react";

const C = {
  ink: "#0C0A14", surface: "#161222", elevated: "#241E38",
  saffron: "#E8A838", teal: "#5BA8A0", text: "#F0EBE3",
  textSecondary: "#A89FB8", textMuted: "#6B6080",
  border: "rgba(240, 235, 227, 0.06)",
};

const POST_TYPES = [
  { value: "achievement", label: "Achievement" },
  { value: "practice_share", label: "Practice Session" },
  { value: "level_up", label: "Level Up" },
  { value: "milestone", label: "Milestone" },
  { value: "discovery", label: "Discovery" },
  { value: "learning_update", label: "Learning Update" },
];

export default function PostComposer({ onSubmit }) {
  const [isOpen, setIsOpen] = useState(false);
  const [postType, setPostType] = useState("achievement");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("public");

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit({ post_type: postType, content: content.trim(), visibility });
    setContent("");
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          width: "100%", background: C.surface, border: `1px dashed ${C.border}`,
          borderRadius: 14, padding: 16, cursor: "pointer",
          color: C.textMuted, fontSize: 14, textAlign: "left",
          marginBottom: 16,
        }}
      >
        {"\u{270F}\u{FE0F}"} Share your progress...
      </button>
    );
  }

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.saffron}33`,
      borderRadius: 14, padding: 20, marginBottom: 16,
    }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <select
          value={postType}
          onChange={(e) => setPostType(e.target.value)}
          style={{
            background: C.elevated, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "8px 12px", color: C.text,
            fontSize: 13, outline: "none",
          }}
        >
          {POST_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          style={{
            background: C.elevated, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "8px 12px", color: C.text,
            fontSize: 13, outline: "none",
          }}
        >
          <option value="public">Public</option>
          <option value="friends">Friends Only</option>
          <option value="private">Private</option>
        </select>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What did you practice today?"
        rows={3}
        style={{
          width: "100%", background: C.elevated, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: 12, color: C.text, fontSize: 14,
          outline: "none", resize: "vertical", fontFamily: "inherit",
          lineHeight: 1.5, boxSizing: "border-box",
        }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: "none", border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "8px 16px", color: C.textMuted,
            fontSize: 13, cursor: "pointer",
          }}
        >Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={!content.trim()}
          style={{
            background: content.trim() ? C.saffron : C.elevated,
            color: content.trim() ? C.ink : C.textMuted,
            border: "none", borderRadius: 8, padding: "8px 16px",
            fontSize: 13, fontWeight: 600, cursor: content.trim() ? "pointer" : "default",
          }}
        >Share</button>
      </div>
    </div>
  );
}
