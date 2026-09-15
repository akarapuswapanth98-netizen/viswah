import { useNavigate } from "react-router-dom";

import C from "../components/ui/colors";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: 72,
          fontWeight: 800,
          color: C.primary,
          lineHeight: 1,
          marginBottom: 16,
        }}>
          404
        </div>
        <h1 style={{
          color: C.text,
          fontSize: 24,
          fontWeight: 700,
          margin: "0 0 8px",
        }}>
          Page not found
        </h1>
        <p style={{
          color: C.textSecondary,
          fontSize: 15,
          margin: "0 0 32px",
          maxWidth: 360,
          lineHeight: 1.5,
        }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: "rgba(240, 235, 227, 0.06)",
              color: C.text,
              border: `1px solid rgba(240, 235, 227, 0.1)`,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Go Back
          </button>
          <button
            onClick={() => navigate("/home")}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: C.primary,
              color: C.ink,
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
