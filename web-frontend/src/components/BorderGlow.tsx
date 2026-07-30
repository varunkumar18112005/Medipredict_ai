"use client";

import React, { useRef, useState, useEffect } from "react";

interface BorderGlowProps {
  children: React.ReactNode;
  edgeSensitivity?: number;
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  animated?: boolean;
  colors?: string[];
  className?: string;
}

export default function BorderGlow({
  children,
  edgeSensitivity = 30,
  glowColor = "255 255 255",
  backgroundColor = "transparent",
  borderRadius = 12,
  glowRadius = 150,
  glowIntensity = 1,
  coneSpread = 25,
  animated = false,
  colors = ["#c084fc", "#f472b6", "#38bdf8"],
  className = "",
}: BorderGlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <div
      ref={containerRef}
      className={`relative group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        borderRadius: `${borderRadius}px`,
        background: backgroundColor,
      }}
    >
      {/* Border Glow Effect - Masked to just the border */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-20"
        style={{
          borderRadius: `${borderRadius}px`,
          opacity: isHovered ? glowIntensity : 0,
          background: `radial-gradient(${glowRadius}px circle at ${mousePosition.x}px ${mousePosition.y}px, ${glowColor.includes(' ') && !glowColor.includes(',') ? `rgb(${glowColor.replace(/\\s+/g, ', ')})` : glowColor}, transparent 40%)`,
          padding: '2px', // The thickness of the glowing border
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      
      {/* Dynamic Animated Colors (if true) */}
      {animated && isHovered && (
        <div 
          className="absolute inset-0 z-0 opacity-50 mix-blend-screen"
          style={{
            borderRadius: `${borderRadius}px`,
            background: `conic-gradient(from 90deg at ${mousePosition.x}px ${mousePosition.y}px, ${colors.join(', ')})`,
            filter: 'blur(10px)',
          }}
        />
      )}

      {/* Mask Content Layer */}
      <div 
        className="relative z-10 w-full h-full"
        style={{ borderRadius: `${borderRadius}px` }}
      >
        {children}
      </div>
    </div>
  );
}
