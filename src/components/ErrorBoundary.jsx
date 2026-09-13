import { Component } from "react";

const C = {
  ink: "#0C0A14",
  surface: "#161222",
  saffron: "#E8A838",
  teal: "#5BA8A0",
  text: "#F0EBE3",
  textSecondary: "#A89FB8",
  textMuted: "#6B6080",
};

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/home";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          background: C.ink,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}>
          <div style={{
            background: C.surface,
            border: `1px solid rgba(239, 68, 68, 0.2)`,
            borderRadius: 16,
            padding: "40px 32px",
            maxWidth: 440,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {"\u{1F3B5}"}
            </div>
            <h2 style={{
              color: C.text,
              fontSize: 20,
              fontWeight: 700,
              margin: "0 0 8px",
            }}>
              Something went wrong
            </h2>
            <p style={{
              color: C.textSecondary,
              fontSize: 14,
              margin: "0 0 24px",
              lineHeight: 1.5,
            }}>
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={this.handleReset}
              style={{
                padding: "10px 24px",
                borderRadius: 10,
                background: C.saffron,
                color: C.ink,
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
