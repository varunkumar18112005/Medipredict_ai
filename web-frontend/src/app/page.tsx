"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import DepthCarousel from "../components/DepthCarousel";
import "../components/DepthCarousel.css";

// ── Light Theme Ambient Canvas Background ──────────────────────────────────────
function LightMedicalBackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: { x: number; y: number; vx: number; vy: number; radius: number; alpha: number }[] = [];
    const count = Math.min(Math.floor(width / 22), 55);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2.5 + 1,
        alpha: Math.random() * 0.15 + 0.05,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle connecting lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(30, 136, 229, ${0.08 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Render floating particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(30, 136, 229, ${p.alpha})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

export default function LuxuriousLightMedicalLandingPage() {
  const [selectedDisease, setSelectedDisease] = useState("DIABETES");
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);

  const handleSimulateOcr = () => {
    setIsOcrScanning(true);
    setOcrSuccess(false);
    setTimeout(() => {
      setIsOcrScanning(false);
      setOcrSuccess(true);
    }, 2200);
  };

  const diseaseCategories = [
    { id: "DIABETES", name: "Diabetes", icon: "🩸", desc: "Evaluates metabolic trajectory, insulin resistance, and glycemic index." },
    { id: "HEART", name: "Heart Disease", icon: "🫀", desc: "Assesses resting BP, lipid profile, cardiac rhythm, and arterial risk." },
    { id: "KIDNEY", name: "Kidney Disease", icon: "🧪", desc: "Monitors eGFR filtration rate, serum creatinine, and renal health." },
    { id: "LIVER", name: "Liver Disease", icon: "🩺", desc: "Evaluates ALT/AST enzymes, bilirubin levels, and hepatic clearance." },
    { id: "THYROID", name: "Thyroid Disorders", icon: "🧬", desc: "Screens TSH, free T3/T4 hormone balances for metabolic disorders." },
    { id: "PULMONARY", name: "Pulmonary Disease", icon: "🫁", desc: "Evaluates lung capacity, oxygen saturation, and respiration indices." },
    { id: "STROKE", name: "Stroke Risk", icon: "🧠", desc: "Neurovascular risk profiling using ischemic probability factors." },
    { id: "ANEMIA", name: "Anemia Screening", icon: "🩸", desc: "Hematological profiling for hemoglobin, RBC volume, and iron." },
  ];

  return (
    <div
      style={{
        background: "#FFFFFF",
        color: "#263238",
        fontFamily: "'Inter', 'Manrope', 'Sora', sans-serif",
        minHeight: "100vh",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* ── CSS Styling & 3D Layer Animations ──────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&family=Sora:wght@400;600;700&display=swap');

        /* Subtly Layered Glassmorphism Cards */
        .med-card {
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 20px;
          box-shadow: 0 12px 36px rgba(30, 136, 229, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .med-card:hover {
          background: #FFFFFF;
          border-color: #90CAF9;
          box-shadow: 0 20px 48px rgba(30, 136, 229, 0.12), inset 0 1px 0 rgba(255, 255, 255, 1);
          transform: translateY(-4px);
        }

        .btn-primary-blue {
          background: linear-gradient(135deg, #1E88E5 0%, #1565C0 100%);
          color: #FFFFFF;
          font-weight: 600;
          padding: 14px 32px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(30, 136, 229, 0.28);
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          font-size: 0.95rem;
        }

        .btn-primary-blue:hover {
          background: linear-gradient(135deg, #1565C0 0%, #0D47A1 100%);
          box-shadow: 0 12px 32px rgba(30, 136, 229, 0.4);
          transform: translateY(-2px) scale(1.02);
        }

        .btn-secondary-light {
          background: rgba(244, 250, 255, 0.9);
          color: #1E88E5;
          font-weight: 600;
          padding: 14px 30px;
          border-radius: 12px;
          border: 1px solid #BBDEFB;
          backdrop-filter: blur(12px);
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          font-size: 0.95rem;
        }

        .btn-secondary-light:hover {
          background: #E3F2FD;
          border-color: #90CAF9;
          transform: translateY(-2px);
        }

        /* Floating 3D Keyframe Animations */
        @keyframes floatObject3D {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(3deg); }
        }
        .animate-float-object {
          animation: floatObject3D 7s ease-in-out infinite;
        }

        @keyframes haloRotate {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.03); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .rotate-halo {
          animation: haloRotate 40s linear infinite;
        }

        @keyframes ocrLineScan {
          0% { top: 0%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 92%; opacity: 0; }
        }
        .ocr-scan-line {
          animation: ocrLineScan 2.2s ease-in-out infinite;
        }

        /* Subtle Dot Matrix Mesh Texture Background */
        .medical-dot-grid {
          background-image: radial-gradient(rgba(30, 136, 229, 0.08) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #F8FAFC;
        }
        ::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
      `}} />

      {/* ── Fixed Header Navbar ────────────────────────────────────────────── */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "16px 36px",
          background: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 20px rgba(30, 136, 229, 0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #1E88E5, #4FC3F7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: "1.2rem",
              boxShadow: "0 4px 14px rgba(30, 136, 229, 0.3)",
            }}
          >
            🩺
          </div>
          <div>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1E88E5", letterSpacing: "-0.3px" }}>
              MediPredict <span style={{ color: "#2EBD85" }}>AI</span>
            </span>
            <span style={{ display: "block", fontSize: "0.65rem", color: "#64748B", fontWeight: 600, letterSpacing: "0.5px" }}>
              Intelligent Diagnostic Support
            </span>
          </div>
        </div>

        <nav style={{ display: "flex", gap: "32px", alignItems: "center" }} className="hidden md:flex">
          <a href="#about" style={{ color: "#475569", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>
            About
          </a>
          <a href="#features" style={{ color: "#475569", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>
            Features
          </a>
          <a href="#how-it-works" style={{ color: "#475569", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>
            How It Works
          </a>
          <a href="#diseases" style={{ color: "#475569", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>
            Diseases
          </a>
          <a href="#ocr-sec" style={{ color: "#475569", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>
            OCR Report Scan
          </a>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/login" style={{ color: "#1E88E5", textDecoration: "none", fontSize: "0.9rem", fontWeight: 700 }}>
            Sign In
          </Link>
          <Link href="/register" className="btn-primary-blue" style={{ padding: "10px 22px", fontSize: "0.85rem" }}>
            Start Assessment ➔
          </Link>
        </div>
      </header>

      {/* ── Section 1: Hero Section With Multi-Layered Luxurious Background ─ */}
      <section
        className="medical-dot-grid"
        style={{
          paddingTop: "150px",
          paddingBottom: "100px",
          background: "linear-gradient(180deg, #FFFFFF 0%, #F4FAFF 60%, #EBF5FF 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <LightMedicalBackgroundCanvas />

        {/* Top-Right Soft Clinical Lighting Glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "700px",
            height: "700px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(79, 195, 247, 0.18) 0%, rgba(30, 136, 229, 0.05) 50%, transparent 70%)",
            filter: "blur(70px)",
            pointerEvents: "none",
          }}
        />

        {/* Decorative Floating 3D Objects Around Hero */}
        <div className="animate-float-object" style={{ position: "absolute", top: "18%", left: "4%", fontSize: "2.4rem", opacity: 0.85, filter: "drop-shadow(0 10px 15px rgba(30,136,229,0.15))" }}>
          🧬
        </div>
        <div className="animate-float-object" style={{ position: "absolute", top: "65%", left: "6%", fontSize: "2.2rem", opacity: 0.8, filter: "drop-shadow(0 10px 15px rgba(30,136,229,0.15))", animationDelay: "-2.5s" }}>
          🧠
        </div>
        <div className="animate-float-object" style={{ position: "absolute", top: "25%", right: "5%", fontSize: "2.5rem", opacity: 0.85, filter: "drop-shadow(0 10px 15px rgba(30,136,229,0.15))", animationDelay: "-4s" }}>
          🛡️
        </div>
        <div className="animate-float-object" style={{ position: "absolute", top: "72%", right: "8%", fontSize: "2.2rem", opacity: 0.8, filter: "drop-shadow(0 10px 15px rgba(30,136,229,0.15))", animationDelay: "-1.5s" }}>
          💻
        </div>

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "60px", alignItems: "center" }}>
            {/* Left Content Side */}
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 18px",
                  borderRadius: "20px",
                  background: "rgba(227, 242, 253, 0.9)",
                  border: "1px solid rgba(144, 202, 249, 0.6)",
                  color: "#1E88E5",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  marginBottom: "20px",
                  boxShadow: "0 4px 12px rgba(30, 136, 229, 0.1)",
                }}
              >
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#1E88E5", boxShadow: "0 0 6px #1E88E5" }} />
                CLINICAL DIAGNOSTIC AI PLATFORM
              </div>

              <h1
                style={{
                  fontSize: "clamp(2.5rem, 5vw, 3.8rem)",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  color: "#1E293B",
                  letterSpacing: "-1px",
                  marginBottom: "20px",
                }}
              >
                Predict Health Risks Before They Become Serious
              </h1>

              <p
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#1E88E5",
                  marginBottom: "16px",
                  lineHeight: 1.5,
                }}
              >
                MediPredict AI is an intelligent diagnostic support platform that helps users understand disease risks using medical test results, AI-powered analysis, and personalized health recommendations.
              </p>

              <p
                style={{
                  fontSize: "0.95rem",
                  color: "#64748B",
                  marginBottom: "32px",
                  lineHeight: 1.6,
                }}
              >
                Select a disease, complete the recommended medical tests, upload your lab reports or enter test results, and receive an AI-powered prediction with easy-to-understand recommendations.
              </p>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <Link href="/register" className="btn-primary-blue">
                  Start Health Assessment
                </Link>
                <a href="#about" className="btn-secondary-light">
                  Learn More
                </a>
              </div>
            </div>

            {/* Right 3D Medical Illustration Side with Circular Medical Halo */}
            <div style={{ position: "relative", textAlign: "center" }}>
              {/* Abstract Circular Medical Halo Background */}
              <div
                className="rotate-halo"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "480px",
                  height: "480px",
                  borderRadius: "50%",
                  border: "2px dashed rgba(30, 136, 229, 0.2)",
                  pointerEvents: "none",
                }}
              />
              <div
                className="rotate-halo"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "380px",
                  height: "380px",
                  borderRadius: "50%",
                  border: "1px stroke rgba(79, 195, 247, 0.3)",
                  pointerEvents: "none",
                  animationDirection: "reverse",
                }}
              />

              <div
                className="med-card animate-float-object"
                style={{
                  padding: "36px",
                  background: "rgba(255, 255, 255, 0.92)",
                  border: "1px solid rgba(226, 232, 240, 0.9)",
                  borderRadius: "28px",
                  boxShadow: "0 24px 60px rgba(30, 136, 229, 0.12)",
                  position: "relative",
                  zIndex: 5,
                }}
              >
                {/* Doctor & Digital Anatomy Illustration Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9", paddingBottom: "16px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#E3F2FD", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
                      👨‍⚕️
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1E293B" }}>Dr. AI Diagnostic Suite</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748B" }}>Real-time Clinical Verification</div>
                    </div>
                  </div>
                  <span style={{ fontSize: "0.75rem", background: "#E8F5E9", color: "#2EBD85", fontWeight: 700, padding: "4px 10px", borderRadius: "12px" }}>
                    ● Active Analysis
                  </span>
                </div>

                {/* Vitals Telemetry Preview Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", textAlign: "left" }}>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "16px", borderRadius: "12px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>🫀 Blood Pressure</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1E293B", marginTop: "4px" }}>120 / 80</div>
                    <div style={{ fontSize: "0.7rem", color: "#2EBD85", fontWeight: 600, marginTop: "2px" }}>Normal Range</div>
                  </div>

                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "16px", borderRadius: "12px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>🩸 Fasting Glucose</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1E293B", marginTop: "4px" }}>95 mg/dL</div>
                    <div style={{ fontSize: "0.7rem", color: "#2EBD85", fontWeight: 600, marginTop: "2px" }}>Optimal Baseline</div>
                  </div>
                </div>

                {/* Floating Heartbeat SVG Line */}
                <div style={{ marginTop: "20px", background: "#F1F5F9", borderRadius: "12px", padding: "12px" }}>
                  <svg width="100%" height="40" viewBox="0 0 400 40" fill="none">
                    <path d="M 0 20 L 100 20 L 120 5 L 140 35 L 160 20 L 180 20 L 200 20 L 220 0 L 240 40 L 260 20 L 400 20" stroke="#1E88E5" strokeWidth="2.5" fill="none" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Trust Indicators ────────────────────────────────────── */}
      <section style={{ padding: "40px 24px", background: "#FFFFFF", borderTop: "1px solid #F1F5F9", borderBottom: "1px solid #F1F5F9" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            {[
              { icon: "🧬", title: "8 Disease Prediction Models", desc: "Multi-Target ML Engines" },
              { icon: "🤖", title: "AI-Assisted Analysis", desc: "Scikit-Learn Microservices" },
              { icon: "📄", title: "Medical Report OCR", desc: "PyTesseract Extraction" },
              { icon: "🔐", title: "Secure Data Protection", desc: "Encrypted Health Telemetry" },
              { icon: "🏥", title: "Hospital Consultation", desc: "Direct Booking & Routes" },
            ].map((item, idx) => (
              <div key={idx} className="med-card" style={{ padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>{item.icon}</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1E293B" }}>{item.title}</div>
                <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: About MediPredict AI ────────────────────────────────── */}
      <section id="about" style={{ padding: "90px 24px", background: "linear-gradient(180deg, #F4FAFF 0%, #FFFFFF 100%)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <span style={{ fontSize: "0.8rem", color: "#1E88E5", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
              PATIENT CARE WORKFLOW
            </span>
            <h2 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#1E293B", marginTop: "6px" }}>
              About MediPredict AI
            </h2>
            <p style={{ color: "#64748B", fontSize: "1rem", maxWidth: "680px", margin: "10px auto 0 auto" }}>
              Empowering patients and clinical practitioners with data-driven early disease forecasting and continuous care navigation.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
            {[
              { num: "01", title: "Select Disease Category", desc: "Choose from 8 specialized diagnostic categories including Cardio, Renal, and Endocrine." },
              { num: "02", title: "View Required Checkups", desc: "Inspect specific biomarker tests needed for an accurate clinical risk evaluation." },
              { num: "03", title: "Upload Lab Reports", desc: "Upload PDF or image test reports directly into our secure processing system." },
              { num: "04", title: "Automated OCR Extraction", desc: "PyTesseract OCR scans and extracts laboratory values automatically into inputs." },
              { num: "05", title: "Predict Disease Risk", desc: "ML microservices calculate your personalized risk probability score instantly." },
              { num: "06", title: "Receive Recommendations", desc: "Get tailored dietary, physical activity, and clinical advice." },
              { num: "07", title: "Find Nearby Hospitals", desc: "Discover specialized centers in your city using real-time OpenStreetMap." },
              { num: "08", title: "Book Consultations", desc: "Schedule in-person hospital visits and plot live turn-by-turn driving routes." },
            ].map((step, idx) => (
              <div key={idx} className="med-card" style={{ padding: "24px" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1E88E5", marginBottom: "8px" }}>{step.num}</div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1E293B" }}>{step.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "#64748B", marginTop: "6px", lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Core Features ────────────────────────────────────────── */}
      <section id="features" style={{ padding: "90px 24px", background: "#FFFFFF" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <span style={{ fontSize: "0.8rem", color: "#2EBD85", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
              PLATFORM CAPABILITIES
            </span>
            <h2 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#1E293B", marginTop: "6px" }}>
              Core Features
            </h2>
          </div>

          <div style={{ height: "460px", position: "relative", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <DepthCarousel
              items={[
                { icon: "🩺", title: "Disease-Specific Health Assessments", desc: "Tailored diagnostic inputs for 8 distinct chronic disease categories." },
                { icon: "📄", title: "Intelligent OCR Report Analysis", desc: "Extract unstructured laboratory PDF data into digital structured formats." },
                { icon: "🤖", title: "AI Disease Risk Prediction", desc: "Machine learning probability scoring backed by feature impact models." },
                { icon: "💡", title: "Personalized Health Suggestions", desc: "Actionable lifestyle, dietary, and medical follow-up guidelines." },
                { icon: "📈", title: "Interactive Health Analytics", desc: "Longitudinal multi-line trajectory graphs tracking risk scores over time." },
                { icon: "📍", title: "Hospital Locator", desc: "Geospatial discovery of hospitals and diagnostic clinics within 10km." },
                { icon: "🎟️", title: "Appointment Booking", desc: "Real-time consultation scheduling for hospital visits or telehealth." },
                { icon: "🗂️", title: "Medical History Tracking", desc: "Comprehensive patient logs and exportable clinical summary reports." },
                { icon: "🔐", title: "Secure User Accounts", desc: "Encrypted authentication with Spring Security and JWT bearer tokens." },
              ]}
              cardWidth={340}
              cardHeight={250}
              radius={20}
              tint="#1e88e5"
              depth={220}
              spread={90}
              tilt={22}
              tiltDirection="right"
              perspective={1400}
              visibleCards={4}
              falloff={0.18}
              blur={5}
              autoplay={true}
              autoplayDelay={3200}
              loop={true}
              showControls={true}
              showIndicators={true}
            />
          </div>
        </div>
      </section>

      {/* ── Section 5: How It Works ─────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: "90px 24px", background: "linear-gradient(180deg, #FFFFFF 0%, #F4FAFF 100%)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <span style={{ fontSize: "0.8rem", color: "#1E88E5", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
              STEP-BY-STEP PROCESS
            </span>
            <h2 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#1E293B", marginTop: "6px" }}>
              How It Works
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
            {[
              { step: "Step 1", title: "Choose Disease", desc: "Select target disease assessment", icon: "🎯" },
              { step: "Step 2", title: "Complete Checkups", desc: "Review required medical tests", icon: "📋" },
              { step: "Step 3", title: "Upload Report", desc: "Upload report or enter test values", icon: "📤" },
              { step: "Step 4", title: "AI Risk Prediction", desc: "ML microservice calculates score", icon: "⚡" },
              { step: "Step 5", title: "View Recommendations", desc: "Receive risk percentage & guidelines", icon: "✅" },
            ].map((item, idx) => (
              <div key={idx} className="med-card" style={{ padding: "24px", textAlign: "center", position: "relative" }}>
                <div style={{ fontSize: "2rem", marginBottom: "10px" }}>{item.icon}</div>
                <span style={{ fontSize: "0.75rem", color: "#1E88E5", fontWeight: 700 }}>{item.step}</span>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1E293B", marginTop: "4px" }}>{item.title}</h3>
                <p style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "4px" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Supported Disease Categories ─────────────────────────── */}
      <section id="diseases" style={{ padding: "90px 24px", background: "#FFFFFF" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <span style={{ fontSize: "0.8rem", color: "#2EBD85", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
              PREDICTIVE MODELS
            </span>
            <h2 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#1E293B", marginTop: "6px" }}>
              Supported Disease Categories
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
            {diseaseCategories.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedDisease(item.id)}
                className="med-card"
                style={{
                  padding: "24px",
                  cursor: "pointer",
                  borderLeft: selectedDisease === item.id ? "4px solid #1E88E5" : "1px solid #E2E8F0",
                  background: selectedDisease === item.id ? "#F4FAFF" : "#FFFFFF",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "10px" }}>{item.icon}</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1E293B" }}>{item.name}</h3>
                <p style={{ fontSize: "0.85rem", color: "#64748B", marginTop: "6px", lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 7: AI Prediction Preview ───────────────────────────────── */}
      <section style={{ padding: "90px 24px", background: "#F4FAFF" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span style={{ fontSize: "0.8rem", color: "#1E88E5", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
              SAMPLE OUTPUT PREVIEW
            </span>
            <h2 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#1E293B", marginTop: "6px" }}>
              AI Prediction Preview
            </h2>
          </div>

          <div className="med-card" style={{ maxWidth: "700px", margin: "0 auto", padding: "36px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9", paddingBottom: "16px", marginBottom: "24px" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>DIAGNOSTIC TARGET</span>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1E293B" }}>Diabetes Risk Assessment</h3>
              </div>
              <span style={{ fontSize: "0.85rem", background: "#FFEBEE", color: "#D32F2F", fontWeight: 700, padding: "6px 14px", borderRadius: "16px" }}>
                High Risk Level
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap", marginBottom: "28px" }}>
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  border: "8px solid #FFEBEE",
                  borderTopColor: "#D32F2F",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                }}
              >
                <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#D32F2F" }}>76%</span>
                <span style={{ fontSize: "0.65rem", color: "#64748B", fontWeight: 700 }}>PROBABILITY</span>
              </div>

              <div style={{ flex: 1, minWidth: "220px" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1E293B", marginBottom: "8px" }}>Key Influencing Factors</h4>
                <ul style={{ fontSize: "0.85rem", color: "#64748B", lineHeight: 1.8, paddingLeft: "18px" }}>
                  <li>Fasting Glucose: 138 mg/dL (Elevated)</li>
                  <li>Body Mass Index (BMI): 29.4 kg/m²</li>
                  <li>Age Risk Factor: 48 Years</li>
                </ul>
              </div>
            </div>

            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "16px", borderRadius: "12px" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E88E5", marginBottom: "4px" }}>💡 Recommendation Preview:</div>
              <p style={{ fontSize: "0.85rem", color: "#475569", lineHeight: 1.5 }}>
                Schedule a follow-up HbA1c screening and consult an endocrinologist. Implement a low-glycemic dietary regimen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 8: Medical Report Analysis (OCR) ────────────────────────── */}
      <section id="ocr-sec" style={{ padding: "90px 24px", background: "#FFFFFF" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <span style={{ fontSize: "0.8rem", color: "#1E88E5", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
              AUTOMATED DATA EXTRACTION
            </span>
            <h2 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#1E293B", marginTop: "6px" }}>
              Medical Report Analysis
            </h2>
          </div>

          <div className="med-card" style={{ maxWidth: "800px", margin: "0 auto", padding: "32px", position: "relative" }}>
            {isOcrScanning && <div className="ocr-scan-line" style={{ position: "absolute", left: 0, right: 0, height: "3px", background: "#1E88E5", boxShadow: "0 0 10px #1E88E5" }} />}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1E293B" }}>📄 Uploaded_Lab_Result.pdf</div>
              <span style={{ fontSize: "0.8rem", color: "#2EBD85", fontWeight: 700 }}>95% OCR Precision</span>
            </div>

            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "20px", borderRadius: "12px", fontFamily: "monospace", fontSize: "0.85rem", color: "#475569", lineHeight: 1.8 }}>
              <p style={{ color: ocrSuccess ? "#1E88E5" : "#475569", fontWeight: ocrSuccess ? 700 : 400 }}>Fasting Glucose: 138 mg/dL</p>
              <p style={{ color: ocrSuccess ? "#2EBD85" : "#475569", fontWeight: ocrSuccess ? 700 : 400 }}>Blood Pressure: 142 / 90 mmHg</p>
              <p style={{ color: ocrSuccess ? "#1E88E5" : "#475569", fontWeight: ocrSuccess ? 700 : 400 }}>Serum Creatinine: 1.1 mg/dL</p>
            </div>

            <button
              onClick={handleSimulateOcr}
              disabled={isOcrScanning}
              className="btn-primary-blue"
              style={{ width: "100%", marginTop: "24px", justifyContent: "center" }}
            >
              {isOcrScanning ? "⚡ Scanning Document via PyTesseract..." : ocrSuccess ? "✅ Extraction Complete! Scan Again" : "🔍 Simulate OCR Document Scan"}
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 9: Why Choose MediPredict AI ─────────────────────────────── */}
      <section style={{ padding: "90px 24px", background: "#F4FAFF" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <span style={{ fontSize: "0.8rem", color: "#2EBD85", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
              CLINICAL ADVANTAGES
            </span>
            <h2 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#1E293B", marginTop: "6px" }}>
              Why Choose MediPredict AI
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            {[
              { title: "AI-Powered Decision Support", desc: "Augments clinical workflow with machine learning inference." },
              { title: "Disease-Specific Assessments", desc: "Tailored biomarker parameters for 8 major health targets." },
              { title: "Accurate Report Analysis", desc: "PyTesseract OCR eliminates manual diagnostic entry errors." },
              { title: "Time-Saving Workflow", desc: "Instant risk scoring and report generation in seconds." },
              { title: "Personalized Recommendations", desc: "Actionable lifestyle and clinical follow-up advice." },
              { title: "Secure Medical Records", desc: "Encrypted PostgreSQL storage with JWT bearer authorization." },
              { title: "Easy Hospital Booking", desc: "Find nearby diagnostic centers and book consultations directly." },
            ].map((item, idx) => (
              <div key={idx} className="med-card" style={{ padding: "24px" }}>
                <div style={{ color: "#2EBD85", fontSize: "1.2rem", fontWeight: 800, marginBottom: "6px" }}>✓</div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1E293B" }}>{item.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "#64748B", marginTop: "4px" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 10: Call To Action ───────────────────────────────────────── */}
      <section
        style={{
          padding: "100px 24px",
          background: "linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)",
          color: "#FFFFFF",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(2.2rem, 4vw, 3.2rem)", fontWeight: 800, marginBottom: "16px" }}>
            Take the First Step Toward Smarter Healthcare
          </h2>
          <p style={{ fontSize: "1.1rem", opacity: 0.9, marginBottom: "36px", lineHeight: 1.6 }}>
            Experience AI-assisted disease risk assessment with an intuitive, secure, and modern healthcare platform.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/register"
              style={{
                background: "#FFFFFF",
                color: "#1E88E5",
                fontWeight: 700,
                padding: "16px 36px",
                borderRadius: "12px",
                textDecoration: "none",
                fontSize: "1rem",
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              }}
            >
              Start Assessment
            </Link>
            <Link
              href="/login"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#FFFFFF",
                fontWeight: 700,
                padding: "16px 36px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.4)",
                textDecoration: "none",
                fontSize: "1rem",
              }}
            >
              Sign In to Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section 11: Footer ──────────────────────────────────────────────── */}
      <footer
        style={{
          padding: "60px 24px 40px 24px",
          background: "#FFFFFF",
          borderTop: "1px solid #E2E8F0",
          color: "#64748B",
          fontSize: "0.85rem",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#1E88E5", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF" }}>
              🩺
            </div>
            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E293B" }}>
              MediPredict <span style={{ color: "#2EBD85" }}>AI</span>
            </span>
          </div>

          <div style={{ display: "flex", gap: "24px" }}>
            <a href="#about" style={{ color: "#475569", textDecoration: "none" }}>About</a>
            <a href="#features" style={{ color: "#475569", textDecoration: "none" }}>Features</a>
            <a href="#how-it-works" style={{ color: "#475569", textDecoration: "none" }}>How It Works</a>
            <a href="#diseases" style={{ color: "#475569", textDecoration: "none" }}>Diseases</a>
            <Link href="/login" style={{ color: "#1E88E5", textDecoration: "none", fontWeight: 700 }}>Sign In</Link>
          </div>

          <div>© {new Date().getFullYear()} MediPredict AI. All rights reserved. Medical Diagnostic Support System.</div>
        </div>
      </footer>
    </div>
  );
}
