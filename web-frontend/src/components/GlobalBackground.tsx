"use client";

import React, { useEffect, useState } from "react";

export default function GlobalBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
        overflow: "hidden",
        background: "#FFFFFF"
      }}
    >
      {/* 1. Base Layer: Multi-color Radial Gradient Mesh */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse at 15% 15%, rgba(56, 189, 248, 0.18) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 20%, rgba(46, 189, 133, 0.14) 0%, transparent 55%),
            radial-gradient(ellipse at 75% 80%, rgba(30, 136, 229, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse at 20% 85%, rgba(192, 132, 252, 0.12) 0%, transparent 55%),
            linear-gradient(180deg, #FFFFFF 0%, #F4FAFF 50%, #EBF5FF 100%)
          `
        }}
      />

      {/* 2. Interactive Cursor Radial Lighting Glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(56, 189, 248, 0.15) 0%, transparent 80%)`,
          transition: "background 0.15s ease-out"
        }}
      />

      {/* 3. Floating Mesh Blobs (Animated Color Orbs) */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "25%",
          width: "450px",
          height: "450px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(30, 136, 229, 0.16) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "floatBlob1 22s ease-in-out infinite alternate"
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "5%",
          right: "15%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(46, 189, 133, 0.14) 0%, transparent 70%)",
          filter: "blur(70px)",
          animation: "floatBlob2 26s ease-in-out infinite alternate"
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "45%",
          left: "5%",
          width: "380px",
          height: "380px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79, 195, 247, 0.15) 0%, transparent 70%)",
          filter: "blur(50px)",
          animation: "floatBlob3 18s ease-in-out infinite alternate"
        }}
      />

      {/* 4. Medical Pattern Overlay (DNA Helixes, Hex Grid & ECG Waves at 6% Opacity) */}
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, opacity: 0.07 }}
      >
        <defs>
          {/* Hexagonal Medical Grid */}
          <pattern id="hex-grid" width="40" height="69.282" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 20 11.547 L 0 0 L 0 23.094 L 20 34.641 L 40 23.094 Z M 0 34.641 L 20 46.188 L 0 57.735 L 0 80.829 L 20 92.376 L 40 80.829 L 40 57.735 Z" fill="none" stroke="#1E88E5" strokeWidth="1" />
          </pattern>
          {/* Medical Cross Pattern */}
          <pattern id="med-cross" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 27 20 H 33 V 27 H 40 V 33 H 33 V 40 H 27 V 33 H 20 V 27 H 27 Z" fill="#2EBD85" opacity="0.4" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#hex-grid)" />
        <rect width="100%" height="100%" fill="url(#med-cross)" />

        {/* ECG Heartbeat Wave Curve Across Top Section */}
        <path
          d="M 0 160 Q 150 160 250 160 T 300 120 L 310 210 L 325 90 L 340 180 L 355 150 L 370 160 Q 550 160 800 160 T 1100 160 L 1115 110 L 1130 220 L 1145 80 L 1160 190 L 1175 160 H 2000"
          fill="none"
          stroke="#1E88E5"
          strokeWidth="2.5"
          opacity="0.35"
        />

        {/* DNA Double Helix Outline Curve */}
        <path
          d="M -50 300 Q 200 450 450 300 T 950 300 T 1450 300 T 1950 300"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="3"
          strokeDasharray="6 8"
          opacity="0.4"
        />
        <path
          d="M -50 450 Q 200 300 450 450 T 950 450 T 1450 450 T 1950 450"
          fill="none"
          stroke="#2EBD85"
          strokeWidth="3"
          strokeDasharray="6 8"
          opacity="0.4"
        />
      </svg>

      {/* 5. Floating Glassmorphism Orbs & Translucent Rings */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          right: "8%",
          width: "140px",
          height: "140px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.8)",
          boxShadow: "0 10px 30px rgba(30, 136, 229, 0.08)",
          animation: "floatGlass 14s ease-in-out infinite alternate"
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          left: "6%",
          width: "180px",
          height: "180px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.35)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.85)",
          boxShadow: "0 14px 36px rgba(46, 189, 133, 0.08)",
          animation: "floatGlass 18s ease-in-out infinite alternate-reverse"
        }}
      />

      {/* Keyframe Animation Styles */}
      <style jsx global>{`
        @keyframes floatBlob1 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(60px, 40px) scale(1.1); }
          100% { transform: translate(-40px, 80px) scale(0.95); }
        }
        @keyframes floatBlob2 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-70px, -50px) scale(1.15); }
          100% { transform: translate(50px, -30px) scale(0.9); }
        }
        @keyframes floatBlob3 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(40px, -60px) scale(1.08); }
          100% { transform: translate(-30px, 40px) scale(0.92); }
        }
        @keyframes floatGlass {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(10deg); }
          100% { transform: translateY(15px) rotate(-8deg); }
        }
      `}</style>
    </div>
  );
}
