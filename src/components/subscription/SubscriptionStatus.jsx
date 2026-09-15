import C from "../ui/colors";

export default function SubscriptionStatus({ subscription, onManage }) {
  if (!subscription) return null;
  const isActive = subscription.status === "active";
  const isCanceled = subscription.cancel_at_period_end;

  return (
    <div style={{
      background: C.surface, borderRadius: 18, padding: "28px 24px",
      border: `1px solid ${isActive ? `${C.primary}25` : C.border}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: 0 }}>
          Subscription
        </h3>
        {onManage && (
          <button onClick={onManage} style={{
            background: `${C.secondary}15`, color: C.secondary, border: `1px solid ${C.secondary}25`,
            padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => e.target.style.background = `${C.secondary}25`}
          onMouseLeave={(e) => e.target.style.background = `${C.secondary}15`}
          >
            Manage
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
        <div>
          <div style={{ color: C.textMuted, fontSize: 12, marginBottom: 4 }}>Current Plan</div>
          <div style={{ color: C.primary, fontSize: 18, fontWeight: 700 }}>
            {subscription.plan_name || subscription.plan_id}
          </div>
        </div>
        <div>
          <div style={{ color: C.textMuted, fontSize: 12, marginBottom: 4 }}>Status</div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 14, fontWeight: 600,
            color: isCanceled ? C.primary : isActive ? C.secondary : C.textMuted,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: isCanceled ? C.primary : isActive ? C.secondary : C.textMuted,
            }} />
            {isCanceled ? "Cancels at period end" : isActive ? "Active" : subscription.status}
          </div>
        </div>
        {subscription.current_period_end && (
          <div>
            <div style={{ color: C.textMuted, fontSize: 12, marginBottom: 4 }}>
              {isCanceled ? "Cancels on" : "Renewal date"}
            </div>
            <div style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>
              {new Date(subscription.current_period_end).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </div>
          </div>
        )}
        <div>
          <div style={{ color: C.textMuted, fontSize: 12, marginBottom: 4 }}>Price</div>
          <div style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>
            {subscription.price_inr === 0 ? "Free" : `\u20b9${subscription.price_inr}/month`}
          </div>
        </div>
      </div>
    </div>
  );
}
