const C = {
  ink: "#0C0A14", surface: "#161222", elevated: "#241E38",
  saffron: "#E8A838", teal: "#5BA8A0", text: "#F0EBE3",
  textSecondary: "#A89FB8", textMuted: "#6B6080",
  border: "rgba(240, 235, 227, 0.06)",
};

export default function BillingHistory({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div style={{
        background: C.surface, borderRadius: 18, padding: "28px 24px",
        border: `1px solid ${C.border}`,
      }}>
        <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: "0 0 16px" }}>
          Billing History
        </h3>
        <div style={{ color: C.textMuted, fontSize: 14, textAlign: "center", padding: "24px 0" }}>
          No billing history yet
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: C.surface, borderRadius: 18, padding: "28px 24px",
      border: `1px solid ${C.border}`,
    }}>
      <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: "0 0 16px" }}>
        Billing History
      </h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Date", "Plan", "Amount", "Status"].map((h) => (
                <th key={h} style={{
                  textAlign: "left", padding: "10px 12px",
                  color: C.textMuted, fontSize: 12, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: 0.5,
                  borderBottom: `1px solid ${C.border}`,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td style={{ padding: "12px", color: C.text, fontSize: 13, borderBottom: `1px solid ${C.border}` }}>
                  {tx.created_at ? new Date(tx.created_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  }) : "-"}
                </td>
                <td style={{ padding: "12px", color: C.textSecondary, fontSize: 13, textTransform: "capitalize", borderBottom: `1px solid ${C.border}` }}>
                  {tx.plan_id}
                </td>
                <td style={{ padding: "12px", color: C.text, fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${C.border}` }}>
                  {tx.amount_inr === 0 ? "Free" : `\u20b9${tx.amount_inr}`}
                </td>
                <td style={{ padding: "12px", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{
                    display: "inline-block", padding: "3px 10px", borderRadius: 8,
                    fontSize: 12, fontWeight: 600,
                    background: tx.status === "completed" ? `${C.teal}15` : tx.status === "failed" ? "rgba(239,68,68,0.1)" : `${C.saffron}15`,
                    color: tx.status === "completed" ? C.teal : tx.status === "failed" ? "#EF4444" : C.saffron,
                  }}>
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
