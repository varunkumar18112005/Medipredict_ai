"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import api, { setSession } from "../../services/api";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = Registration details, 2 = OTP verification
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleInitiateRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("Please agree to the Terms and Conditions to proceed.");
      return;
    }

    const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (!STRONG_PASSWORD_REGEX.test(password)) {
      setError("Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character (e.g. User@1234). Spaces are not allowed.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      await api.post("/auth/register/initiate", {
        firstName,
        lastName,
        email,
        password,
      });
      setMessage(`Security code successfully dispatched to ${email}.`);
      setStep(2);
    } catch (err: any) {
      const serverMsg = typeof err.response?.data === 'string' 
        ? err.response.data 
        : (err.response?.data?.message || err.response?.data?.error || err.message);
      setError(serverMsg || "Failed to initiate registration. Please verify details.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/register/verify", {
        email,
        otp,
        firstName,
        lastName,
        password,
      });
      const { accessToken, refreshToken, user } = response.data;
      
      setSession(accessToken, refreshToken, user);
      
      router.push("/dashboard/settings");
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        "Verification failed. The OTP code may be invalid or expired."
      );
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
      <div className="glow-orb" style={{ top: "10%", right: "15%" }}></div>

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

      <div className="card-3d" style={{ width: "100%", maxWidth: "460px", position: "relative" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "10px", color: "#1e293b" }}>
          {step === 1 ? "Create Account" : "Verify Authorization"}
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "24px" }}>
          {step === 1 ? "Initialize your medical profile credentials." : "Enter the verification code sent to your email."}
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

        {message && (
          <div style={{
            background: "rgba(0, 255, 135, 0.1)",
            border: "1px solid var(--success)",
            borderRadius: "8px",
            padding: "12px",
            color: "var(--success)",
            fontSize: "0.85rem",
            marginBottom: "20px",
            lineHeight: 1.4,
          }}>
            ✓ {message}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleInitiateRegister} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                  First Name
                </label>
                <input
                  type="text"
                  className="input-3d"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value.replace(/[^a-zA-Z\s'-]/g, ""))}
                  placeholder="John"
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                  Last Name
                </label>
                <input
                  type="text"
                  className="input-3d"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value.replace(/[^a-zA-Z\s'-]/g, ""))}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                Email Address
              </label>
              <input
                type="email"
                className="input-3d"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@example.com"
                required
              />
            </div>

            <div>
              <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                Secret Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-3d"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\s/g, ""))}
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

            {/* Terms and Conditions Checkbox */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", margin: "2px 0" }}>
              <input
                type="checkbox"
                id="terms-checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                style={{
                  width: "18px",
                  height: "18px",
                  marginTop: "2px",
                  accentColor: "var(--primary)",
                  cursor: "pointer",
                  flexShrink: 0
                }}
              />
              <label htmlFor="terms-checkbox" style={{ fontSize: "0.83rem", color: "var(--text-muted)", cursor: "pointer", lineHeight: 1.4 }}>
                I agree to the{" "}
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowTermsModal(true);
                  }}
                  style={{
                    color: "#60a5fa",
                    fontWeight: 700,
                    textDecoration: "underline",
                    cursor: "pointer",
                    textShadow: "0 0 10px rgba(96, 165, 250, 0.5)",
                    transition: "color 0.2s ease"
                  }}
                >
                  Terms and Conditions
                </span>
                {" "}and Privacy Policy
              </label>
            </div>

            <button
              type="submit"
              className="btn-3d"
              style={{ 
                width: "100%", 
                marginTop: "6px",
                opacity: !acceptedTerms || loading ? 0.5 : 1,
                cursor: !acceptedTerms || loading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease"
              }}
              disabled={loading || !acceptedTerms}
            >
              {loading ? "Registering..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{
              padding: "12px 16px",
              background: "rgba(30, 136, 229, 0.08)",
              border: "1px solid rgba(30, 136, 229, 0.2)",
              borderRadius: "12px",
              fontSize: "0.85rem",
              color: "#1E88E5",
              fontWeight: 600,
              lineHeight: "1.4"
            }}>
              📩 <strong>OTP Dispatched to Email</strong><br />
              A 6-digit verification code has been sent to <strong>{email}</strong>.<br />
              <span style={{ fontSize: "0.78rem", color: "#64748b", display: "block", marginTop: "4px" }}>
                Please enter the 6-digit OTP code received in your email inbox to complete registration.
              </span>
            </div>

            <div>
              <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                One-Time OTP Code
              </label>
              <input
                type="text"
                className="input-3d"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                required
                style={{ textAlign: "center", letterSpacing: "8px", fontSize: "1.5rem" }}
              />
            </div>

            <button
              type="submit"
              className="btn-3d"
              style={{ width: "100%", marginTop: "10px" }}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify & Complete Registration"}
            </button>

            <button
              type="button"
              className="btn-3d-neutral"
              style={{ width: "100%" }}
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Back
            </button>
          </form>
        )}

        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Already registered?{" "}
          <Link href="/login" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
            Sign In
          </Link>
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "20px",
            maxWidth: "600px",
            width: "100%",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#F8FAFC"
            }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#263238" }}>
                📜 Terms and Conditions & Privacy Policy
              </h3>
              <button
                onClick={() => setShowTermsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748B",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: "4px"
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: "24px",
              overflowY: "auto",
              color: "#334155",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              display: "flex",
              flexDirection: "column",
              gap: "18px"
            }}>
              <p style={{ margin: 0 }}>
                <strong style={{ color: "#263238" }}>Welcome to MediPredict AI.</strong> Please read these Terms and Conditions carefully before authorizing your diagnostic portal session.
              </p>

              <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                <h4 style={{ color: "#263238", fontWeight: 800, marginBottom: "6px", fontSize: "0.95rem" }}>1. Clinical & Diagnostic Disclaimer</h4>
                <p style={{ margin: 0 }}>
                  MediPredict AI is an advanced decision-support and risk-profiling platform. The predictions, scores, and disease likelihood metrics provided are generated by machine learning algorithms for preliminary screening and educational purposes. MediPredict AI does not replace professional clinical advice, official medical diagnoses, or treatment plans. Always consult a certified medical professional for diagnostic evaluation.
                </p>
              </div>

              <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                <h4 style={{ color: "#263238", fontWeight: 800, marginBottom: "6px", fontSize: "0.95rem" }}>2. Data Security & Telemetry Privacy</h4>
                <p style={{ margin: 0 }}>
                  Your security and health data privacy are paramount. All clinical indicators, biometric data, lab telemetry, and account credentials submitted to MediPredict AI are protected using end-to-end encryption (TLS/JWT). We strictly enforce data privacy standards and will never sell, rent, or distribute your personal health data to unauthorized third-party entities.
                </p>
              </div>

              <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                <h4 style={{ color: "#263238", fontWeight: 800, marginBottom: "6px", fontSize: "0.95rem" }}>3. User Account Responsibilities</h4>
                <p style={{ margin: 0 }}>
                  By maintaining an account, you agree to provide accurate biological indicators when executing risk prediction pipelines. You are responsible for maintaining the confidentiality of your health portal authentication tokens and for all activities that occur under your session credentials.
                </p>
              </div>

              <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                <h4 style={{ color: "#263238", fontWeight: 800, marginBottom: "6px", fontSize: "0.95rem" }}>4. Platform Usage & Limitation of Liability</h4>
                <p style={{ margin: 0 }}>
                  You agree to use MediPredict AI solely for lawful health monitoring purposes. Under no circumstances shall MediPredict AI, its developers, or affiliated diagnostic centers be held liable for clinical decisions or medical outcomes resulting from automated risk assessments.
                </p>
              </div>

              <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                <h4 style={{ color: "#263238", fontWeight: 800, marginBottom: "6px", fontSize: "0.95rem" }}>5. Updates & Modifications</h4>
                <p style={{ margin: 0 }}>
                  MediPredict AI reserves the right to refine machine learning pipelines, update system parameters, or adjust these Terms & Conditions to reflect technical or regulatory improvements. Continued use of the platform constitutes agreement to the updated terms.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "16px 24px",
              borderTop: "1px solid #E2E8F0",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              background: "rgba(0, 0, 0, 0.3)"
            }}>
              <button
                onClick={() => {
                  setAcceptedTerms(true);
                  setShowTermsModal(false);
                }}
                className="btn-3d"
                style={{ padding: "10px 24px", fontSize: "0.85rem" }}
              >
                Accept Terms & Conditions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
