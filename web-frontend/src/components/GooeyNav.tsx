"use client";

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface GooeyNavItem {
  label: string;
  href: string;
  icon?: string;
}

export interface GooeyNavProps {
  items: GooeyNavItem[];
  initialActiveIndex?: number;
  [key: string]: any;
}

const GooeyNav: React.FC<GooeyNavProps> = ({
  items,
  initialActiveIndex = 0
}) => {
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState(initialActiveIndex);
  const [pillStyle, setPillStyle] = useState<{ x: number; width: number; height: number; opacity: number }>({
    x: 0,
    width: 0,
    height: 0,
    opacity: 0
  });

  const navContainerRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  // Update active index based on route match
  useEffect(() => {
    if (!pathname) return;
    const foundIndex = items.findIndex(item => {
      if (item.href === "/dashboard") {
        return pathname === "/dashboard";
      }
      return pathname.startsWith(item.href);
    });
    if (foundIndex !== -1) {
      setActiveIndex(foundIndex);
    }
  }, [pathname, items]);

  // Recalculate sliding pill position with zero-layout-thrashing GPU coordinates
  const updatePillPosition = useCallback(() => {
    const activeItem = itemRefs.current[activeIndex];
    if (activeItem) {
      setPillStyle({
        x: activeItem.offsetLeft,
        width: activeItem.offsetWidth,
        height: activeItem.offsetHeight,
        opacity: 1
      });
    }
  }, [activeIndex]);

  useLayoutEffect(() => {
    updatePillPosition();
  }, [activeIndex, updatePillPosition]);

  useEffect(() => {
    const handleResize = () => updatePillPosition();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [updatePillPosition]);

  const handleItemClick = (index: number) => {
    // Instant synchronous UI feedback on click before page transition
    setActiveIndex(index);
  };

  return (
    <nav style={{ display: 'flex', alignItems: 'center' }}>
      <ul
        ref={navContainerRef}
        style={{
          position: 'relative',
          display: 'flex',
          gap: '4px',
          listStyle: 'none',
          padding: '4px',
          margin: 0,
          background: 'rgba(241, 245, 249, 0.9)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '24px',
          border: '1px solid #CBD5E1',
          boxShadow: '0 4px 14px rgba(30, 136, 229, 0.05), inset 0 1px 2px rgba(255, 255, 255, 0.8)'
        }}
      >
        {/* GPU Hardware-Accelerated Sliding Pill Background */}
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: 0,
            width: `${pillStyle.width}px`,
            height: `${pillStyle.height}px`,
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)',
            boxShadow: '0 4px 16px rgba(30, 136, 229, 0.38)',
            opacity: pillStyle.opacity,
            transform: `translate3d(${pillStyle.x}px, 0, 0)`,
            transition: pillStyle.opacity === 0
              ? 'none'
              : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), width 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform, width',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        {items.map((item, index) => {
          const isActive = activeIndex === index;
          return (
            <li
              key={index}
              ref={el => { itemRefs.current[index] = el; }}
              style={{ position: 'relative', margin: 0, zIndex: 2 }}
            >
              <Link
                href={item.href}
                onClick={() => handleItemClick(index)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#FFFFFF' : '#475569',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                {item.icon && <span style={{ fontSize: "0.9rem", lineHeight: 1 }}>{item.icon}</span>}
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default GooeyNav;
