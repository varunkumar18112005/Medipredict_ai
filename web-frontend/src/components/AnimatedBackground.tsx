"use client";

import React, { useEffect, useState } from 'react';

export default function AnimatedBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="anim-bg-container">
      {/* Dynamic mouse glow mimicking animmasterlib */}
      <div 
        className="anim-bg-mouse-glow"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(0, 212, 255, 0.12) 0%, transparent 60%)`
        }}
      />
      
      {/* Abstract Animated Glow Orbs */}
      <div className="anim-bg-shape anim-bg-shape-1" />
      <div className="anim-bg-shape anim-bg-shape-2" />
      
      {/* Website Name Integrated into Background */}
      <div className="anim-bg-text-wrapper">
        <h1 className="anim-bg-title">MediPredict AI</h1>
      </div>
      
      {/* Glassmorphism Blur Overlay */}
      <div className="anim-bg-overlay" />
    </div>
  );
}
