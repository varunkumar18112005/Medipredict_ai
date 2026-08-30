"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useCallback } from "react";
import api, { getUser } from "../../../services/api";

interface AssessmentHistory {
  id: number;
  diseaseType: string;
  riskScore: number;
  riskLevel: string;
  createdAt: string;
}

interface DiseasePipeline {
  id: string;
  name: string;
  category: "Metabolic" | "Cardiac" | "Hepatic" | "Renal" | "Endocrine" | "Respiratory";
  desc: string;
  modelName: string;
  requiredTestCount: number;
  estimatedTime: string;
  color: string;
  icon: string;
  categorizedInputs: {
    lab: string[];
    vitals: string[];
    patient: string[];
  };
  purpose: string;
}

const DISEASE_PIPELINES: DiseasePipeline[] = [
  { 
    id: "DIABETES", 
    name: "Diabetes Risk Profiler", 
    category: "Metabolic",
    desc: "Comprehensive evaluation of fasting blood glucose, HbA1c, blood pressure, insulin level, BMI, and patient age.",
    modelName: "Random Forest Classifier",
    requiredTestCount: 6,
    estimatedTime: "2 Minutes",
    color: "#1E88E5", 
    icon: "/images/diabetes.png",
    categorizedInputs: {
      lab: ["Blood Glucose (Fasting)", "HbA1c", "Insulin Level"],
      vitals: ["Blood Pressure", "BMI"],
      patient: ["Age"]
    },
    purpose: "Detects early-stage glycemic dysregulation and metabolic risk probability using trained ensemble decision trees."
  },
  { 
    id: "HEART_DISEASE", 
    name: "Cardiovascular Risk Telemetry", 
    category: "Cardiac",
    desc: "Cardiac screening analyzing resting blood pressure, total serum cholesterol, fasting blood sugar, resting ECG, max heart rate, and chest pain type.",
    modelName: "XGBoost Gradient Boosting",
    requiredTestCount: 6,
    estimatedTime: "3 Minutes",
    color: "#EF5350", 
    icon: "/images/heart.png",
    categorizedInputs: {
      lab: ["Total Serum Cholesterol", "Fasting Blood Sugar"],
      vitals: ["Resting Blood Pressure", "Maximum Heart Rate", "Resting ECG"],
      patient: ["Chest Pain Type"]
    },
    purpose: "Evaluates coronary artery disease indicators and cardiac event probabilities based on clinical vitals."
  },
  { 
    id: "LIVER_DISEASE", 
    name: "Hepatic Function Diagnostics", 
    category: "Hepatic",
    desc: "Hepatology panel evaluating total bilirubin, direct bilirubin, ALT (SGPT), AST (SGOT), alkaline phosphatase (ALP), and albumin.",
    modelName: "Random Forest Classifier",
    requiredTestCount: 6,
    estimatedTime: "3 Minutes",
    color: "#F59E0B", 
    icon: "/images/liver.png",
    categorizedInputs: {
      lab: ["Total Bilirubin", "Direct Bilirubin", "ALT (SGPT)", "AST (SGOT)", "Alkaline Phosphatase (ALP)", "Albumin"],
      vitals: [],
      patient: []
    },
    purpose: "Screens for hepatic enzyme elevation, biliary clearance anomalies, and chronic liver function trends."
  },
  { 
    id: "KIDNEY_DISEASE", 
    name: "Renal Function Clearance", 
    category: "Renal",
    desc: "Nephrology assessment measuring serum creatinine, blood urea, estimated GFR (eGFR), urine albumin, hemoglobin, and blood pressure.",
    modelName: "Gradient Boosting Machine",
    requiredTestCount: 6,
    estimatedTime: "2 Minutes",
    color: "#2EBD85", 
    icon: "/images/kidney.png",
    categorizedInputs: {
      lab: ["Serum Creatinine", "Blood Urea", "Estimated GFR (eGFR)", "Urine Albumin", "Hemoglobin"],
      vitals: ["Blood Pressure"],
      patient: []
    },
    purpose: "Calculates glomerular filtration performance and checks for chronic kidney disease progression indicators."
  },
  { 
    id: "THYROID_DISEASE", 
    name: "Thyroid Dysfunction Profiler", 
    category: "Endocrine",
    desc: "Endocrine assessment checking TSH, Free T3 (FT3), Free T4 (FT4), and Anti-TPO Antibodies.",
    modelName: "Support Vector Machine (SVM)",
    requiredTestCount: 4,
    estimatedTime: "2 Minutes",
    color: "#D946EF", 
    icon: "/images/thyroid.png",
    categorizedInputs: {
      lab: ["TSH", "Free T3 (FT3)", "Free T4 (FT4)", "Anti-TPO Antibodies"],
      vitals: [],
      patient: []
    },
    purpose: "Identifies autoimmune thyroiditis, hypothyroidism, and hyperthyroidism markers via hormonal panel ratios."
  },
  { 
    id: "PULMONARY_DISEASE", 
    name: "Pulmonary Risk Assessment", 
    category: "Respiratory",
    desc: "Respiratory telemetry measuring oxygen saturation (SpO2), FEV1, FVC, FEV1/FVC ratio, respiratory rate, and smoking history.",
    modelName: "Random Forest Classifier",
    requiredTestCount: 6,
    estimatedTime: "2 Minutes",
    color: "#06B6D4", 
    icon: "/images/pulmonary.png",
    categorizedInputs: {
      lab: ["Oxygen Saturation (SpO2)", "FEV1", "FVC", "FEV1/FVC Ratio"],
      vitals: ["Respiratory Rate"],
      patient: ["Smoking History"]
    },
    purpose: "Evaluates spirometry capacity and lung ventilation risk for early COPD and obstructive airway screening."
  },
  { 
    id: "STROKE", 
    name: "Stroke Risk Telemetry", 
    category: "Cardiac",
    desc: "Vascular risk evaluation analyzing blood pressure, blood glucose, total cholesterol, BMI, age, and history of heart disease.",
    modelName: "Logistic Regression Ensemble",
    requiredTestCount: 6,
    estimatedTime: "2 Minutes",
    color: "#F43F5E", 
    icon: "/images/stroke.png",
    categorizedInputs: {
      lab: ["Blood Glucose", "Total Cholesterol"],
      vitals: ["Blood Pressure", "BMI"],
      patient: ["Age", "History of Heart Disease"]
    },
    purpose: "Quantifies cerebrovascular stroke likelihood using multi-factorial blood pressure and vascular indicators."
  },
  { 
    id: "ANEMIA", 
    name: "Anemia Screening Profiler", 
    category: "Metabolic",
    desc: "Hematology panel checking hemoglobin, Red Blood Cell (RBC) count, hematocrit (HCT), MCV, MCH, and serum ferritin.",
    modelName: "Random Forest Classifier",
    requiredTestCount: 6,
    estimatedTime: "2 Minutes",
    color: "#84CC16", 
    icon: "/images/anemia.png",
    categorizedInputs: {
      lab: ["Hemoglobin", "RBC Count", "Hematocrit (HCT)", "MCV", "MCH", "Serum Ferritin"],
      vitals: [],
      patient: []
    },
    purpose: "Screens for iron-deficiency, microcytic, and megaloblastic anemia patterns across complete blood count metrics."
  }
];

export default function PredictorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<AssessmentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("All");

  // View Details Modal State
  const [selectedDetailPipeline, setSelectedDetailPipeline] = useState<DiseasePipeline | null>(null);

  // Helper to parse dates
  const parseUtcDate = (dateInput: any): Date => {
    if (!dateInput) return new Date();
    if (dateInput instanceof Date) return dateInput;
    let dateStr = String(dateInput);
    if (!dateStr.endsWith("Z") && !dateStr.includes("+") && dateStr.includes("T")) {
      dateStr += "Z";
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Just now";
    const d = parseUtcDate(dateStr);
    if (d.getFullYear() === 1970) return "Just now";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const fetchUserHistory = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;
    try {
      const res = await api.get("/assessments?size=100");
      const content = res.data?.content || res.data || [];
      const sorted = [...content].sort((a, b) => parseUtcDate(b.createdAt).getTime() - parseUtcDate(a.createdAt).getTime());
      setHistory(sorted);
    } catch (err) {
      console.error("Failed to load user assessment history:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const activeUser = getUser();
    if (!activeUser) {
      router.push("/login");
      return;
    }
    setUser(activeUser);
    fetchUserHistory();
  }, [router, fetchUserHistory]);

  // Find previous assessment for a disease
  const getPreviousAssessment = (diseaseId: string) => {
    return history.find(h => h.diseaseType && h.diseaseType.toUpperCase() === diseaseId.toUpperCase()) || null;
  };

  // Find recommended assessment (latest run assessment or default to Diabetes)
  const getRecommendedAssessment = () => {
    if (history.length > 0) {
      const latestHistory = history[0];
      const matchingPipeline = DISEASE_PIPELINES.find(p => p.id.toUpperCase() === latestHistory.diseaseType.toUpperCase());
      if (matchingPipeline) {
        return { pipeline: matchingPipeline, history: latestHistory };
      }
    }
    return { pipeline: DISEASE_PIPELINES[0], history: null };
  };

  const recommended = getRecommendedAssessment();

  // Filter pipelines based on search & category filter
  const filteredPipelines = DISEASE_PIPELINES.filter(p => {
    const matchesCategory = activeCategoryFilter === "All" || p.category.toLowerCase() === activeCategoryFilter.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      p.name.toLowerCase().includes(query) || 
      p.desc.toLowerCase().includes(query) ||
      p.categorizedInputs.lab.some(i => i.toLowerCase().includes(query)) ||
      p.categorizedInputs.vitals.some(i => i.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  const getRiskSeverityColor = (score: number) => {
    if (score < 30) return { bg: "#E8F5E9", text: "#2EBD85", border: "#A5D6A7", label: "LOW RISK" };
    if (score < 60) return { bg: "#FFF8E1", text: "#F59E0B", border: "#FFE082", label: "MODERATE RISK" };
    if (score < 80) return { bg: "#FFF3E0", text: "#F97316", border: "#FFCC80", label: "HIGH RISK" };
    return { bg: "#FFEBEE", text: "#EF4444", border: "#FFCDD2", label: "CRITICAL RISK" };
  };

  if (!user) return null;

  return (
    <div style={{ position: "relative", maxWidth: "1240px", margin: "0 auto", paddingBottom: "60px" }}>
      
      {/* ── 1. Professional Page Header ────────────────────────────────────── */}
      <section style={{ marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#1E88E5", fontWeight: 800, letterSpacing: "1px" }}>
              DIAGNOSTIC ENGINE
            </span>
            <h1 style={{ fontSize: "2.1rem", fontWeight: 800, color: "#1E293B", marginTop: "4px" }}>
              AI Disease Risk Predictor
            </h1>
            <p style={{ color: "#64748B", fontSize: "0.95rem", maxWidth: "620px", marginTop: "4px", lineHeight: 1.5 }}>
              Select a health assessment to evaluate your disease risk using MediPredict AI.
            </p>

            {/* Status Information Chips */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1E88E5", background: "#E3F2FD", border: "1px solid #90CAF9", padding: "4px 10px", borderRadius: "12px" }}>
                ✓ {DISEASE_PIPELINES.length} Assessments Available
              </span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2EBD85", background: "#E8F5E9", border: "1px solid #A5D6A7", padding: "4px 10px", borderRadius: "12px" }}>
                🤖 AI Models Ready
              </span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8B5CF6", background: "#FAF5FF", border: "1px solid #E9D5FF", padding: "4px 10px", borderRadius: "12px" }}>
                🔒 Secure & Private
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ minWidth: "300px", flex: 1, maxWidth: "380px" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "1rem", color: "#94A3B8" }}>
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search health assessments..."
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 42px",
                  borderRadius: "14px",
                  border: "1px solid #CBD5E1",
                  fontSize: "0.88rem",
                  color: "#1E293B",
                  background: "#FFFFFF",
                  outline: "none",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", color: "#94A3B8", cursor: "pointer", fontSize: "0.9rem" }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Category Chips */}
        <div style={{ display: "flex", gap: "8px", marginTop: "20px", flexWrap: "wrap" }}>
          {(["All", "Metabolic", "Cardiac", "Hepatic", "Renal", "Endocrine", "Respiratory"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategoryFilter(cat)}
              style={{
                padding: "6px 14px",
                borderRadius: "10px",
                border: activeCategoryFilter === cat ? "1px solid #1E88E5" : "1px solid #E2E8F0",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                background: activeCategoryFilter === cat ? "#1E88E5" : "#FFFFFF",
                color: activeCategoryFilter === cat ? "#FFFFFF" : "#64748B",
                transition: "all 0.2s ease"
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── 2. Recommended Assessment Section ─────────────────────────────── */}
      <section style={{ marginBottom: "28px" }}>
        <div className="db-card" style={{ background: "#FFFFFF", padding: "24px 28px", borderRadius: "20px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontSize: "1.1rem" }}>⭐</span>
              <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1E88E5", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                RECOMMENDED FOR YOU
              </span>
            </div>

            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1E293B", margin: 0 }}>
              {recommended.pipeline.name}
            </h3>

            <p style={{ fontSize: "0.85rem", color: "#64748B", marginTop: "4px", margin: 0 }}>
              {recommended.history
                ? "Recommended based on your previous health assessment activity."
                : "Start your first AI health assessment to build your risk profile."}
            </p>

            {/* Previous Score Badges if available */}
            {recommended.history && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#1E293B", background: "#F1F5F9", padding: "4px 10px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                  Previous Risk: {Number(recommended.history.riskScore).toFixed(1)}%
                </span>
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: getRiskSeverityColor(recommended.history.riskScore).text, background: getRiskSeverityColor(recommended.history.riskScore).bg, padding: "4px 10px", borderRadius: "8px", border: `1px solid ${getRiskSeverityColor(recommended.history.riskScore).border}` }}>
                  {recommended.history.riskLevel}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                  Last assessed: {formatDate(recommended.history.createdAt)}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            {recommended.history && (
              <Link href="/dashboard/history" style={{ textDecoration: "none", background: "#F1F5F9", color: "#334155", border: "1px solid #CBD5E1", padding: "10px 18px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 700 }}>
                View Results
              </Link>
            )}
            <Link
              href={`/dashboard/assessment?type=${recommended.pipeline.id}`}
              className="btn-primary-blue"
              style={{ textDecoration: "none", padding: "10px 20px", fontSize: "0.85rem" }}
            >
              {recommended.history ? "Run Again →" : "Launch Assessment →"}
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. AI Workflow Explanation Bar ─────────────────────────────────── */}
      <section style={{ marginBottom: "28px" }}>
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1E293B" }}>
              🧪 Enter Health Data <span style={{ color: "#CBD5E1", margin: "0 8px" }}>➔</span> 🤖 AI Analysis <span style={{ color: "#CBD5E1", margin: "0 8px" }}>➔</span> 📊 Risk Score <span style={{ color: "#CBD5E1", margin: "0 8px" }}>➔</span> 💡 Recommendations
            </div>
            <p style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "2px", margin: 0 }}>
              MediPredict AI analyzes your clinical vitals and generates an estimated disease-risk profile.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. Main 3-Column Assessment Grid ───────────────────────────────── */}
      {filteredPipelines.length === 0 ? (
        <div className="db-card" style={{ background: "#FFFFFF", padding: "40px", borderRadius: "20px", border: "1px solid #E2E8F0", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>🔍</div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1E293B", margin: 0 }}>No assessments found</h3>
          <p style={{ fontSize: "0.85rem", color: "#64748B", marginTop: "4px" }}>
            Try changing your search query or selecting a different category filter above.
          </p>
          <button
            onClick={() => { setSearchQuery(""); setActiveCategoryFilter("All"); }}
            style={{ marginTop: "12px", background: "#E3F2FD", border: "1px solid #90CAF9", color: "#1E88E5", padding: "8px 16px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "0.82rem" }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "24px"
        }}>
          {filteredPipelines.map((p) => {
            const prevRun = getPreviousAssessment(p.id);

            return (
              <div 
                key={p.id} 
                className="db-card card-3d" 
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  background: "#FFFFFF",
                  borderRadius: "20px",
                  border: "1px solid #E2E8F0",
                  borderLeft: `5px solid ${p.color}`,
                  padding: "26px",
                  position: "relative",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease"
                }}
              >
                <div>
                  {/* Top Bar: Icon on Left, Time & Required Inputs on Right */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div style={{
                      width: "54px",
                      height: "54px",
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
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                      <span style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: p.color,
                        background: `${p.color}10`,
                        padding: "4px 10px",
                        borderRadius: "12px",
                        border: `1px solid ${p.color}30`
                      }}>
                        ⏱️ ~{p.estimatedTime}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>
                        {p.requiredTestCount} Required Inputs
                      </span>
                    </div>
                  </div>

                  {/* Title & Category Badge */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1E293B", margin: 0 }}>
                      {p.name}
                    </h3>
                  </div>

                  {/* AI Model Badge */}
                  <div style={{ marginBottom: "10px" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8B5CF6", background: "#FAF5FF", border: "1px solid #E9D5FF", padding: "3px 8px", borderRadius: "8px" }}>
                      🤖 {p.modelName}
                    </span>
                  </div>

                  {/* Concise Description */}
                  <p style={{ fontSize: "0.85rem", color: "#64748B", lineHeight: 1.5, marginBottom: "16px" }}>
                    {p.desc}
                  </p>

                  {/* Categorized Required Inputs */}
                  <div style={{ marginBottom: "18px" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#475569", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Required Inputs
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {p.categorizedInputs.lab.map((t, idx) => (
                        <span key={`lab_${idx}`} style={{ fontSize: "0.7rem", fontWeight: 600, color: "#1E88E5", background: "#E3F2FD", border: "1px solid #90CAF9", borderRadius: "6px", padding: "3px 8px" }}>
                          ✓ {t}
                        </span>
                      ))}
                      {p.categorizedInputs.vitals.map((t, idx) => (
                        <span key={`vital_${idx}`} style={{ fontSize: "0.7rem", fontWeight: 600, color: "#2EBD85", background: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: "6px", padding: "3px 8px" }}>
                          ✓ {t}
                        </span>
                      ))}
                      {p.categorizedInputs.patient.map((t, idx) => (
                        <span key={`pat_${idx}`} style={{ fontSize: "0.7rem", fontWeight: 600, color: "#475569", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "3px 8px" }}>
                          ✓ {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Assessment History Status */}
                  <div style={{ background: "#F8FAFC", border: "1px solid #F1F5F9", padding: "12px 14px", borderRadius: "12px", marginBottom: "18px" }}>
                    {prevRun ? (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#2EBD85" }}>🟢 Previously Assessed</span>
                          <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "2px" }}>Assessed: {formatDate(prevRun.createdAt)}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "0.95rem", fontWeight: 900, color: p.color }}>{Number(prevRun.riskScore).toFixed(1)}%</span>
                          <div style={{ fontSize: "0.7rem", color: getRiskSeverityColor(prevRun.riskScore).text, fontWeight: 800 }}>{prevRun.riskLevel}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "#64748B" }}>
                        <span>⚪</span> <span>Not assessed yet</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons (Unified Primary Blue) */}
                <div style={{ paddingTop: "14px", borderTop: "1px solid #F1F5F9", display: "flex", gap: "10px", alignItems: "center" }}>
                  <button
                    onClick={() => setSelectedDetailPipeline(p)}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: "12px",
                      border: "1px solid #CBD5E1",
                      background: "#FFFFFF",
                      color: "#334155",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    View Details
                  </button>

                  <Link 
                    href={`/dashboard/assessment?type=${p.id}`} 
                    className="btn-primary-blue"
                    style={{
                      flex: 1.2,
                      textDecoration: "none",
                      padding: "10px 14px",
                      fontSize: "0.82rem",
                      justifyContent: "center"
                    }}
                  >
                    {prevRun ? "Run Again →" : "Launch Assessment →"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 5. View Details Modal Drawer ───────────────────────────────────── */}
      {selectedDetailPipeline && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}
          onClick={() => setSelectedDetailPipeline(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#FFFFFF",
              borderRadius: "24px",
              maxWidth: "580px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "32px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              border: "1px solid #E2E8F0",
              position: "relative"
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedDetailPipeline(null)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                border: "none",
                background: "#F1F5F9",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                fontSize: "1rem",
                color: "#64748B",
                cursor: "pointer"
              }}
            >
              ✕
            </button>

            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "16px", overflow: "hidden", border: `2px solid ${selectedDetailPipeline.color}40` }}>
                <img src={selectedDetailPipeline.icon} alt={selectedDetailPipeline.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: selectedDetailPipeline.color, textTransform: "uppercase" }}>{selectedDetailPipeline.category} ASSESSMENT</span>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1E293B", margin: "2px 0 0" }}>{selectedDetailPipeline.name}</h2>
              </div>
            </div>

            {/* Modal Purpose & Description */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1E293B", marginBottom: "6px" }}>Assessment Purpose</h4>
              <p style={{ fontSize: "0.88rem", color: "#475569", lineHeight: 1.6, margin: 0 }}>
                {selectedDetailPipeline.purpose}
              </p>
            </div>

            {/* Categorized Required Inputs */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1E293B", marginBottom: "10px" }}>Required Input Biomarkers</h4>
              
              {selectedDetailPipeline.categorizedInputs.lab.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 700, marginBottom: "4px" }}>LABORATORY TESTS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {selectedDetailPipeline.categorizedInputs.lab.map((t, idx) => (
                      <span key={idx} style={{ fontSize: "0.78rem", color: "#1E88E5", background: "#E3F2FD", border: "1px solid #90CAF9", padding: "4px 10px", borderRadius: "8px", fontWeight: 600 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedDetailPipeline.categorizedInputs.vitals.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 700, marginBottom: "4px" }}>CLINICAL VITALS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {selectedDetailPipeline.categorizedInputs.vitals.map((t, idx) => (
                      <span key={idx} style={{ fontSize: "0.78rem", color: "#2EBD85", background: "#E8F5E9", border: "1px solid #A5D6A7", padding: "4px 10px", borderRadius: "8px", fontWeight: 600 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedDetailPipeline.categorizedInputs.patient.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 700, marginBottom: "4px" }}>PATIENT INFORMATION</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {selectedDetailPipeline.categorizedInputs.patient.map((t, idx) => (
                      <span key={idx} style={{ fontSize: "0.78rem", color: "#475569", background: "#F1F5F9", border: "1px solid #E2E8F0", padding: "4px 10px", borderRadius: "8px", fontWeight: 600 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Model Specs */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "16px", borderRadius: "14px", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: 700 }}>AI / ML Model:</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#8B5CF6" }}>🤖 {selectedDetailPipeline.modelName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: 700 }}>Est. Completion:</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1E293B" }}>⏱️ {selectedDetailPipeline.estimatedTime}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setSelectedDetailPipeline(null)}
                style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid #CBD5E1", background: "#FFFFFF", color: "#475569", fontWeight: 700, cursor: "pointer" }}
              >
                Close
              </button>
              <Link
                href={`/dashboard/assessment?type=${selectedDetailPipeline.id}`}
                className="btn-primary-blue"
                style={{ flex: 1.5, textDecoration: "none", padding: "12px", justifyContent: "center" }}
              >
                Launch Assessment →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Medical AI Disclaimer ───────────────────────────────────────── */}
      <section style={{ marginTop: "40px" }}>
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "18px 24px", display: "flex", alignItems: "center", gap: "14px" }}>
          <span style={{ fontSize: "1.4rem" }}>📋</span>
          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1E293B", textTransform: "uppercase" }}>
              AI Decision Support Disclaimer
            </div>
            <p style={{ fontSize: "0.82rem", color: "#64748B", margin: "2px 0 0", lineHeight: 1.5 }}>
              MediPredict AI provides estimated disease-risk information for decision support and informational purposes. It does not replace professional medical diagnosis or treatment.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
