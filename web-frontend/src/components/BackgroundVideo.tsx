"use client";

import React, { useRef, useState, useEffect } from 'react';

interface BackgroundVideoProps {
  src: string;
}

export default function BackgroundVideo({ src }: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState(0.5);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const { currentTime, duration } = videoRef.current;
      // If we are within the last 1.5 seconds of the video, fade out
      if (duration > 0 && duration - currentTime < 1.5) {
        setOpacity(0);
      } else if (currentTime < 1.5) {
        // If we are within the first 1.5 seconds, fade in to 0.5
        setOpacity(0.5 * (currentTime / 1.5));
      } else {
        setOpacity(0.5);
      }
    }
  };

  return (
    <video 
      ref={videoRef}
      autoPlay 
      loop 
      muted 
      playsInline
      onTimeUpdate={handleTimeUpdate}
      className="fixed inset-0 w-full h-full object-cover z-[-10] pointer-events-none"
      style={{ 
        opacity: opacity, 
        transition: 'opacity 0.2s ease-out' 
      }}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
