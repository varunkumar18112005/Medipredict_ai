"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import api, { setSession } from "../../services/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { accessToken, refreshToken, user } = response.data;

      setSession(accessToken, refreshToken, user);

      const isProfileIncomplete = !user || !user.gender || !user.dateOfBirth;
      if (isProfileIncomplete) {
        router.push("/dashboard/settings");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'ECONNABORTED' || (err.message && err.message.includes('timeout'))) {
        setError(
          "⏳ Cloud backend server is warming up from sleep mode (Render cold start). Please wait 10-15 seconds and click Sign In again."
        );
      } else {
        setError(
          err.response?.data?.message ||
          err.userFriendlyMessage ||
          "Invalid email or password. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first to receive the reset token.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      position: "relative",
    }}>
      <div className="glow-orb" style={{ top: "15%", left: "20%" }}></div>

      <div style={{ marginBottom: "30px", textAlign: "center" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "#1e293b" }}>
          <img
            src="/logo.png"
            alt="Logo"
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "6px",
              objectFit: "cover"
            }}
          />
          <span style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase" }}>
            MediPredict <span style={{ color: "var(--primary)" }}>AI</span>
          </span>
        </Link>
      </div>

      <div className="card-3d" style={{ width: "100%", maxWidth: "420px", position: "relative" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "10px", color: "#1e293b" }}>Welcome Back</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "24px" }}>
          Authorize your diagnostic session to proceed.
        </p>

        {error && (
          <div style={{
            background: "rgba(255, 51, 102, 0.1)",
            border: "1px solid var(--error)",
            borderRadius: "8px",
            padding: "12px",
            color: "var(--error)",
            fontSize: "0.85rem",
            marginBottom: "20px",
            lineHeight: 1.4,
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
              Email Address
            </label>
            <input
              type="email"
              className="input-3d"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@medipredict.ai"
              required
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems: "center" }}>
              <label style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase" }}>
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  padding: 0
                }}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="input-3d"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingRight: "42px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px"
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-3d"
            style={{
              width: "100%",
              marginTop: "6px",
              opacity: loading ? 0.5 : 1,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease"
            }}
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>

        </form>

        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "0.85rem", color: "#475569" }}>
          Need an account?{" "}
          <Link href="/register" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
