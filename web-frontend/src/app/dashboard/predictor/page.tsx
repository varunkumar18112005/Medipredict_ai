"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { getUser } from "../../../services/api";

interface DiseasePipeline {
  id: string;
  name: string;
  desc: string;
  requiredTestCount: number;
  estimatedTime: string;
  color: string;
  darkColor: string;
  icon: string;
  requiredTests: string[];
}

const DISEASE_PIPELINES: DiseasePipeline[] = [
  { 
    id: "DIABETES", 
    name: "Diabetes Risk Profiler", 
    desc: "Comprehensive evaluation of fasting blood glucose, HbA1c, blood pressure, insulin level, BMI, and patient age.",
    requiredTestCount: 6,
    estimatedTime: "2 Minutes",
    color: "#1E88E5", 
    darkColor: "#1565C0", 
    icon: "/images/diabetes.png",
    requiredTests: ["Blood Glucose (Fasting)", "HbA1c", "Blood Pressure", "Insulin Level", "BMI", "Age"]
  },
  { 
    id: "HEART_DISEASE", 
    name: "Cardiovascular Risk Telemetry", 
    desc: "Cardiac screening analyzing resting blood pressure, total serum cholesterol, fasting blood sugar, resting ECG, max heart rate, and chest pain type.",
    requiredTestCount: 6,
    estimatedTime: "3 Minutes",
    color: "#EF5350", 
    darkColor: "#C62828", 
    icon: "/images/heart.png",
    requiredTests: ["Resting Blood Pressure", "Total Serum Cholesterol", "Fasting Blood Sugar", "Resting ECG", "Maximum Heart Rate", "Chest Pain Type"]
  },
  { 
    id: "LIVER_DISEASE", 
    name: "Hepatic Function Diagnostics", 
    desc: "Hepatology panel evaluating total bilirubin, direct bilirubin, ALT (SGPT), AST (SGOT), alkaline phosphatase (ALP), and albumin.",
    requiredTestCount: 6,
    estimatedTime: "3 Minutes",
    color: "#F59E0B", 
    darkColor: "#B45309", 
    icon: "/images/liver.png",
    requiredTests: ["Total Bilirubin", "Direct Bilirubin", "ALT (SGPT)", "AST (SGOT)", "Alkaline Phosphatase (ALP)", "Albumin"]
  },
  { 
    id: "KIDNEY_DISEASE", 
    name: "Renal Function Clearance", 
    desc: "Nephrology assessment measuring serum creatinine, blood urea, estimated GFR (eGFR), urine albumin, hemoglobin, and blood pressure.",
    requiredTestCount: 6,
    estimatedTime: "2 Minutes",
    color: "#2EBD85", 
    darkColor: "#1E9E6D", 
    icon: "/images/kidney.png",
    requiredTests: ["Serum Creatinine", "Blood Urea", "Estimated GFR (eGFR)", "Urine Albumin", "Hemoglobin", "Blood Pressure"]
  },
  { 
    id: "THYROID_DISEASE", 
    name: "Thyroid Dysfunction Profiler", 
    desc: "Endocrine assessment checking TSH, Free T3 (FT3), Free T4 (FT4), and Anti-TPO Antibodies.",
    requiredTestCount: 4,
    estimatedTime: "2 Minutes",
    color: "#D946EF", 
    darkColor: "#A21CAF", 
    icon: "/images/thyroid.png",
    requiredTests: ["TSH", "Free T3 (FT3)", "Free T4 (FT4)", "Anti-TPO Antibodies"]
  },
  { 
    id: "PULMONARY_DISEASE", 
    name: "Pulmonary Risk Assessment", 
    desc: "Respiratory telemetry measuring oxygen saturation (SpO2), FEV1, FVC, FEV1/FVC ratio, respiratory rate, and smoking history.",
    requiredTestCount: 6,
    estimatedTime: "2 Minutes",
    color: "#06B6D4", 
    darkColor: "#0891B2", 
    icon: "/images/pulmonary.png",
    requiredTests: ["Oxygen Saturation (SpO2)", "FEV1", "FVC", "FEV1/FVC Ratio", "Respiratory Rate", "Smoking History"]
  },
  { 
    id: "STROKE", 
    name: "Stroke Risk Telemetry", 
    desc: "Vascular risk evaluation analyzing blood pressure, blood glucose, total cholesterol, BMI, age, and history of heart disease.",
    requiredTestCount: 6,
    estimatedTime: "2 Minutes",
    color: "#F43F5E", 
    darkColor: "#BE123C", 
    icon: "/images/stroke.png",
    requiredTests: ["Blood Pressure", "Blood Glucose", "Total Cholesterol", "BMI", "Age", "History of Heart Disease"]
  },
  { 
    id: "ANEMIA", 
    name: "Anemia Screening Profiler", 
    desc: "Hematology panel checking hemoglobin, Red Blood Cell (RBC) count, hematocrit (HCT), MCV, MCH, and serum ferritin.",
    requiredTestCount: 6,
    estimatedTime: "2 Minutes",
    color: "#84CC16", 
    darkColor: "#4D7C0F", 
    icon: "/images/anemia.png",
    requiredTests: ["Hemoglobin", "RBC Count", "Hematocrit (HCT)", "MCV", "MCH", "Serum Ferritin"]
  }
];

export default function PredictorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const activeUser = getUser();
    if (!activeUser) {
      router.push("/login");
      return;
    }
    setUser(activeUser);
  }, [router]);

  if (!user) return null;

  return (
    <div style={{ position: "relative", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header Description */}
      <div style={{ marginBottom: "35px" }}>
        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--primary)", fontWeight: 700, letterSpacing: "1px" }}>
          DIAGNOSTIC PIPELINES CENTER
        </span>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#263238", marginTop: "6px" }}>
          Specialized AI Risk Predictors
        </h1>
        <p style={{ color: "#64748B", fontSize: "0.95rem", maxWidth: "680px", marginTop: "4px" }}>
          Select an enterprise diagnostic model below. Every pipeline uses verified deep-learning models trained on clinical telemetry datasets.
        </p>
      </div>

      {/* Grid of 8 Disease Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        gap: "24px"
      }}>
        {DISEASE_PIPELINES.map((p) => (
          <div 
            key={p.id} 
            className="card-3d" 
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "20px",
              borderLeft: `5px solid ${p.color}`,
              padding: "26px",
              background: "#FFFFFF",
              position: "relative"
            }}
          >
            <div>
              {/* Header row with Icon and Time Badge */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: `2px solid ${p.color}40`,
                  boxShadow: `0 4px 14px ${p.color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background: `${p.color}08`
                }}>
                  <img 
                    src={p.icon} 
                    alt={p.name} 
                    style={{ 
                      width: "100%", 
                      height: "100%", 
                      objectFit: "cover" 
                    }} 
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: p.color,
                    background: `${p.color}12`,
                    padding: "4px 10px",
                    borderRadius: "20px",
                    border: `1px solid ${p.color}30`
                  }}>
                    ⏱️ ~{p.estimatedTime}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 600 }}>
                    {p.requiredTestCount} Required Tests
                  </span>
                </div>
              </div>

              {/* Title and Description */}
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#263238", marginBottom: "8px" }}>
                {p.name}
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#64748B", lineHeight: 1.5, marginBottom: "16px" }}>
                {p.desc}
              </p>

              {/* Required Test Checklist Tags */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {p.requiredTests.map((t, idx) => (
                  <span 
                    key={idx} 
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: "#475569",
                      background: "#F1F5F9",
                      border: "1px solid #E2E8F0",
                      borderRadius: "6px",
                      padding: "3px 8px"
                    }}
                  >
                    ✓ {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Launch Action Button */}
            <div style={{ paddingTop: "14px", borderTop: "1px solid #F1F5F9" }}>
              <Link 
                href={`/dashboard/assessment?type=${p.id}`} 
                className="btn-3d" 
                style={{
                  width: "100%",
                  background: `linear-gradient(135deg, ${p.color} 0%, ${p.darkColor} 100%)`,
                  padding: "12px 20px",
                  fontSize: "0.9rem",
                  boxShadow: `0 6px 18px ${p.color}35`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                Launch Assessment ➔
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
