"use client";

import React, { useEffect, useRef } from 'react';

interface RevealLayerProps {
  image: string;
}

const SPOTLIGHT_R = 260;

export default function RevealLayer({ image }: RevealLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const mouse = { x: -999, y: -999 };
    const smooth = { x: -999, y: -999 };
    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (smooth.x === -999) {
        smooth.x = e.clientX;
        smooth.y = e.clientY;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    const loop = () => {
      if (smooth.x !== -999 && canvasRef.current && divRef.current) {
        const dx = mouse.x - smooth.x;
        const dy = mouse.y - smooth.y;

        // Only draw if the position has changed
        if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
          smooth.x += dx * 0.1;
          smooth.y += dy * 0.1;

          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const gradient = ctx.createRadialGradient(smooth.x, smooth.y, 0, smooth.x, smooth.y, SPOTLIGHT_R);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.4, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.6, 'rgba(255,255,255,0.75)');
            gradient.addColorStop(0.75, 'rgba(255,255,255,0.4)');
            gradient.addColorStop(0.88, 'rgba(255,255,255,0.12)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(smooth.x, smooth.y, SPOTLIGHT_R, 0, Math.PI * 2);
            ctx.fill();

            const dataUrl = canvas.toDataURL();
            divRef.current.style.webkitMaskImage = `url(${dataUrl})`;
            divRef.current.style.maskImage = `url(${dataUrl})`;
          }
        }
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none" 
        style={{ display: 'none' }} 
      />
      <div 
        ref={divRef}
        className="absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none"
        style={{
          backgroundImage: `url('${image}')`,
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
        }}
      />
    </>
  );
}
