"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BorderGlow from "@/components/BorderGlow";
import api from "@/services/api";

interface ExerciseTask {
  id: string;
  category: string;
  taskName: string;
  duration: string;
  intensity: string;
  exercises?: string[];
  completed: boolean;
}

interface DayExercisePlan {
  day: string;
  tasks: ExerciseTask[];
}

const DEFAULT_WEEKLY_EXERCISE_PLAN: DayExercisePlan[] = [
  {
    day: "Monday",
    tasks: [
      { id: "mon_e1", category: "Warm-Up", taskName: "Dynamic Joint Mobility & Deep Breathing", duration: "10 mins", intensity: "Low", exercises: ["Neck Tilts: 5 reps", "Ankle Circles: 10 reps", "Deep Diaphragmatic Breaths: 5 cycles"], completed: false },
      { id: "mon_e2", category: "Cardio", taskName: "Brisk Walking / Low-Impact Cycling", duration: "30 mins", intensity: "Moderate", exercises: ["Brisk Flat Walking: 20 mins", "Stationary Cycling: 10 mins"], completed: false },
      { id: "mon_e3", category: "Cool-Down", taskName: "Full-Body Static Muscle Stretching", duration: "10 mins", intensity: "Low", exercises: ["Hamstring Stretch: 20s", "Calf Stretch: 20s", "Child's Pose: 2 mins"], completed: false },
    ],
  },
  {
    day: "Tuesday",
    tasks: [
      { id: "tue_e1", category: "Warm-Up", taskName: "Arm Swings & Torso Twists", duration: "10 mins", intensity: "Low", exercises: ["Arm Swings: 15 reps", "Shoulder Rolls: 10 reps"], completed: false },
      { id: "tue_e2", category: "Strength & Core", taskName: "Light Resistance & Seated Knee Extensions", duration: "25 mins", intensity: "Moderate", exercises: ["Seated Knee Extensions: 10 reps/side", "Wall Push-ups: 12 reps"], completed: false },
      { id: "tue_e3", category: "Cool-Down", taskName: "Restorative Seated Quiet Rest", duration: "10 mins", intensity: "Low", exercises: ["Seated Quiet Sitting: 5 mins", "Neck Rotations: 5 reps"], completed: false },
    ],
  },
  {
    day: "Wednesday",
    tasks: [
      { id: "wed_e1", category: "Warm-Up", taskName: "Pursed-Lip Breathing & Shoulder Shrugs", duration: "10 mins", intensity: "Low", exercises: ["Pursed-Lip Breathing: 5 cycles", "Shoulder Shrugs: 10 reps"], completed: false },
      { id: "wed_e2", category: "Aerobic Phase", taskName: "Conversational Pace Swimming or Walking", duration: "30 mins", intensity: "Moderate", exercises: ["Light Swimming: 20 mins", "Flat Walking: 10 mins"], completed: false },
      { id: "wed_e3", category: "Cool-Down", taskName: "Hamstring & Chest Opener Stretch", duration: "10 mins", intensity: "Low", exercises: ["Chest Opener Stretch: 20s", "Seated Hamstring Stretch: 20s"], completed: false },
    ],
  },
  {
    day: "Thursday",
    tasks: [
      { id: "thu_e1", category: "Warm-Up", taskName: "Neck Rolls & Slow Indoor Walk", duration: "10 mins", intensity: "Low", exercises: ["Neck Rolls: 10 reps", "Slow Indoor Walk: 5 mins"], completed: false },
      { id: "thu_e2", category: "Cardio & Mobility", taskName: "Stationary Bicycle Workout", duration: "25 mins", intensity: "Moderate", exercises: ["Stationary Cycling: 20 mins", "Diaphragmatic Breathing: 5 mins"], completed: false },
      { id: "thu_e3", category: "Cool-Down", taskName: "Standing Calf & Quad Stretches", duration: "10 mins", intensity: "Low", exercises: ["Wall Calf Stretch: 20s", "Quad Stretch: 20s"], completed: false },
    ],
  },
  {
    day: "Friday",
    tasks: [
      { id: "fri_e1", category: "Warm-Up", taskName: "Seated Joint Mobilizers & Breathing", duration: "10 mins", intensity: "Low", exercises: ["Seated Joint Rotations: 10 reps", "Deep Breathing: 3 mins"], completed: false },
      { id: "fri_e2", category: "Cardio", taskName: "Brisk Treadmill Walking", duration: "30 mins", intensity: "Moderate", exercises: ["Treadmill Walk: 25 mins", "Slow Walk Cool-down: 5 mins"], completed: false },
      { id: "fri_e3", category: "Cool-Down", taskName: "Child's Pose & Quiet Seated Rest", duration: "10 mins", intensity: "Low", exercises: ["Child's Pose: 2 mins", "Quiet Seated Rest: 4 mins"], completed: false },
    ],
  },
  {
    day: "Saturday",
    tasks: [
      { id: "sat_e1", category: "Warm-Up", taskName: "Shoulder Rolls & Torso Rotations", duration: "10 mins", intensity: "Low", exercises: ["Shoulder Rolls: 12 reps", "Torso Twists: 10 reps"], completed: false },
      { id: "sat_e2", category: "Low-Impact Active", taskName: "Nature Leisure Walk or Water Aerobics", duration: "35 mins", intensity: "Moderate", exercises: ["Leisurely Walk: 30 mins", "Seated Leg Lifts: 10 reps"], completed: false },
      { id: "sat_e3", category: "Cool-Down", taskName: "Full Body Restorative Relaxation", duration: "10 mins", intensity: "Low", exercises: ["Hamstring Stretch: 20s", "Deep Breathing: 5 mins"], completed: false },
    ],
  },
  {
    day: "Sunday",
    tasks: [
      { id: "sun_e1", category: "Warm-Up", taskName: "Gentle Seated Mobility & Breathing", duration: "10 mins", intensity: "Low", exercises: ["Neck Tilts: 5 reps", "Ankle Circles: 10 reps"], completed: false },
      { id: "sun_e2", category: "Restorative Activity", taskName: "Light Yoga / Stretching & Meditation", duration: "25 mins", intensity: "Low", exercises: ["Cat-Cow Pose: 8 reps", "Gentle Yoga Stretch: 15 mins"], completed: false },
      { id: "sun_e3", category: "Cool-Down", taskName: "Mindful Meditation & Relaxation", duration: "10 mins", intensity: "Low", exercises: ["Quiet Seated Rest: 5 mins"], completed: false },
    ],
  },
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ExercisePlannerPage() {
  const router = useRouter();

  const currentDayName = DAYS_OF_WEEK[(new Date().getDay() + 6) % 7];

  const [selectedDay, setSelectedDay] = useState<string>(currentDayName);
  const [weeklyPlan, setWeeklyPlan] = useState<DayExercisePlan[]>(DEFAULT_WEEKLY_EXERCISE_PLAN);
  const [activeMinutes, setActiveMinutes] = useState<number>(30);
  const [isAssessmentPlan, setIsAssessmentPlan] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [customCategory, setCustomCategory] = useState<string>("Workout");
  const [customTaskName, setCustomTaskName] = useState<string>("");
  const [customDuration, setCustomDuration] = useState<string>("15 mins");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];
  const formattedTodayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const fetchBackendExercisePlan = async () => {
    try {
      const res = await api.get("/lifestyle/plan");
      if (res.data) {
        if (res.data.exercisePlanJson) {
          const parsed = JSON.parse(res.data.exercisePlanJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWeeklyPlan(parsed);
            localStorage.setItem("medipredict_weekly_exercise_plan", JSON.stringify(parsed));
          }
        }
        if (res.data.workoutMinutes !== undefined && res.data.workoutMinutes !== null) {
          setActiveMinutes(res.data.workoutMinutes);
          localStorage.setItem("medipredict_active_minutes", res.data.workoutMinutes.toString());
        }
      }
    } catch (err) {
      console.warn("Backend exercise plan fetch fallback to local storage", err);
    }
  };

  useEffect(() => {
    // 1. Load Weekly Exercise Plan
    const savedWeeklyStr = localStorage.getItem("medipredict_weekly_exercise_plan");
    let loadedPlan: DayExercisePlan[] = DEFAULT_WEEKLY_EXERCISE_PLAN;

    if (savedWeeklyStr) {
      try {
        const parsed = JSON.parse(savedWeeklyStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedPlan = parsed;
          setIsAssessmentPlan(true);
        }
      } catch (e) {
        console.error("Failed to parse weekly exercise plan", e);
      }
    }

    const savedDate = localStorage.getItem("medipredict_exercise_last_date");
    if (savedDate !== todayStr) {
      loadedPlan = loadedPlan.map(dp => ({
        ...dp,
        tasks: dp.tasks.map(t => ({ ...t, completed: false }))
      }));
      localStorage.setItem("medipredict_exercise_last_date", todayStr);
    }

    setWeeklyPlan(loadedPlan);

    const savedMins = localStorage.getItem("medipredict_active_minutes");
    if (savedMins) {
      setActiveMinutes(parseInt(savedMins, 10) || 30);
    }

    // 2. Fetch Remote Plan from Backend & set up real-time sync poll
    fetchBackendExercisePlan();
    const interval = setInterval(fetchBackendExercisePlan, 4000);
    window.addEventListener("focus", fetchBackendExercisePlan);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", fetchBackendExercisePlan);
    };
  }, [todayStr]);

  const saveWeeklyPlan = (newPlan: DayExercisePlan[], minsVal = activeMinutes) => {
    setWeeklyPlan(newPlan);
    localStorage.setItem("medipredict_weekly_exercise_plan", JSON.stringify(newPlan));

    const currentDayPlan = newPlan.find(dp => dp.day === selectedDay) || newPlan[0];
    if (currentDayPlan) {
      localStorage.setItem("medipredict_exercise_tasks", JSON.stringify(currentDayPlan.tasks));
    }
    localStorage.setItem("medipredict_exercise_last_date", todayStr);

    // Cloud Sync to Spring Boot Backend
    api.post("/lifestyle/exercise", {
      exercisePlanJson: JSON.stringify(newPlan),
      workoutMinutes: minsVal
    }).catch(err => console.warn("Failed to sync exercise plan to backend", err));
  };

  const toggleTaskCompleted = (dayName: string, taskId: string) => {
    const updated = weeklyPlan.map(dp => {
      if (dp.day === dayName) {
        return {
          ...dp,
          tasks: dp.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
        };
      }
      return dp;
    });
    saveWeeklyPlan(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTaskName.trim()) return;

    const newTask: ExerciseTask = {
      id: `custom_ex_${Date.now()}`,
      category: customCategory.trim() || "Workout",
      taskName: customTaskName.trim(),
      duration: customDuration.trim() || "15 mins",
      intensity: "Moderate",
      completed: false,
    };

    const updated = weeklyPlan.map(dp => {
      if (dp.day === selectedDay) {
        return { ...dp, tasks: [...dp.tasks, newTask] };
      }
      return dp;
    });

    saveWeeklyPlan(updated);
    setCustomTaskName("");
    setCustomCategory("Workout");
    setCustomDuration("15 mins");
    setShowAddForm(false);
  };

  const removeTask = (dayName: string, taskId: string) => {
    const updated = weeklyPlan.map(dp => {
      if (dp.day === dayName) {
        return { ...dp, tasks: dp.tasks.filter(t => t.id !== taskId) };
      }
      return dp;
    });
    saveWeeklyPlan(updated);
  };

  const updateActiveMinutes = (delta: number) => {
    const newVal = Math.max(0, Math.min(180, activeMinutes + delta));
    setActiveMinutes(newVal);
    localStorage.setItem("medipredict_active_minutes", newVal.toString());
  };

  const resetWeeklyPlan = () => {
    if (!confirm("Are you sure you want to reset to the default exercise baseline?")) return;
    localStorage.removeItem("medipredict_weekly_exercise_plan");
    setIsAssessmentPlan(false);
    saveWeeklyPlan(DEFAULT_WEEKLY_EXERCISE_PLAN);
  };

  // Get active day plan
  const activeDayObj = weeklyPlan.find(dp => dp.day === selectedDay) || weeklyPlan[0] || { day: selectedDay, tasks: [] };
  const currentTasks = activeDayObj.tasks || [];
  const completedCount = currentTasks.filter(t => t.completed).length;
  const totalCount = currentTasks.length;
  const dayProgressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Total weekly completed count
  const totalWeeklyTasks = weeklyPlan.reduce((acc, dp) => acc + dp.tasks.length, 0);
  const totalWeeklyCompleted = weeklyPlan.reduce((acc, dp) => acc + dp.tasks.filter(t => t.completed).length, 0);
  const weeklyProgressPercent = totalWeeklyTasks > 0 ? Math.round((totalWeeklyCompleted / totalWeeklyTasks) * 100) : 0;

  return (
    <div style={{ maxWidth: "1050px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* 1. Header Command Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
          borderRadius: "24px",
          padding: "32px",
          color: "#FFFFFF",
          boxShadow: "0 12px 32px rgba(15, 23, 42, 0.2)",
          position: "relative",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(30, 136, 229, 0.2) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", position: "relative", zIndex: 2 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <span style={{ fontSize: "2.2rem" }}>🏋️</span>
              <div>
                <h1 style={{ margin: 0, fontSize: "1.9rem", fontWeight: 900, color: "#F8FAFC" }}>
                  Clinical Exercise & Recovery Command
                </h1>
                <p style={{ margin: "4px 0 0 0", color: "#94A3B8", fontSize: "0.95rem" }}>
                  {isAssessmentPlan
                    ? "✨ Active Medical Exercise Plan (Synced directly from AI Health Assessment)"
                    : "Personalized weekly workout routine & physical activity tracker."}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.15)", padding: "10px 18px", borderRadius: "16px", textAlign: "right" }}>
              <div style={{ fontSize: "0.7rem", color: "#38BDF8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>TODAY'S DATE</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#F8FAFC", marginTop: "2px" }}>📅 {formattedTodayDate}</div>
            </div>

            {isAssessmentPlan && (
              <button
                onClick={resetWeeklyPlan}
                style={{ padding: "10px 14px", borderRadius: "14px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#F87171", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}
                title="Reset to default baseline"
              >
                🔄 Reset Baseline
              </button>
            )}
          </div>
        </div>

        {/* Weekly Completion Progress Strip */}
        <div style={{ marginTop: "28px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          <div style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, color: "#CBD5E1", marginBottom: "8px" }}>
              <span>{selectedDay} Target Completion</span>
              <span style={{ color: "#38BDF8", fontWeight: 800 }}>{completedCount} / {totalCount} Drills ({dayProgressPercent}%)</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${dayProgressPercent}%`, height: "100%", background: "linear-gradient(90deg, #1E88E5 0%, #38BDF8 100%)", borderRadius: "4px", transition: "width 0.4s ease" }} />
            </div>
          </div>

          <div style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, color: "#CBD5E1", marginBottom: "8px" }}>
              <span>7-Day Overall Progress</span>
              <span style={{ color: "#34D399", fontWeight: 800 }}>{totalWeeklyCompleted} / {totalWeeklyTasks} Drills ({weeklyProgressPercent}%)</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${weeklyProgressPercent}%`, height: "100%", background: "linear-gradient(90deg, #10B981 0%, #34D399 100%)", borderRadius: "4px", transition: "width 0.4s ease" }} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Active Training Minutes & Clinical Guidance Card */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>

        {/* Active Minutes Tracker Card */}
        <div className="card-3d" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px", background: "#FFFFFF" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>DAILY PHYSICAL ACTIVITY</span>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E293B", marginTop: "2px" }}>⏱️ Active Training Time</h3>
            </div>
            <div style={{ background: "rgba(30, 136, 229, 0.1)", border: "1px solid #1E88E5", borderRadius: "10px", padding: "4px 12px", fontSize: "0.88rem", fontWeight: 800, color: "#1E88E5" }}>
              {activeMinutes} Mins / Day
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
            <div style={{ fontSize: "0.9rem", color: "#475569", fontWeight: 600 }}>
              Est. Caloric Expenditure: <strong style={{ color: "#1E88E5", fontWeight: 800 }}>~{Math.round(activeMinutes * 5.5)} kcal</strong>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => updateActiveMinutes(-5)}
                style={{ padding: "6px 14px", borderRadius: "8px", background: "#F1F5F9", border: "1px solid #CBD5E1", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer" }}
              >
                - 5m
              </button>
              <button
                onClick={() => updateActiveMinutes(5)}
                style={{ padding: "6px 14px", borderRadius: "8px", background: "#1E88E5", color: "#FFF", border: "none", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer" }}
              >
                + 5m
              </button>
            </div>
          </div>
        </div>

        {/* Medical Training Guidance Card */}
        <div className="card-3d" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px", background: "#FFFFFF" }}>
          <span style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>CLINICAL EXERCISE SAFETY</span>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E293B" }}>🫀 Target Heart Rate Zone</h3>
          <p style={{ fontSize: "0.85rem", color: "#475569", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
            Maintain physical exertion within conversational heart-rate limits (50–70% Max HR). Stop immediately and rest if you experience dyspnea, dizziness, or chest tightness.
          </p>
        </div>
      </div>

      {/* 3. Interactive Weekly Day Selector Tabs (Mon - Sun) */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px" }} className="no-scrollbar">
        {DAYS_OF_WEEK.map((dayName) => {
          const isSelected = selectedDay === dayName;
          const isToday = dayName === currentDayName;
          const dayObj = weeklyPlan.find(dp => dp.day === dayName);
          const dayDone = dayObj ? dayObj.tasks.filter(t => t.completed).length : 0;
          const dayTotal = dayObj ? dayObj.tasks.length : 0;

          return (
            <button
              key={dayName}
              onClick={() => setSelectedDay(dayName)}
              style={{
                flex: "1 0 120px",
                padding: "14px 12px",
                borderRadius: "16px",
                border: isSelected ? "2px solid #1E88E5" : "1px solid #E2E8F0",
                background: isSelected ? "#1E88E5" : "#FFFFFF",
                color: isSelected ? "#FFFFFF" : "#1E293B",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isSelected ? "0 6px 16px rgba(30, 136, 229, 0.25)" : "0 2px 6px rgba(0,0,0,0.02)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", opacity: isSelected ? 0.9 : 0.6 }}>
                {dayName} {isToday ? "(Today)" : ""}
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 900, marginTop: "4px" }}>
                {dayDone} / {dayTotal} Done
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. Daily Exercise List Section Header & Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900, color: "#1E293B" }}>
            {selectedDay} Medical Workout Routine
          </h3>
          <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Click any exercise card to mark the drill phase as completed for today
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: "10px 18px",
              borderRadius: "12px",
              background: "#1E88E5",
              color: "#FFF",
              border: "none",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(30, 136, 229, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            ➕ Add Exercise for {selectedDay}
          </button>
        </div>
      </div>

      {/* Add Custom Exercise Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddTask}
          className="card-3d"
          style={{
            background: "#FFFFFF",
            padding: "24px",
            borderRadius: "20px",
            border: "1.5px solid #1E88E5",
            boxShadow: "0 10px 25px rgba(30, 136, 229, 0.1)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0F172A" }}>
            Add Custom Workout Drill to {selectedDay} Schedule
          </h4>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "6px" }}>
                Workout Phase / Category
              </label>
              <input
                type="text"
                placeholder="e.g. Warm-Up / Cardio / Strength"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "0.9rem", fontWeight: 600 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "6px" }}>
                Exercise Title / Name
              </label>
              <input
                type="text"
                placeholder="e.g. Brisk Treadmill Walk"
                value={customTaskName}
                onChange={(e) => setCustomTaskName(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "0.9rem", fontWeight: 600 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "6px" }}>
                Target Duration
              </label>
              <input
                type="text"
                placeholder="e.g. 20 mins"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "0.9rem", fontWeight: 600 }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              style={{ padding: "10px 18px", borderRadius: "10px", background: "#F1F5F9", border: "none", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: "10px 20px", borderRadius: "10px", background: "#1E88E5", color: "#FFF", border: "none", fontSize: "0.85rem", fontWeight: 800, cursor: "pointer" }}
            >
              Save Exercise to {selectedDay}
            </button>
          </div>
        </form>
      )}

      {/* 5. Exercise List for Selected Day */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {currentTasks.length === 0 ? (
          <div className="card-3d" style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
            <span style={{ fontSize: "2rem", display: "block", marginBottom: "10px" }}>🏃</span>
            <h4 style={{ fontSize: "1.1rem", color: "#1E293B", margin: "0 0 6px 0" }}>No Exercises Scheduled for {selectedDay}</h4>
            <p style={{ margin: 0, fontSize: "0.85rem" }}>Click "Add Exercise" above to insert custom workout targets for this day.</p>
          </div>
        ) : (
          currentTasks.map((item) => {
            const isExpanded = expandedTask === item.id;
            return (
              <div
                key={item.id}
                onClick={() => toggleTaskCompleted(selectedDay, item.id)}
                className="card-3d"
                style={{
                  background: item.completed ? "rgba(239, 246, 255, 0.9)" : "#FFFFFF",
                  border: item.completed ? "1.5px solid #1E88E5" : "1px solid #E2E8F0",
                  borderRadius: "20px",
                  padding: "20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  transform: "none",
                  boxShadow: item.completed ? "0 4px 16px rgba(30, 136, 229, 0.12)" : "0 2px 10px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1 }}>
                    {/* Circular Animated Checkbox */}
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        border: item.completed ? "none" : "2px solid #CBD5E1",
                        background: item.completed ? "#1E88E5" : "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#FFF",
                        fontWeight: 900,
                        fontSize: "16px",
                        flexShrink: 0,
                        boxShadow: item.completed ? "0 0 10px rgba(30, 136, 229, 0.4)" : "none",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {item.completed && "✓"}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#1E88E5", background: "rgba(30,136,229,0.1)", padding: "3px 10px", borderRadius: "8px" }}>
                          🏋️ {item.category}
                        </span>
                        <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: item.completed ? "#1D4ED8" : "#0F172A", textDecoration: item.completed ? "line-through" : "none" }}>
                          {item.taskName}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#475569", background: "#F1F5F9", padding: "6px 12px", borderRadius: "10px", border: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>
                      ⏱️ {item.duration}
                    </span>

                    {item.exercises && item.exercises.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedTask(isExpanded ? null : item.id);
                        }}
                        style={{ background: "none", border: "none", color: "#1E88E5", fontWeight: 800, fontSize: "0.8rem", cursor: "pointer" }}
                      >
                        {isExpanded ? "Hide Drills ▲" : "Drills ▼"}
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTask(selectedDay, item.id);
                      }}
                      style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: "1.1rem", padding: "4px" }}
                      title="Remove task"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Collapsible Specific Exercise Drills */}
                {isExpanded && item.exercises && (
                  <div
                    style={{
                      marginTop: "4px",
                      paddingTop: "12px",
                      borderTop: "1px solid #E2E8F0",
                      animation: "fadeIn 0.2s ease"
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#1E88E5", fontWeight: 800, display: "block", marginBottom: "6px" }}>
                      Specific Training Drills:
                    </span>
                    <ul style={{ margin: 0, paddingLeft: "20px", color: "#334155", fontSize: "0.88rem", display: "flex", flexDirection: "column", gap: "4px", fontWeight: 500 }}>
                      {item.exercises.map((ex, idx) => (
                        <li key={idx}>{ex}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
