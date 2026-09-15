import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import C from "../components/ui/colors";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const validate = () => {
    if (!form.username || form.username.length < 4) return "Username must be at least 4 characters";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) return "Enter a valid email";
    if (!form.password || form.password.length < 6) return "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true);
    setError("");
    try {
      await register(form.username, form.email, form.password);
      toast.success("Account created! Welcome to VISWAH");
      navigate("/home");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "#fff",
    fontSize: 14, outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, C.ink 0%, #1a1a3e 50%, C.ink 100%)", padding: 20,
    }}>
      <style>{`
        @media (max-width: 768px) {
          .register-container { align-items: flex-start !important; padding-top: 40px !important; overflow-y: auto !important; }
        }
      `}</style>
      <div className="register-container" style={{
        width: "100%", maxWidth: 420, background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 20, padding: "40px 32px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 8px" }}>
            <span style={{ color: "C.primary" }}>VIS</span><span style={{ color: "C.secondary" }}>WAH</span>
          </h1>
          <p style={{ color: "#B0B0CC", fontSize: 14 }}>Create your learning account</p>
        </div>

        {error && (
          <div role="alert" style={{
            background: "rgba(255,59,48,0.15)", border: "1px solid rgba(255,59,48,0.3)",
            borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#FF3B30", fontSize: 13,
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {[
            { label: "Username", key: "username", placeholder: "Min 4 characters", type: "text", id: "reg-username" },
            { label: "Email", key: "email", placeholder: "you@example.com", type: "email", id: "reg-email" },
          ].map(({ label, key, placeholder, type, id }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label htmlFor={id} style={{ display: "block", color: "#B0B0CC", fontSize: 13, marginBottom: 6 }}>{label}</label>
              <input id={id} type={type} value={form[key]} onChange={(e) => update(key, e.target.value)}
                placeholder={placeholder} style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "C.primary"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
              />
            </div>
          ))}

          <div style={{ marginBottom: 16, position: "relative" }}>
            <label htmlFor="reg-password" style={{ display: "block", color: "#B0B0CC", fontSize: 13, marginBottom: 6 }}>Password</label>
            <input id="reg-password" type={showPassword ? "text" : "password"} value={form.password}
              onChange={(e) => update("password", e.target.value)} placeholder="Min 6 characters"
              style={{ ...inputStyle, paddingRight: 44 }}
              onFocus={(e) => e.target.style.borderColor = "C.primary"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{ position: "absolute", right: 4, top: 32, background: "none", border: "none", color: "#6B6B8D", cursor: "pointer", fontSize: 18, padding: "8px", minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="reg-confirm" style={{ display: "block", color: "#B0B0CC", fontSize: 13, marginBottom: 6 }}>Confirm Password</label>
            <input id="reg-confirm" type={showPassword ? "text" : "password"} value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)} placeholder="Repeat password"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = "C.primary"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "13px 0", background: loading ? "#4A42D4" : "C.primary",
            color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, color: "#6B6B8D", fontSize: 13 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "C.primary", textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
