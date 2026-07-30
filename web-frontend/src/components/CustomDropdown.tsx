"use client";

import React, { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  label,
  placeholder = "Select Option",
  disabled = false,
  style
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div 
      ref={dropdownRef} 
      style={{ 
        position: "relative", 
        width: "100%",
        fontFamily: "'Inter', 'Manrope', sans-serif",
        zIndex: isOpen ? 9999 : 1,
        ...style 
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dropDownShow {
          from { 
            opacity: 0; 
            transform: translateY(-6px) scaleY(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scaleY(1); 
          }
        }
        .dropdown-item {
          padding: 10px 16px;
          color: #475569;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-left: 3px solid transparent;
        }
        .dropdown-item:hover {
          background: #F1F5F9;
          color: #1E88E5;
          border-left: 3px solid #1E88E5;
          padding-left: 20px;
        }
        .dropdown-item-selected {
          background: #E3F2FD !important;
          color: #1E88E5 !important;
          border-left: 3px solid #1E88E5 !important;
          font-weight: 700;
        }
      `}} />

      {label && (
        <label style={{ 
          display: "block", 
          color: "#64748B", 
          fontSize: "0.75rem", 
          fontWeight: 600, 
          textTransform: "uppercase", 
          marginBottom: "8px" 
        }}>
          {label}
        </label>
      )}
      
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: "100%",
          background: disabled ? "#F8FAFC" : "#FFFFFF",
          border: isOpen ? "1px solid #1E88E5" : "1px solid #CBD5E1",
          borderRadius: "12px",
          padding: "12px 16px",
          color: disabled ? "#94A3B8" : "#1E293B",
          fontSize: "0.95rem",
          fontWeight: 600,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.7 : 1,
          outline: "none",
          transition: "all 0.2s ease",
          boxShadow: isOpen 
            ? "0 0 0 3px rgba(30, 136, 229, 0.15)" 
            : "0 1px 3px rgba(0, 0, 0, 0.04)",
        }}
      >
        <span style={{ color: selectedOption ? "#1E293B" : "#94A3B8" }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s ease",
            stroke: isOpen ? "#1E88E5" : "#64748B",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }}
        >
          <path d="M1 1L6 6L11 1" />
        </svg>
      </button>

      {/* Dropdown Options Panel */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            width: "100%",
            background: "#FFFFFF",
            border: "1px solid #CBD5E1",
            borderRadius: "12px",
            boxShadow: "0 14px 36px rgba(0, 0, 0, 0.2)",
            zIndex: 10000,
            overflow: "hidden",
            maxHeight: "240px",
            overflowY: "auto",
            animation: "dropDownShow 0.2s ease",
            transformOrigin: "top"
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                className={`dropdown-item ${isSelected ? "dropdown-item-selected" : ""}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <span style={{ color: "#1E88E5", fontSize: "0.85rem", fontWeight: 800 }}>✓</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
