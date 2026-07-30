"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BorderGlow from "@/components/BorderGlow";

interface MealItem {
  id: string;
  timeOfDay: string;
  mealName: string;
  description: string;
  calories?: string;
  completed: boolean;
}

interface DayPlan {
  day: string;
  meals: MealItem[];
}

const DEFAULT_WEEKLY_PLAN: DayPlan[] = [
  {
    day: "Monday",
    meals: [
      { id: "mon_b", timeOfDay: "08:00 AM", mealName: "Morning Detox & Breakfast", description: "Oatmeal with chia seeds, almonds & fresh berries + Green Tea", calories: "350 kcal", completed: false },
      { id: "mon_l", timeOfDay: "01:30 PM", mealName: "Nutrient-Dense Lunch", description: "Steamed Quinoa or Brown Rice with Lentil Soup & Salad", calories: "480 kcal", completed: false },
      { id: "mon_s", timeOfDay: "04:30 PM", mealName: "Evening Hydration & Snack", description: "1 Green Apple with roasted walnuts & pumpkin seeds", calories: "150 kcal", completed: false },
      { id: "mon_d", timeOfDay: "07:30 PM", mealName: "Light Healthy Dinner", description: "Grilled Tofu / Chicken breast with steamed broccoli & squash", calories: "380 kcal", completed: false },
    ],
  },
  {
    day: "Tuesday",
    meals: [
      { id: "tue_b", timeOfDay: "08:00 AM", mealName: "Protein-Rich Breakfast", description: "Scrambled egg whites with spinach & whole-grain toast", calories: "320 kcal", completed: false },
      { id: "tue_l", timeOfDay: "01:30 PM", mealName: "Balanced Med Bowl", description: "Tuna salad or Chickpea bowl over mixed greens & olive oil", calories: "460 kcal", completed: false },
      { id: "tue_s", timeOfDay: "04:30 PM", mealName: "Mid-Afternoon Snack", description: "Greek yogurt with flaxseeds or unsweetened almond butter", calories: "140 kcal", completed: false },
      { id: "tue_d", timeOfDay: "07:30 PM", mealName: "Omega-3 Dinner", description: "Baked salmon or cod with roasted asparagus & zucchini", calories: "400 kcal", completed: false },
    ],
  },
  {
    day: "Wednesday",
    meals: [
      { id: "wed_b", timeOfDay: "08:00 AM", mealName: "Fiber Power Breakfast", description: "Chia seed pudding with blueberries & unsweetened almond milk", calories: "290 kcal", completed: false },
      { id: "wed_l", timeOfDay: "01:30 PM", mealName: "Legume Power Lunch", description: "Well-cooked lentil stew with brown rice & cucumber salad", calories: "450 kcal", completed: false },
      { id: "wed_s", timeOfDay: "04:30 PM", mealName: "Snack & Hydration", description: "Fresh coconut water with 6 raw walnuts", calories: "130 kcal", completed: false },
      { id: "wed_d", timeOfDay: "07:30 PM", mealName: "Lean Protein Dinner", description: "Turkey or Tofu stir-fry with bell peppers & green beans", calories: "370 kcal", completed: false },
    ],
  },
  {
    day: "Thursday",
    meals: [
      { id: "thu_b", timeOfDay: "08:00 AM", mealName: "Antioxidant Smoothie", description: "Spinach, avocado, protein powder & coconut water blend", calories: "310 kcal", completed: false },
      { id: "thu_l", timeOfDay: "01:30 PM", mealName: "High-Fiber Lunch", description: "Quinoa salad with roasted carrots, pumpkin seeds & lemon", calories: "440 kcal", completed: false },
      { id: "thu_s", timeOfDay: "04:30 PM", mealName: "Vitality Snack", description: "Cucumber slices with hummus or roasted edamame", calories: "120 kcal", completed: false },
      { id: "thu_d", timeOfDay: "07:30 PM", mealName: "Heart-Healthy Dinner", description: "Baked tilapia or lentil patties with roasted cauliflower", calories: "360 kcal", completed: false },
    ],
  },
  {
    day: "Friday",
    meals: [
      { id: "fri_b", timeOfDay: "08:00 AM", mealName: "Oat & Seed Bowl", description: "Steel-cut oats with ground flaxseed, cinnamon & sliced banana", calories: "340 kcal", completed: false },
      { id: "fri_l", timeOfDay: "01:30 PM", mealName: "Protein Salad", description: "Grilled chicken breast or tofu lettuce wraps with avocado", calories: "450 kcal", completed: false },
      { id: "fri_s", timeOfDay: "04:30 PM", mealName: "Afternoon Refreshment", description: "Mixed berries with sunflower seeds", calories: "130 kcal", completed: false },
      { id: "fri_d", timeOfDay: "07:30 PM", mealName: "Restorative Dinner", description: "Pan-seared cod or mushroom risotto with steamed spinach", calories: "390 kcal", completed: false },
    ],
  },
  {
    day: "Saturday",
    meals: [
      { id: "sat_b", timeOfDay: "08:00 AM", mealName: "Weekend Omelet", description: "Omelet with tomatoes, spinach, mushrooms & avocado", calories: "360 kcal", completed: false },
      { id: "sat_l", timeOfDay: "01:30 PM", mealName: "Mediterranean Wrap", description: "Whole-grain hummus & roasted veggie wrap with tabbouleh", calories: "470 kcal", completed: false },
      { id: "sat_s", timeOfDay: "04:30 PM", mealName: "Nutrient Crunch", description: "Sliced bell peppers with guacamole", calories: "140 kcal", completed: false },
      { id: "sat_d", timeOfDay: "07:30 PM", mealName: "Seafood & Greens", description: "Baked shrimp with zucchini noodles & pesto", calories: "380 kcal", completed: false },
    ],
  },
  {
    day: "Sunday",
    meals: [
      { id: "sun_b", timeOfDay: "08:00 AM", mealName: "Sunday Protein Waffle", description: "Gluten-free protein waffle topped with fresh raspberries", calories: "330 kcal", completed: false },
      { id: "sun_l", timeOfDay: "01:30 PM", mealName: "Clean Grain Bowl", description: "Brown rice with sautéed kale, roasted sweet potato & chickpeas", calories: "480 kcal", completed: false },
      { id: "sun_s", timeOfDay: "04:30 PM", mealName: "Light Evening Snack", description: "Handful of macadamia nuts or sliced pear", calories: "150 kcal", completed: false },
      { id: "sun_d", timeOfDay: "07:30 PM", mealName: "Detox Soup & Protein", description: "Unsalted vegetable soup with grilled chicken breast", calories: "350 kcal", completed: false },
    ],
  },
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function DietPlannerPage() {
  const router = useRouter();
  
  // Determine current day of week name (e.g. "Monday")
  const currentDayName = DAYS_OF_WEEK[(new Date().getDay() + 6) % 7];
  
  const [selectedDay, setSelectedDay] = useState<string>(currentDayName);
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[]>(DEFAULT_WEEKLY_PLAN);
  const [waterGlasses, setWaterGlasses] = useState<number>(4);
  const [isAssessmentPlan, setIsAssessmentPlan] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [customTime, setCustomTime] = useState<string>("");
  const [customMealName, setCustomMealName] = useState<string>("");
  const [customDesc, setCustomDesc] = useState<string>("");
  const [customCal, setCustomCal] = useState<string>("");

  const todayStr = new Date().toISOString().split("T")[0];
  const formattedTodayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    // 1. Load Weekly Plan
    const savedWeeklyStr = localStorage.getItem("medipredict_weekly_diet_plan");
    let loadedPlan: DayPlan[] = DEFAULT_WEEKLY_PLAN;
    
    if (savedWeeklyStr) {
      try {
        const parsed = JSON.parse(savedWeeklyStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedPlan = parsed;
          setIsAssessmentPlan(true);
        }
      } catch (e) {
        console.error("Failed to parse weekly diet plan", e);
      }
    }
    
    // Check if daily refresh needed
    const savedDate = localStorage.getItem("medipredict_diet_last_date");
    if (savedDate !== todayStr) {
      // Reset completed status for all days on a new date
      loadedPlan = loadedPlan.map(dp => ({
        ...dp,
        meals: dp.meals.map(m => ({ ...m, completed: false }))
      }));
      localStorage.setItem("medipredict_diet_last_date", todayStr);
    }
    
    setWeeklyPlan(loadedPlan);

    // 2. Load Water Intake
    const savedWater = localStorage.getItem("medipredict_water_glasses");
    if (savedWater) {
      setWaterGlasses(parseInt(savedWater, 10) || 4);
    }
  }, [todayStr]);

  // Sync state to LocalStorage
  const saveWeeklyPlan = (newPlan: DayPlan[]) => {
    setWeeklyPlan(newPlan);
    localStorage.setItem("medipredict_weekly_diet_plan", JSON.stringify(newPlan));
    
    // Also sync today's active meals to medipredict_diet_items for dashboard care tasks
    const currentDayPlan = newPlan.find(dp => dp.day === selectedDay) || newPlan[0];
    if (currentDayPlan) {
      localStorage.setItem("medipredict_diet_items", JSON.stringify(currentDayPlan.meals));
    }
    localStorage.setItem("medipredict_diet_last_date", todayStr);
  };

  const toggleMealCompleted = (dayName: string, mealId: string) => {
    const updated = weeklyPlan.map(dp => {
      if (dp.day === dayName) {
        return {
          ...dp,
          meals: dp.meals.map(m => m.id === mealId ? { ...m, completed: !m.completed } : m)
        };
      }
      return dp;
    });
    saveWeeklyPlan(updated);
  };

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMealName.trim()) return;

    const newMeal: MealItem = {
      id: `custom_${Date.now()}`,
      timeOfDay: customTime.trim() || "12:00 PM",
      mealName: customMealName.trim(),
      description: customDesc.trim() || "Custom nutritional meal entry",
      calories: customCal.trim() ? `${customCal.trim()} kcal` : undefined,
      completed: false,
    };

    const updated = weeklyPlan.map(dp => {
      if (dp.day === selectedDay) {
        return { ...dp, meals: [...dp.meals, newMeal] };
      }
      return dp;
    });

    saveWeeklyPlan(updated);
    setCustomTime("");
    setCustomMealName("");
    setCustomDesc("");
    setCustomCal("");
    setShowAddForm(false);
  };

  const removeMeal = (dayName: string, mealId: string) => {
    const updated = weeklyPlan.map(dp => {
      if (dp.day === dayName) {
        return { ...dp, meals: dp.meals.filter(m => m.id !== mealId) };
      }
      return dp;
    });
    saveWeeklyPlan(updated);
  };

  const updateWater = (delta: number) => {
    const newVal = Math.max(0, Math.min(16, waterGlasses + delta));
    setWaterGlasses(newVal);
    localStorage.setItem("medipredict_water_glasses", newVal.toString());
  };

  const resetWeeklyPlan = () => {
    if (!confirm("Are you sure you want to reset to the default nutrition baseline?")) return;
    localStorage.removeItem("medipredict_weekly_diet_plan");
    setIsAssessmentPlan(false);
    saveWeeklyPlan(DEFAULT_WEEKLY_PLAN);
  };

  // Get active day plan
  const activeDayObj = weeklyPlan.find(dp => dp.day === selectedDay) || weeklyPlan[0] || { day: selectedDay, meals: [] };
  const currentMeals = activeDayObj.meals || [];
  const completedCount = currentMeals.filter(m => m.completed).length;
  const totalCount = currentMeals.length;
  const dayProgressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Total weekly completed count
  const totalWeeklyMeals = weeklyPlan.reduce((acc, dp) => acc + dp.meals.length, 0);
  const totalWeeklyCompleted = weeklyPlan.reduce((acc, dp) => acc + dp.meals.filter(m => m.completed).length, 0);
  const weeklyProgressPercent = totalWeeklyMeals > 0 ? Math.round((totalWeeklyCompleted / totalWeeklyMeals) * 100) : 0;

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
        <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", position: "relative", zIndex: 2 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <span style={{ fontSize: "2.2rem" }}>🥗</span>
              <div>
                <h1 style={{ margin: 0, fontSize: "1.9rem", fontWeight: 900, color: "#F8FAFC" }}>
                  Clinical Nutrition & Diet Command
                </h1>
                <p style={{ margin: "4px 0 0 0", color: "#94A3B8", fontSize: "0.95rem" }}>
                  {isAssessmentPlan 
                    ? "✨ Active Medical Diet Plan (Synced directly from AI Health Assessment)"
                    : "Personalized weekly nutrition schedule & hydration tracker."}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.15)", padding: "10px 18px", borderRadius: "16px", textAlign: "right" }}>
              <div style={{ fontSize: "0.7rem", color: "#34D399", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>TODAY'S DATE</div>
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
              <span style={{ color: "#34D399", fontWeight: 800 }}>{completedCount} / {totalCount} Meals ({dayProgressPercent}%)</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${dayProgressPercent}%`, height: "100%", background: "linear-gradient(90deg, #10B981 0%, #34D399 100%)", borderRadius: "4px", transition: "width 0.4s ease" }} />
            </div>
          </div>

          <div style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, color: "#CBD5E1", marginBottom: "8px" }}>
              <span>7-Day Overall Progress</span>
              <span style={{ color: "#38BDF8", fontWeight: 800 }}>{totalWeeklyCompleted} / {totalWeeklyMeals} Meals ({weeklyProgressPercent}%)</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${weeklyProgressPercent}%`, height: "100%", background: "linear-gradient(90deg, #0EA5E9 0%, #38BDF8 100%)", borderRadius: "4px", transition: "width 0.4s ease" }} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Hydration Tracker & Macro Highlights Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
        
        {/* Water Hydration Card */}
        <div className="card-3d" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px", background: "#FFFFFF" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>DAILY HYDRATION MONITOR</span>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E293B", marginTop: "2px" }}>💧 Water Intake</h3>
            </div>
            <div style={{ background: "rgba(14, 165, 233, 0.1)", border: "1px solid #0EA5E9", borderRadius: "10px", padding: "4px 10px", fontSize: "0.85rem", fontWeight: 800, color: "#0EA5E9" }}>
              {(waterGlasses * 0.25).toFixed(2)} / 2.0 L
            </div>
          </div>

          {/* Interactive Cups Display */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", flex: 1 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  onClick={() => updateWater(i < waterGlasses ? -1 : 1)}
                  style={{
                    width: "32px",
                    height: "36px",
                    borderRadius: "8px",
                    border: i < waterGlasses ? "1.5px solid #0EA5E9" : "1.5px solid #CBD5E1",
                    background: i < waterGlasses ? "linear-gradient(180deg, #38BDF8 0%, #0EA5E9 100%)" : "#F8FAFC",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    transition: "all 0.2s ease",
                    boxShadow: i < waterGlasses ? "0 4px 10px rgba(14, 165, 233, 0.25)" : "none"
                  }}
                  title={`Glass ${i + 1} (250ml)`}
                >
                  🥛
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => updateWater(-1)}
                style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#F1F5F9", border: "1px solid #CBD5E1", fontWeight: 800, fontSize: "1rem", cursor: "pointer" }}
              >
                -
              </button>
              <button
                onClick={() => updateWater(1)}
                style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#0EA5E9", color: "#FFF", border: "none", fontWeight: 800, fontSize: "1rem", cursor: "pointer" }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Nutritional Guidelines Highlight Card */}
        <div className="card-3d" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px", background: "#FFFFFF" }}>
          <span style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>CLINICAL DIET PRINCIPLE</span>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E293B" }}>🥗 Balance & Glycemic Index</h3>
          <p style={{ fontSize: "0.85rem", color: "#475569", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
            Prioritize low-glycemic complex carbohydrates (quinoa, oats) alongside lean proteins. Avoid refined sugars and keep sodium intake below 2000mg/day to maintain metabolic baseline.
          </p>
        </div>
      </div>

      {/* 3. Interactive Weekly Day Selector Tabs (Mon - Sun) */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px" }} className="no-scrollbar">
        {DAYS_OF_WEEK.map((dayName) => {
          const isSelected = selectedDay === dayName;
          const isToday = dayName === currentDayName;
          const dayObj = weeklyPlan.find(dp => dp.day === dayName);
          const dayDone = dayObj ? dayObj.meals.filter(m => m.completed).length : 0;
          const dayTotal = dayObj ? dayObj.meals.length : 0;

          return (
            <button
              key={dayName}
              onClick={() => setSelectedDay(dayName)}
              style={{
                flex: "1 0 120px",
                padding: "14px 12px",
                borderRadius: "16px",
                border: isSelected ? "2px solid #10B981" : "1px solid #E2E8F0",
                background: isSelected ? "#10B981" : "#FFFFFF",
                color: isSelected ? "#FFFFFF" : "#1E293B",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isSelected ? "0 6px 16px rgba(16, 185, 129, 0.25)" : "0 2px 6px rgba(0,0,0,0.02)",
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

      {/* 4. Daily Meals List Section Header & Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900, color: "#1E293B" }}>
            {selectedDay} Medical Meal Schedule
          </h3>
          <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Click any meal card to mark it as consumed for today
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: "10px 18px",
              borderRadius: "12px",
              background: "#10B981",
              color: "#FFF",
              border: "none",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            ➕ Add Meal for {selectedDay}
          </button>
        </div>
      </div>

      {/* Add Custom Meal Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddMeal}
          className="card-3d"
          style={{
            background: "#FFFFFF",
            padding: "24px",
            borderRadius: "20px",
            border: "1.5px solid #10B981",
            boxShadow: "0 10px 25px rgba(16, 185, 129, 0.1)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0F172A" }}>
            Add Custom Meal to {selectedDay} Schedule
          </h4>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "6px" }}>
                Time of Day
              </label>
              <input
                type="text"
                placeholder="e.g. 08:00 AM"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "0.9rem", fontWeight: 600 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "6px" }}>
                Meal Title / Name
              </label>
              <input
                type="text"
                placeholder="e.g. Morning Protein Shake"
                value={customMealName}
                onChange={(e) => setCustomMealName(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "0.9rem", fontWeight: 600 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "6px" }}>
                Est. Calories (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 350"
                value={customCal}
                onChange={(e) => setCustomCal(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "0.9rem", fontWeight: 600 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "6px" }}>
              Meal Ingredients / Details
            </label>
            <input
              type="text"
              placeholder="e.g. Oatmeal with chia seeds, banana, and unsweetened almond milk"
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "0.9rem" }}
            />
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
              style={{ padding: "10px 20px", borderRadius: "10px", background: "#10B981", color: "#FFF", border: "none", fontSize: "0.85rem", fontWeight: 800, cursor: "pointer" }}
            >
              Save Meal to {selectedDay}
            </button>
          </div>
        </form>
      )}

      {/* 5. Meals List for Selected Day */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {currentMeals.length === 0 ? (
          <div className="card-3d" style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
            <span style={{ fontSize: "2rem", display: "block", marginBottom: "10px" }}>🍽️</span>
            <h4 style={{ fontSize: "1.1rem", color: "#1E293B", margin: "0 0 6px 0" }}>No Meals Scheduled for {selectedDay}</h4>
            <p style={{ margin: 0, fontSize: "0.85rem" }}>Click "Add Meal" above to insert custom dietary targets for this day.</p>
          </div>
        ) : (
          currentMeals.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleMealCompleted(selectedDay, item.id)}
              className="card-3d"
              style={{
                background: item.completed ? "rgba(240, 253, 244, 0.9)" : "#FFFFFF",
                border: item.completed ? "1.5px solid #10B981" : "1px solid #E2E8F0",
                borderRadius: "20px",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                transition: "all 0.2s ease",
                transform: "none",
                boxShadow: item.completed ? "0 4px 16px rgba(16, 185, 129, 0.12)" : "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1 }}>
                {/* Circular Animated Checkbox */}
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    border: item.completed ? "none" : "2px solid #CBD5E1",
                    background: item.completed ? "#10B981" : "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFF",
                    fontWeight: 900,
                    fontSize: "16px",
                    flexShrink: 0,
                    boxShadow: item.completed ? "0 0 10px rgba(16, 185, 129, 0.4)" : "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  {item.completed && "✓"}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#10B981", background: "rgba(16,185,129,0.1)", padding: "3px 10px", borderRadius: "8px" }}>
                      ⏰ {item.timeOfDay}
                    </span>
                    <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: item.completed ? "#059669" : "#0F172A", textDecoration: item.completed ? "line-through" : "none" }}>
                      {item.mealName}
                    </h4>
                  </div>
                  <p style={{ margin: "6px 0 0 0", color: "#475569", fontSize: "0.9rem", lineHeight: 1.4, fontWeight: 500 }}>
                    {item.description}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginLeft: "16px" }}>
                {item.calories && (
                  <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#475569", background: "#F1F5F9", padding: "6px 12px", borderRadius: "10px", border: "1px solid #E2E8F0", whiteSpace: "nowrap" }}>
                    🔥 {item.calories}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMeal(selectedDay, item.id);
                  }}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: "1.1rem", padding: "4px" }}
                  title="Remove item"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
