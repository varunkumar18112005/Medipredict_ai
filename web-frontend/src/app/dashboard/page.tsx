"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useCallback, useRef } from "react";
import BorderGlow from "@/components/BorderGlow";
import api, { getUser } from "../../services/api";

interface AssessmentHistory {
  id: number;
  diseaseType: string;
  riskScore: number;
  riskLevel: string;
  createdAt: string;
}

interface Stats {
  totalAssessments: number;
  avgRiskLevel: string;
  avgRiskScore: number;
}

const DISEASE_META: Record<string, { name: string; color: string; gradientId: string }> = {
  DIABETES: { name: "Diabetes", color: "#3b82f6", gradientId: "diabetesGrad" },
  HEART_DISEASE: { name: "Cardiovascular", color: "#ec4899", gradientId: "heartGrad" },
  LIVER_DISEASE: { name: "Hepatic", color: "#f59e0b", gradientId: "liverGrad" },
  KIDNEY_DISEASE: { name: "Renal", color: "#10b981", gradientId: "kidneyGrad" },
  THYROID_DISEASE: { name: "Thyroid", color: "#d946ef", gradientId: "thyroidGrad" },
  PULMONARY_DISEASE: { name: "Pulmonary", color: "#06b6d4", gradientId: "pulmonaryGrad" },
  STROKE: { name: "Stroke", color: "#f43f5e", gradientId: "strokeGrad" },
  ANEMIA: { name: "Anemia", color: "#84cc16", gradientId: "anemiaGrad" }
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<AssessmentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Care Routine State
  const [careTasks, setCareTasks] = useState<any[]>([]);
  
  // Interactive SVG Tooltip State
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  // Trends telemetry states
  const [trendsData, setTrendsData] = useState<Record<string, any[]>>({});
  const [selectedTrendType, setSelectedTrendType] = useState<string>("ALL");
  const [activeLines, setActiveLines] = useState<Record<string, boolean>>({
    DIABETES: true,
    HEART_DISEASE: true,
    LIVER_DISEASE: true,
    KIDNEY_DISEASE: true,
    THYROID_DISEASE: true,
    PULMONARY_DISEASE: true,
    STROKE: true,
    ANEMIA: true
  });

  // Helper to parse date string as UTC if no offset specified, returning local browser Date object
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

  // Helper to format dates and handle invalid or epoch dates robustly
  const formatDate = (dateStr: string, includeTime = false) => {
    if (!dateStr) return "Just now";
    const d = parseUtcDate(dateStr);
    if (d.getFullYear() === 1970) {
      return "Just now";
    }
    if (includeTime) {
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const fetchData = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;
    try {
      // Fetch stats
      const statsResponse = await api.get("/assessments/stats");
      setStats(statsResponse.data);

      // Fetch history
      const historyResponse = await api.get("/assessments?size=20");
      const content = historyResponse.data?.content || [];
      const sortedContent = [...content].sort((a, b) => parseUtcDate(b.createdAt).getTime() - parseUtcDate(a.createdAt).getTime());
      setHistory(sortedContent);

      // Fetch trends telemetry
      try {
        const trendsResponse = await api.get("/assessments/trends");
        setTrendsData(trendsResponse.data || {});
      } catch {
        // Quiet trends fallback
      }

      // 0. Cloud Sync from Spring Boot Backend - Only update if changed
      let hasDataChanged = false;
      try {
        const cloudRes = await api.get("/lifestyle/plan");
        if (cloudRes && cloudRes.data) {
          const oldDiet = localStorage.getItem("medipredict_weekly_diet_plan");
          const oldEx = localStorage.getItem("medipredict_weekly_exercise_plan");
          if (cloudRes.data.dietPlanJson && cloudRes.data.dietPlanJson !== oldDiet) {
            localStorage.setItem("medipredict_weekly_diet_plan", cloudRes.data.dietPlanJson);
            hasDataChanged = true;
          }
          if (cloudRes.data.exercisePlanJson && cloudRes.data.exercisePlanJson !== oldEx) {
            localStorage.setItem("medipredict_weekly_exercise_plan", cloudRes.data.exercisePlanJson);
            hasDataChanged = true;
          }
        }
      } catch {
        // Quiet fallback
      }

      // If background poll triggered and no data changed, skip rebuilding state to prevent UI re-renders!
      if (!hasDataChanged && careTasks.length > 0 && localStorage.getItem("medipredict_dashboard_initialized")) {
        return;
      }
      localStorage.setItem("medipredict_dashboard_initialized", "true");

      // Determine Care Routine Tasks from Weekly Diet and Exercise Planners
      const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const currentDayName = DAYS_OF_WEEK[(new Date().getDay() + 6) % 7];
      const todayStr = new Date().toISOString().split("T")[0];

      // 1. Get Today's Diet Items
      let dietList: any[] = [];
      const savedWeeklyDietStr = localStorage.getItem("medipredict_weekly_diet_plan");
      if (savedWeeklyDietStr) {
        try {
          const weeklyPlan = JSON.parse(savedWeeklyDietStr);
          const todayPlan = weeklyPlan.find((dp: any) => dp.day === currentDayName);
          if (todayPlan && todayPlan.meals && todayPlan.meals.length > 0) {
            dietList = todayPlan.meals;
          }
        } catch (e) {}
      }

      if (dietList.length === 0) {
        const savedDietStr = localStorage.getItem("medipredict_diet_items");
        if (savedDietStr) {
          try { dietList = JSON.parse(savedDietStr); } catch (e) {}
        }
      }

      if (dietList.length === 0) {
        dietList = [
          { id: "mon_b", timeOfDay: "08:00 AM", mealName: "Morning Detox & Breakfast", description: "Oatmeal with chia seeds, almonds & fresh berries + Green Tea", calories: "350 kcal", completed: false },
          { id: "mon_l", timeOfDay: "01:30 PM", mealName: "Nutrient-Dense Lunch", description: "Steamed Quinoa or Brown Rice with Lentil Soup & Salad", calories: "480 kcal", completed: false },
          { id: "mon_s", timeOfDay: "04:30 PM", mealName: "Evening Hydration & Snack", description: "1 Green Apple with roasted walnuts & pumpkin seeds", calories: "150 kcal", completed: false },
          { id: "mon_d", timeOfDay: "07:30 PM", mealName: "Light Healthy Dinner", description: "Grilled Tofu / Chicken breast with steamed broccoli & squash", calories: "380 kcal", completed: false },
        ];
      }

      // Reset Diet completion if date changed
      const savedDietDate = localStorage.getItem("medipredict_diet_last_date");
      if (savedDietDate !== todayStr) {
        dietList = dietList.map(item => ({ ...item, completed: false }));
        localStorage.setItem("medipredict_diet_last_date", todayStr);
        localStorage.setItem("medipredict_diet_items", JSON.stringify(dietList));
      }

      // 2. Get Today's Exercise Tasks
      let exerciseList: any[] = [];
      const savedWeeklyExStr = localStorage.getItem("medipredict_weekly_exercise_plan");
      if (savedWeeklyExStr) {
        try {
          const weeklyPlan = JSON.parse(savedWeeklyExStr);
          const todayPlan = weeklyPlan.find((dp: any) => dp.day === currentDayName);
          if (todayPlan && todayPlan.tasks && todayPlan.tasks.length > 0) {
            exerciseList = todayPlan.tasks;
          }
        } catch (e) {}
      }

      if (exerciseList.length === 0) {
        const savedExerciseStr = localStorage.getItem("medipredict_exercise_tasks");
        if (savedExerciseStr) {
          try { exerciseList = JSON.parse(savedExerciseStr); } catch (e) {}
        }
      }

      if (exerciseList.length === 0) {
        exerciseList = [
          { id: "mon_e1", category: "Warm-Up", taskName: "Dynamic Joint Mobility & Deep Breathing", duration: "10 mins", intensity: "Low", completed: false },
          { id: "mon_e2", category: "Cardio", taskName: "Brisk Walking / Low-Impact Cycling", duration: "30 mins", intensity: "Moderate", completed: false },
          { id: "mon_e3", category: "Cool-Down", taskName: "Full-Body Static Muscle Stretching", duration: "10 mins", intensity: "Low", completed: false },
        ];
      }

      // Reset Exercise completion if date changed
      const savedExerciseDate = localStorage.getItem("medipredict_exercise_last_date");
      if (savedExerciseDate !== todayStr) {
        exerciseList = exerciseList.map(item => ({ ...item, completed: false }));
        localStorage.setItem("medipredict_exercise_last_date", todayStr);
        localStorage.setItem("medipredict_exercise_tasks", JSON.stringify(exerciseList));
      }

      const combinedCareTasks = [
        ...dietList.map((d: any) => ({
          id: `diet_${d.id}`,
          type: "diet",
          title: d.mealName,
          subtitle: d.description,
          badge: d.timeOfDay || "Meal",
          checked: !!d.completed,
          originalId: d.id,
        })),
        ...exerciseList.map((e: any) => ({
          id: `ex_${e.id}`,
          type: "exercise",
          title: e.taskName,
          subtitle: `Target: ${e.duration}`,
          badge: e.category || "Workout",
          checked: !!e.completed,
          originalId: e.id,
        })),
      ];

      setCareTasks(combinedCareTasks);

    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const lastMutationRef = useRef<number>(0);

  useEffect(() => {
    const activeUser = getUser();
    if (!activeUser) {
      router.push("/login");
      return;
    }
    setUser(activeUser);
    fetchData();

    // Poll cloud backend every 3 seconds for real-time dashboard sync
    const timer = setInterval(() => {
      if (Date.now() - lastMutationRef.current > 3000) {
        fetchData();
      }
    }, 3000);

    // Auto-refresh when user switches back to Dashboard tab
    const handleFocus = () => fetchData();
    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
    };
  }, [router, fetchData]);

  // Toggle care task check status and sync with Diet & Exercise planners
  const handleToggleTask = (id: string) => {
    const target = careTasks.find(t => t.id === id);
    if (!target) return;

    lastMutationRef.current = Date.now();
    const newChecked = !target.checked;
    setCareTasks(prev => prev.map(t => t.id === id ? { ...t, checked: newChecked } : t));

    const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const currentDayName = DAYS_OF_WEEK[(new Date().getDay() + 6) % 7];

    if (target.type === "diet") {
      let weekly: any[] = [];
      const savedWeekly = localStorage.getItem("medipredict_weekly_diet_plan");
      if (savedWeekly) {
        try { weekly = JSON.parse(savedWeekly); } catch (e) {}
      }

      if (!Array.isArray(weekly) || weekly.length === 0) {
        // Fallback baseline weekly plan if not created yet
        weekly = [
          { day: "Monday", meals: [{ id: "mon_b", timeOfDay: "08:00 AM", mealName: "Morning Detox & Breakfast", description: "Oatmeal with chia seeds, almonds & fresh berries + Green Tea", calories: "350 kcal", completed: false }, { id: "mon_l", timeOfDay: "01:30 PM", mealName: "Nutrient-Dense Lunch", description: "Steamed Quinoa or Brown Rice with Lentil Soup & Salad", calories: "480 kcal", completed: false }, { id: "mon_s", timeOfDay: "04:30 PM", mealName: "Evening Hydration & Snack", description: "1 Green Apple with roasted walnuts & pumpkin seeds", calories: "150 kcal", completed: false }, { id: "mon_d", timeOfDay: "07:30 PM", mealName: "Light Healthy Dinner", description: "Grilled Tofu / Chicken breast with steamed broccoli & squash", calories: "380 kcal", completed: false }] },
          { day: "Tuesday", meals: [{ id: "tue_b", timeOfDay: "08:00 AM", mealName: "Protein-Rich Breakfast", description: "Scrambled egg whites with spinach & whole-grain toast", calories: "320 kcal", completed: false }, { id: "tue_l", timeOfDay: "01:30 PM", mealName: "Balanced Med Bowl", description: "Tuna salad or Chickpea bowl over mixed greens & olive oil", calories: "460 kcal", completed: false }, { id: "tue_s", timeOfDay: "04:30 PM", mealName: "Mid-Afternoon Snack", description: "Greek yogurt with flaxseeds or unsweetened almond butter", calories: "140 kcal", completed: false }, { id: "tue_d", timeOfDay: "07:30 PM", mealName: "Omega-3 Dinner", description: "Baked salmon or cod with roasted asparagus & zucchini", calories: "400 kcal", completed: false }] },
          { day: "Wednesday", meals: [{ id: "wed_b", timeOfDay: "08:00 AM", mealName: "Fiber Power Breakfast", description: "Chia seed pudding with blueberries & unsweetened almond milk", calories: "290 kcal", completed: false }, { id: "wed_l", timeOfDay: "01:30 PM", mealName: "Legume Power Lunch", description: "Well-cooked lentil stew with brown rice & cucumber salad", calories: "450 kcal", completed: false }, { id: "wed_s", timeOfDay: "04:30 PM", mealName: "Snack & Hydration", description: "Fresh coconut water with 6 raw walnuts", calories: "130 kcal", completed: false }, { id: "wed_d", timeOfDay: "07:30 PM", mealName: "Lean Protein Dinner", description: "Turkey or Tofu stir-fry with bell peppers & green beans", calories: "370 kcal", completed: false }] },
          { day: "Thursday", meals: [{ id: "thu_b", timeOfDay: "08:00 AM", mealName: "Antioxidant Smoothie", description: "Spinach, avocado, protein powder & coconut water blend", calories: "310 kcal", completed: false }, { id: "thu_l", timeOfDay: "01:30 PM", mealName: "High-Fiber Lunch", description: "Quinoa salad with roasted carrots, pumpkin seeds & lemon", calories: "440 kcal", completed: false }, { id: "thu_s", timeOfDay: "04:30 PM", mealName: "Vitality Snack", description: "Cucumber slices with hummus or roasted edamame", calories: "120 kcal", completed: false }, { id: "thu_d", timeOfDay: "07:30 PM", mealName: "Heart-Healthy Dinner", description: "Baked tilapia or lentil patties with roasted cauliflower", calories: "360 kcal", completed: false }] },
          { day: "Friday", meals: [{ id: "fri_b", timeOfDay: "08:00 AM", mealName: "Oat & Seed Bowl", description: "Steel-cut oats with ground flaxseed, cinnamon & sliced banana", calories: "340 kcal", completed: false }, { id: "fri_l", timeOfDay: "01:30 PM", mealName: "Protein Salad", description: "Grilled chicken breast or tofu lettuce wraps with avocado", calories: "450 kcal", completed: false }, { id: "fri_s", timeOfDay: "04:30 PM", mealName: "Afternoon Refreshment", description: "Mixed berries with sunflower seeds", calories: "130 kcal", completed: false }, { id: "fri_d", timeOfDay: "07:30 PM", mealName: "Restorative Dinner", description: "Pan-seared cod or mushroom risotto with steamed spinach", calories: "390 kcal", completed: false }] },
          { day: "Saturday", meals: [{ id: "sat_b", timeOfDay: "08:00 AM", mealName: "Weekend Omelet", description: "Omelet with tomatoes, spinach, mushrooms & avocado", calories: "360 kcal", completed: false }, { id: "sat_l", timeOfDay: "01:30 PM", mealName: "Mediterranean Wrap", description: "Whole-grain hummus & roasted veggie wrap with tabbouleh", calories: "470 kcal", completed: false }, { id: "sat_s", timeOfDay: "04:30 PM", mealName: "Nutrient Crunch", description: "Sliced bell peppers with guacamole", calories: "140 kcal", completed: false }, { id: "sat_d", timeOfDay: "07:30 PM", mealName: "Seafood & Greens", description: "Baked shrimp with zucchini noodles & pesto", calories: "380 kcal", completed: false }] },
          { day: "Sunday", meals: [{ id: "sun_b", timeOfDay: "08:00 AM", mealName: "Sunday Protein Waffle", description: "Gluten-free protein waffle topped with fresh raspberries", calories: "330 kcal", completed: false }, { id: "sun_l", timeOfDay: "01:30 PM", mealName: "Clean Grain Bowl", description: "Brown rice with sautéed kale, roasted sweet potato & chickpeas", calories: "480 kcal", completed: false }, { id: "sun_s", timeOfDay: "04:30 PM", mealName: "Light Evening Snack", description: "Handful of macadamia nuts or sliced pear", calories: "150 kcal", completed: false }, { id: "sun_d", timeOfDay: "07:30 PM", mealName: "Detox Soup & Protein", description: "Unsalted vegetable soup with grilled chicken breast", calories: "350 kcal", completed: false }] }
        ];
      }

      const updatedWeekly = weekly.map((dp: any) => {
        if (dp.day === currentDayName) {
          return {
            ...dp,
            meals: dp.meals.map((m: any) => m.id === target.originalId ? { ...m, completed: newChecked } : m)
          };
        }
        return dp;
      });

      const jsonStr = JSON.stringify(updatedWeekly);
      localStorage.setItem("medipredict_weekly_diet_plan", jsonStr);
      api.post("/lifestyle/diet", {
        dietPlanJson: jsonStr,
        waterGlasses: parseInt(localStorage.getItem("medipredict_water_glasses") || "4")
      }).catch(() => {});

    } else if (target.type === "exercise") {
      let weekly: any[] = [];
      const savedWeeklyEx = localStorage.getItem("medipredict_weekly_exercise_plan");
      if (savedWeeklyEx) {
        try { weekly = JSON.parse(savedWeeklyEx); } catch (e) {}
      }

      if (!Array.isArray(weekly) || weekly.length === 0) {
        weekly = [
          { day: "Monday", tasks: [{ id: "mon_e1", category: "Warm-Up", taskName: "Dynamic Joint Mobility & Deep Breathing", duration: "10 mins", intensity: "Low", completed: false }, { id: "mon_e2", category: "Cardio", taskName: "Brisk Walking / Low-Impact Cycling", duration: "30 mins", intensity: "Moderate", completed: false }, { id: "mon_e3", category: "Cool-Down", taskName: "Full-Body Static Muscle Stretching", duration: "10 mins", intensity: "Low", completed: false }] },
          { day: "Tuesday", tasks: [{ id: "tue_e1", category: "Warm-Up", taskName: "Arm Swings & Torso Twists", duration: "10 mins", intensity: "Low", completed: false }, { id: "tue_e2", category: "Strength & Core", taskName: "Light Resistance & Seated Knee Extensions", duration: "25 mins", intensity: "Moderate", completed: false }, { id: "tue_e3", category: "Cool-Down", taskName: "Restorative Seated Quiet Rest", duration: "10 mins", intensity: "Low", completed: false }] },
          { day: "Wednesday", tasks: [{ id: "wed_e1", category: "Warm-Up", taskName: "Pursed-Lip Breathing & Shoulder Shrugs", duration: "10 mins", intensity: "Low", completed: false }, { id: "wed_e2", category: "Aerobic Phase", taskName: "Conversational Pace Swimming or Walking", duration: "30 mins", intensity: "Moderate", completed: false }, { id: "wed_e3", category: "Cool-Down", taskName: "Hamstring & Chest Opener Stretch", duration: "10 mins", intensity: "Low", completed: false }] },
          { day: "Thursday", tasks: [{ id: "thu_e1", category: "Warm-Up", taskName: "Neck Rolls & Slow Indoor Walk", duration: "10 mins", intensity: "Low", completed: false }, { id: "thu_e2", category: "Cardio & Mobility", taskName: "Stationary Bicycle Workout", duration: "25 mins", intensity: "Moderate", completed: false }, { id: "thu_e3", category: "Cool-Down", taskName: "Standing Calf & Quad Stretches", duration: "10 mins", intensity: "Low", completed: false }] },
          { day: "Friday", tasks: [{ id: "fri_e1", category: "Warm-Up", taskName: "Seated Joint Mobilizers & Breathing", duration: "10 mins", intensity: "Low", completed: false }, { id: "fri_e2", category: "Cardio", taskName: "Brisk Treadmill Walking", duration: "30 mins", intensity: "Moderate", completed: false }, { id: "fri_e3", category: "Cool-Down", taskName: "Child's Pose & Quiet Seated Rest", duration: "10 mins", intensity: "Low", completed: false }] },
          { day: "Saturday", tasks: [{ id: "sat_e1", category: "Warm-Up", taskName: "Shoulder Rolls & Torso Rotations", duration: "10 mins", intensity: "Low", completed: false }, { id: "sat_e2", category: "Low-Impact Active", taskName: "Nature Leisure Walk or Water Aerobics", duration: "35 mins", intensity: "Moderate", completed: false }, { id: "sat_e3", category: "Cool-Down", taskName: "Full Body Restorative Relaxation", duration: "10 mins", intensity: "Low", completed: false }] },
          { day: "Sunday", tasks: [{ id: "sun_e1", category: "Warm-Up", taskName: "Gentle Seated Mobility & Breathing", duration: "10 mins", intensity: "Low", completed: false }, { id: "sun_e2", category: "Restorative Activity", taskName: "Light Yoga / Stretching & Meditation", duration: "25 mins", intensity: "Low", completed: false }, { id: "sun_e3", category: "Cool-Down", taskName: "Mindful Meditation & Relaxation", duration: "10 mins", intensity: "Low", completed: false }] }
        ];
      }

      const updatedWeekly = weekly.map((dp: any) => {
        if (dp.day === currentDayName) {
          return {
            ...dp,
            tasks: dp.tasks.map((t: any) => t.id === target.originalId ? { ...t, completed: newChecked } : t)
          };
        }
        return dp;
      });

      const jsonStr = JSON.stringify(updatedWeekly);
      localStorage.setItem("medipredict_weekly_exercise_plan", jsonStr);
      api.post("/lifestyle/exercise", {
        exercisePlanJson: jsonStr,
        workoutMinutes: parseInt(localStorage.getItem("medipredict_active_minutes") || "30")
      }).catch(() => {});
    }
  };

  // Get color code for risk levels
  const getRiskColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case "CRITICAL":
        return "#ef4444"; // Red
      case "HIGH":
        return "#f97316"; // Orange
      case "MEDIUM":
        return "#eab308"; // Yellow
      case "LOW":
        return "#10b981"; // Emerald Green
      default:
        return "var(--text-muted)";
    }
  };

  // Get dynamic greeting based on system hours
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    return "Good evening";
  };

  const getInitials = () => {
    if (!user) return "";
    const f = user.firstName ? user.firstName[0] : "";
    const l = user.lastName ? user.lastName[0] : "";
    return (f + l).toUpperCase();
  };

  // Render dynamic SVG graph points with area shading and hover tooltips
  const renderTrendGraph = () => {
    // Check if trendsData has any entries with elements
    const hasData = Object.values(trendsData).some(arr => arr && arr.length > 0);
    if (!hasData) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "220px", border: "1px dashed #cbd5e1", borderRadius: "14px", background: "#f8fafc" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center" }}>
            📊 No telemetry records available yet.<br />
            <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Complete diagnostic assessments to view longitudinal trends.</span>
          </p>
        </div>
      );
    }

    const width = 600;
    const height = 240;
    const paddingLeft = 48;
    const paddingRight = 24;
    const paddingTop = 20;
    const paddingBottom = 30;

    interface Point {
      date: string;
      createdAt?: string;
      riskScore: number;
      riskLevel: string;
      type: string;
      timestamp: number;
      x: number;
      y: number;
    }

    // Get active types based on selection
    const activeTypes = Object.keys(trendsData).filter(type => {
      if (selectedTrendType === "ALL") {
        return activeLines[type] !== false;
      }
      return type === selectedTrendType;
    });

    const lines: { type: string; points: Point[] }[] = [];
    const allPointsForBoundaries: number[] = [];

    activeTypes.forEach(type => {
      const rawPts = trendsData[type] || [];
      if (rawPts.length === 0) return;

      const pts = rawPts.map((p: any) => ({
        ...p,
        type,
        timestamp: parseUtcDate(p.createdAt || p.date).getTime()
      })).sort((a: any, b: any) => a.timestamp - b.timestamp);

      pts.forEach((p: any) => allPointsForBoundaries.push(p.timestamp));
      lines.push({ type, points: pts });
    });

    if (allPointsForBoundaries.length === 0) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "220px", border: "1px dashed #cbd5e1", borderRadius: "14px", background: "#f8fafc" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center" }}>
            ⚠️ No active disease lines selected. Enable category toggles below.
          </p>
        </div>
      );
    }

    const minTime = Math.min(...allPointsForBoundaries);
    const maxTime = Math.max(...allPointsForBoundaries);
    const timeRange = maxTime - minTime || 1;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    // Calculate coordinates for all lines
    const processedLines = lines.map(line => {
      const ptsWithCoords = line.points.map(p => {
        const x = minTime === maxTime 
          ? paddingLeft + plotWidth / 2 
          : paddingLeft + ((p.timestamp - minTime) / timeRange) * plotWidth;
        const y = height - paddingBottom - (p.riskScore * plotHeight) / 100;
        return { ...p, x, y };
      });
      return { type: line.type, points: ptsWithCoords };
    });

    const yTicks = [100, 75, 50, 25, 0];

    return (
      <div style={{ position: "relative", width: "100%" }}>
        {/* Category Selector Pills */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", marginBottom: "16px", borderBottom: "1px solid #e2e8f0" }} className="no-scrollbar">
          <button
            onClick={() => setSelectedTrendType("ALL")}
            style={{
              padding: "7px 14px",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
              border: selectedTrendType === "ALL" ? "1px solid #1e88e5" : "1px solid #cbd5e1",
              background: selectedTrendType === "ALL" ? "#1e88e5" : "#f1f5f9",
              color: selectedTrendType === "ALL" ? "#ffffff" : "#475569",
              transition: "all 0.2s ease"
            }}
          >
            Composite View
          </button>
          {Object.keys(trendsData).map(type => {
            const meta = DISEASE_META[type] || { name: type, color: "#1e88e5" };
            const isSelected = selectedTrendType === type;
            return (
              <button
                key={type}
                onClick={() => setSelectedTrendType(type)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "20px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: isSelected ? `1px solid ${meta.color}` : "1px solid #cbd5e1",
                  background: isSelected ? meta.color : "#f1f5f9",
                  color: isSelected ? "#ffffff" : "#475569",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap"
                }}
              >
                {meta.name}
              </button>
            );
          })}
        </div>

        {/* SVG Graph Viewport */}
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: "visible", background: "#f8fafc", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "10px 0" }}>
          <defs>
            {/* Generate area fill gradients for focused views */}
            {Object.keys(DISEASE_META).map(type => (
              <linearGradient key={type} id={`areaGrad-${type}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={DISEASE_META[type].color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={DISEASE_META[type].color} stopOpacity="0.02" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines and Y-axis percentage tick marks */}
          {yTicks.map(tick => {
            const yPos = height - paddingBottom - (tick * plotHeight) / 100;
            return (
              <g key={tick}>
                {/* Horizontal Grid Line */}
                <line 
                  x1={paddingLeft} 
                  y1={yPos} 
                  x2={width - paddingRight} 
                  y2={yPos} 
                  stroke={tick === 0 ? "#cbd5e1" : "#e2e8f0"} 
                  strokeWidth={tick === 0 ? "1.5" : "1"}
                  strokeDasharray={tick === 0 ? "none" : "4 4"} 
                />
                {/* Y-Axis Percentage Label */}
                <text 
                  x={paddingLeft - 8} 
                  y={yPos + 4} 
                  textAnchor="end" 
                  fontSize="10" 
                  fontWeight="600" 
                  fill="#64748b"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Render Trajectory Lines */}
          {processedLines.map(line => {
            const meta = DISEASE_META[line.type] || { color: "#1e88e5" };
            const points = line.points;
            if (points.length === 0) return null;

            if (points.length === 1) {
              const p = points[0];
              return (
                <circle
                  key={line.type}
                  cx={p.x}
                  cy={p.y}
                  r="6"
                  fill={meta.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              );
            }

            const getCurvedPath = (pts: { x: number; y: number }[]): string => {
              if (!pts || pts.length === 0) return "";
              if (pts.length === 1) return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;

              let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;

              for (let i = 0; i < pts.length - 1; i++) {
                const p1 = pts[i];
                const p2 = pts[i + 1];
                const dx = p2.x - p1.x;
                const cp1x = p1.x + dx * 0.4;
                const cp1y = p1.y;
                const cp2x = p1.x + dx * 0.6;
                const cp2y = p2.y;

                d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
              }

              return d;
            };

            const pathD = getCurvedPath(points);

            const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(2)} ${height - paddingBottom} L ${points[0].x.toFixed(2)} ${height - paddingBottom} Z`;

            const isFocus = selectedTrendType === line.type;

            return (
              <g key={line.type}>
                {/* Shaded area under focused curve */}
                {isFocus && (
                  <path d={areaD} fill={`url(#areaGrad-${line.type})`} />
                )}

                {/* Main trajectory path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={meta.color}
                  strokeWidth={isFocus ? "4" : "3"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={selectedTrendType === "ALL" || isFocus ? 1 : 0.25}
                  style={{ transition: "stroke-width 0.2s ease, opacity 0.2s ease" }}
                />
              </g>
            );
          })}

          {/* Render Interactive Data Points */}
          {processedLines.flatMap(line => {
            const meta = DISEASE_META[line.type] || { color: "#1e88e5" };
            return line.points.map((p, i) => {
              const isHovered = hoveredPoint && hoveredPoint.x === p.x && hoveredPoint.y === p.y && hoveredPoint.type === p.type;
              return (
                <g key={`${line.type}-${i}`}>
                  {/* Invisible hover capture ring */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="14"
                    fill="transparent"
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Point dot indicator */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? "6" : "4.5"}
                    fill="#ffffff"
                    stroke={meta.color}
                    strokeWidth="3"
                    pointerEvents="none"
                    style={{
                      transition: "all 0.15s ease",
                      transform: isHovered ? "scale(1.3)" : "none",
                      transformOrigin: `${p.x}px ${p.y}px`,
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                    }}
                  />
                </g>
              );
            });
          })}
        </svg>

        {/* Dynamic Hover Tooltip Popup */}
        {hoveredPoint && (
          <div style={{
            position: "absolute",
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100 - 12}%`,
            transform: "translate(-50%, -100%)",
            background: "#ffffff",
            border: `2px solid ${(DISEASE_META[hoveredPoint.type] || { color: "#1e88e5" }).color}`,
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.12)",
            borderRadius: "12px",
            padding: "10px 14px",
            zIndex: 50,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            animation: "fadeIn 0.15s ease-out forwards"
          }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#1e293b", textTransform: "capitalize" }}>
              {(DISEASE_META[hoveredPoint.type] || { name: hoveredPoint.type }).name}
            </div>
            <div style={{ fontSize: "0.8rem", color: (DISEASE_META[hoveredPoint.type] || { color: "#1e88e5" }).color, marginTop: "4px", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
              Risk Score: {hoveredPoint.riskScore.toFixed(1)}%
              <span className="badge-risk" style={{ background: `${getRiskColor(hoveredPoint.riskLevel)}18`, color: getRiskColor(hoveredPoint.riskLevel), fontSize: "0.65rem" }}>
                {hoveredPoint.riskLevel}
              </span>
            </div>
            <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
              📅 {formatDate(hoveredPoint.createdAt || hoveredPoint.date, true)}
            </div>
          </div>
        )}

        {/* X-Axis Date Range Labels */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 8px 0", fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>
          <span>Oldest record: {formatDate(new Date(minTime).toISOString())}</span>
          <span>Latest record: {formatDate(new Date(maxTime).toISOString())}</span>
        </div>

        {/* Interactive Line Toggles for Composite View */}
        {selectedTrendType === "ALL" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "16px", padding: "12px 0 0", borderTop: "1px solid #e2e8f0" }}>
            {Object.keys(trendsData).map(type => {
              const meta = DISEASE_META[type] || { name: type, color: "#1e88e5" };
              const isLineActive = activeLines[type] !== false;
              return (
                <button
                  key={type}
                  onClick={() => setActiveLines(prev => ({ ...prev, [type]: !isLineActive }))}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    border: isLineActive ? "1px solid #cbd5e1" : "1px solid #e2e8f0",
                    background: isLineActive ? "#ffffff" : "#f8fafc",
                    color: isLineActive ? "#1e293b" : "#94a3b8",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: isLineActive ? "0 2px 6px rgba(0,0,0,0.04)" : "none"
                  }}
                >
                  <span style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: meta.color,
                    opacity: isLineActive ? 1 : 0.3,
                    boxShadow: isLineActive ? `0 0 6px ${meta.color}` : "none"
                  }} />
                  {meta.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (!user) return null;

  // Calculate task completions
  const completedTasksCount = careTasks.filter(t => t.checked).length;
  const totalTasksCount = careTasks.length;
  const completionPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  return (
    <div style={{ position: "relative" }}>
      {/* 1. Header welcome banner */}
      <section className="welcome-gradient-banner" style={{ marginBottom: "30px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* User profile avatar slot */}
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.2)",
            border: "2px solid rgba(255, 255, 255, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "1.25rem",
            color: "#ffffff",
            flexShrink: 0
          }}>
            {getInitials()}
          </div>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ffffff", lineHeight: "1.2" }}>
              {getGreeting()}, {user.firstName}!
            </h1>
            <p style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.9rem", marginTop: "4px" }}>
              MediPredict Health Portal • Health ID: <span style={{ color: "#ffffff", fontWeight: 700 }}>{user.healthId || "MP-PENDING"}</span>
            </p>
          </div>
        </div>

        {/* Live system state display */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "rgba(255, 255, 255, 0.15)",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          padding: "10px 16px",
          borderRadius: "12px",
          fontSize: "0.8rem",
          backdropFilter: "blur(10px)",
          color: "#ffffff"
        }}>
          <span className="pulse-indicator" style={{ background: "#69f0ae", boxShadow: "0 0 10px #69f0ae" }}></span>
          <span style={{ color: "#ffffff", fontWeight: 700 }}>PIPELINE ONLINE</span>
          <span style={{ borderLeft: "1px solid rgba(255,255,255,0.3)", paddingLeft: "10px", color: "rgba(255, 255, 255, 0.85)" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </span>
        </div>
      </section>

      {/* 2. Quick Action Controls Section (Full-Width Spacious Row) */}
      <section style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1e293b" }}>Quick Controls</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Direct access to AI inference models, clinic scheduling, and records</p>
          </div>
        </div>
        
        <div className="quick-action-grid">
          <Link href="/dashboard/predictor" className="action-btn-card">
            <div className="action-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1e293b" }}>Predictor Engine</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "3px" }}>Execute AI Disease Models</div>
            </div>
          </Link>

          <Link href="/dashboard/scheduler" className="action-btn-card">
            <div className="action-icon-wrapper" style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.1)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1e293b" }}>Clinic Scheduler</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "3px" }}>Book Clinic Consultation</div>
            </div>
          </Link>

          <Link href="/dashboard/history" className="action-btn-card">
            <div className="action-icon-wrapper" style={{ color: "#8b5cf6", background: "rgba(139, 92, 246, 0.1)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1e293b" }}>Health Records</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "3px" }}>View Past Diagnostic Logs</div>
            </div>
          </Link>

          <Link href="/dashboard/settings" className="action-btn-card">
            <div className="action-icon-wrapper" style={{ color: "#f59e0b", background: "rgba(245, 158, 11, 0.1)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1e293b" }}>Profile Settings</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "3px" }}>Account & System Prefs</div>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. Main Dashboard Body Grids */}
      <div className="db-grid-layout">
        
        {/* Left Side: Stats, Chart, and Activity Logs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          
          {/* Metrics grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
          }}>
            {/* Scans Count */}
            <div className="db-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>
                  Total Scans Run
                </span>
                <span style={{ color: "var(--primary)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </span>
              </div>
              <h3 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--primary)", marginTop: "12px" }}>
                {loading ? "..." : stats?.totalAssessments ?? 0}
              </h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
                Assessments successfully synced
              </p>
            </div>

            {/* Average Risk */}
            <div className="db-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>
                  Mean Risk Profile
                </span>
                <span style={{ color: "var(--secondary)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2 2.1c-.8-.7-2.1-.7-2.9 0-.8.8-.8 2.1 0 2.9l2.1-2"/></svg>
                </span>
              </div>
              <h3 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--secondary)", marginTop: "12px" }}>
                {loading ? "..." : stats?.avgRiskScore ? `${stats.avgRiskScore.toFixed(1)}%` : "0.0%"}
              </h3>
              
              {/* Avg risk progress gauge */}
              <div className="stats-progress-track">
                <div 
                  className="stats-progress-fill" 
                  style={{ 
                    width: loading ? "0%" : `${stats?.avgRiskScore ?? 0}%`,
                    background: getRiskColor(stats?.avgRiskLevel || "LOW")
                  }}
                />
              </div>
            </div>

            {/* Diagnostic Core Status */}
            <div className="db-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>
                  Diagnostic Health
                </span>
                <span style={{ color: "var(--success)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </span>
              </div>
              <h3 style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--success)", marginTop: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                READY <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--success)", display: "inline-block", boxShadow: "0 0 10px #10b981" }}></span>
              </h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "10px" }}>
                ML Predictor nodes active
              </p>
            </div>
          </div>

          {/* Dynamic SVG telemetry trend details */}
          <div className="db-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e293b" }}>Longitudinal Telemetry Trend</h3>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Risk percentage trajectories across test categories</p>
              </div>
              <span style={{ fontSize: "0.75rem", background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.15)", borderRadius: "6px", color: "var(--primary)", padding: "4px 8px", fontWeight: 600 }}>
                Category Scores
              </span>
            </div>
            {loading ? <p style={{ color: "var(--text-muted)" }}>Loading telemetry data...</p> : renderTrendGraph()}
          </div>

          {/* Recent diagnostics activity ledger */}
          <div className="db-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e293b" }}>Recent Diagnostic Run Logs</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Ledger of latest system evaluations</p>
            </div>

            <div className="activity-ledger-container">
              <div className="activity-ledger-header">
                <span>Assessment Type</span>
                <span>Risk Class</span>
                <span>Severity Index</span>
                <span style={{ textAlign: "right" }}>Completed</span>
              </div>

              {loading ? (
                <div style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>
                  Loading logs...
                </div>
              ) : history.length === 0 ? (
                <div style={{ padding: "30px 0", color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>
                  No recent activities recorded.
                </div>
              ) : (
                history.slice(0, 4).map((item) => (
                  <div key={item.id} className="activity-row">
                    <div>
                      <span className="badge-category">
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: getRiskColor(item.riskLevel) }} />
                        {item.diseaseType.replace("_", " ")}
                      </span>
                    </div>
                    <div>
                      <span className="badge-risk" style={{ background: `${getRiskColor(item.riskLevel)}15`, color: getRiskColor(item.riskLevel) }}>
                        {item.riskLevel}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, color: "#1e293b" }}>
                      {Number(item.riskScore).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "right" }}>
                      {formatDate(item.createdAt, true)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Care Routine Planner */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>

          {/* Daily Care Routine Planner */}
          <div className="db-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e293b", margin: 0 }}>Daily Care Planner</h3>
                <span style={{ fontSize: "0.75rem", color: "#1E88E5", background: "rgba(30,136,229,0.08)", padding: "2px 8px", borderRadius: "6px", fontWeight: 800 }}>
                  📅 Today's Routine
                </span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Your active daily diet & workout routines. Resets every morning for a fresh start!
              </p>
            </div>

            {/* Circular Progress Display */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              padding: "16px",
              background: "rgba(244, 250, 255, 0.8)",
              border: "1px solid #e2e8f0",
              borderRadius: "14px"
            }}>
              {/* SVG circular gauge */}
              <div style={{ position: "relative", width: "50px", height: "50px", flexShrink: 0 }}>
                <svg width="50" height="50" viewBox="0 0 36 36">
                  {/* Track ring */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="3.8"
                  />
                  {/* Progress ring fill */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--secondary)"
                    strokeWidth="3.8"
                    strokeDasharray={`${completionPercent}, 100`}
                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                  />
                </svg>
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "var(--secondary)"
                }}>
                  {completionPercent}%
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1e293b" }}>
                  Daily Tasks Completion
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {completedTasksCount} of {totalTasksCount} recommendations finished
                </div>
              </div>
            </div>

            {/* Diet Section */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <strong style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0F172A" }}>🥗 Diet & Meal Tasks</strong>
                <button
                  onClick={() => router.push("/dashboard/diet")}
                  style={{ background: "none", border: "none", color: "#1E88E5", fontSize: "0.78rem", fontWeight: 800, cursor: "pointer" }}
                >
                  Manage Diet Planner →
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {careTasks.filter(t => t.type === "diet").map((t) => (
                  <div 
                    key={t.id} 
                    onClick={() => handleToggleTask(t.id)}
                    className="care-task-row"
                    style={{
                      borderColor: t.checked ? "#a7f3d0" : "#e2e8f0",
                      background: t.checked ? "#f0fdf4" : "#f8fafc",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}
                  >
                    <div style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "5px",
                      background: t.checked ? "var(--secondary)" : "transparent",
                      border: t.checked ? "none" : "2px solid #cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      flexShrink: 0
                    }}>
                      {t.checked && "✓"}
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: t.checked ? "var(--text-muted)" : "#1e293b", textDecoration: t.checked ? "line-through" : "none" }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.subtitle}
                      </div>
                    </div>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#1E88E5", background: "rgba(30,136,229,0.08)", padding: "2px 6px", borderRadius: "4px" }}>
                      {t.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Exercise Section */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <strong style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0F172A" }}>🏋️ Workout & Exercises</strong>
                <button
                  onClick={() => router.push("/dashboard/exercise")}
                  style={{ background: "none", border: "none", color: "#1E88E5", fontSize: "0.78rem", fontWeight: 800, cursor: "pointer" }}
                >
                  Manage Exercise Planner →
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {careTasks.filter(t => t.type === "exercise").map((t) => (
                  <div 
                    key={t.id} 
                    onClick={() => handleToggleTask(t.id)}
                    className="care-task-row"
                    style={{
                      borderColor: t.checked ? "#a7f3d0" : "#e2e8f0",
                      background: t.checked ? "#f0fdf4" : "#f8fafc",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}
                  >
                    <div style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "5px",
                      background: t.checked ? "var(--secondary)" : "transparent",
                      border: t.checked ? "none" : "2px solid #cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      flexShrink: 0
                    }}>
                      {t.checked && "✓"}
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: t.checked ? "var(--text-muted)" : "#1e293b", textDecoration: t.checked ? "line-through" : "none" }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.subtitle}
                      </div>
                    </div>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#3B82F6", background: "rgba(59,130,246,0.08)", padding: "2px 6px", borderRadius: "4px" }}>
                      {t.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -90%); }
          to { opacity: 1; transform: translate(-50%, -100%); }
        }
      `}</style>
    </div>
  );
}
