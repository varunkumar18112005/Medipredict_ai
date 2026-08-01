"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, Suspense } from "react";
import api from "../../services/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !token || !newPassword) {
      setError("Please fill in all fields.");
      return;
    }
    
    const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
      setError("Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character (e.g. User@1234). Spaces are not allowed.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/auth/reset-password", { email, token, newPassword });
      setSuccess("Password reset successfully. You can now login.");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        "Failed to reset password. Please check your token."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "420px", position: "relative" }} className="card-3d">
      <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "10px", color: "#1e293b" }}>Reset Password</h2>
      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "24px" }}>
        Enter the reset token sent to your email and your new password.
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

      {success && (
        <div style={{
          background: "rgba(16, 185, 129, 0.1)",
          border: "1px solid #10B981",
          borderRadius: "8px",
          padding: "12px",
          color: "#10B981",
          fontSize: "0.85rem",
          marginBottom: "20px",
          lineHeight: 1.4,
        }}>
          ✅ {success}
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
            readOnly={!!initialEmail}
            style={{ opacity: initialEmail ? 0.7 : 1 }}
          />
        </div>

        <div>
          <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
            Reset Token (OTP)
          </label>
          <input
            type="text"
            className="input-3d"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter the 6-digit OTP"
            required
          />
        </div>

        <div>
          <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
            New Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              className="input-3d"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
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
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      <div style={{ marginTop: "24px", textAlign: "center", fontSize: "0.85rem", color: "#475569" }}>
        Remembered your password?{" "}
        <Link href="/login" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
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

      <Suspense fallback={<div className="card-3d" style={{ width: "100%", maxWidth: "420px", textAlign: "center", padding: "40px" }}>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
