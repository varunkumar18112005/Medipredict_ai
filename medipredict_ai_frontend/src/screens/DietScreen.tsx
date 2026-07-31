import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useDrawer } from "../context/DrawerContext";

import api from "../services/api";

const { width } = Dimensions.get("window");

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

export default function DietScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { openDrawer } = useDrawer();

  const currentDayName = DAYS_OF_WEEK[(new Date().getDay() + 6) % 7];
  const [selectedDay, setSelectedDay] = useState<string>(currentDayName);
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[]>(DEFAULT_WEEKLY_PLAN);
  const [waterGlasses, setWaterGlasses] = useState<number>(3);
  const [isAssessmentPlan, setIsAssessmentPlan] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const [customTime, setCustomTime] = useState<string>("");
  const [customMealName, setCustomMealName] = useState<string>("");
  const [customDesc, setCustomDesc] = useState<string>("");
  const [customCal, setCustomCal] = useState<string>("");

  const todayStr = new Date().toISOString().split("T")[0];
  const formattedTodayDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const fetchBackendPlan = async () => {
    try {
      const res = await api.get("/lifestyle/plan");
      if (res.data) {
        if (res.data.dietPlanJson) {
          const parsed = JSON.parse(res.data.dietPlanJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWeeklyPlan(parsed);
            await AsyncStorage.setItem("medipredict_weekly_diet_plan", JSON.stringify(parsed));
          }
        }
        if (res.data.waterGlasses !== undefined && res.data.waterGlasses !== null) {
          setWaterGlasses(res.data.waterGlasses);
          await AsyncStorage.setItem("medipredict_water_glasses", res.data.waterGlasses.toString());
        }
      }
    } catch (err) {
      console.warn("Mobile backend diet plan fetch fallback to AsyncStorage", err);
    }
  };

  useEffect(() => {
    loadDietData();

    const unsubscribe = navigation?.addListener?.("focus", () => {
      fetchBackendPlan();
    });

    const interval = setInterval(fetchBackendPlan, 4000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(interval);
    };
  }, [navigation, todayStr]);

  const loadDietData = async () => {
    try {
      const savedWeeklyStr = await AsyncStorage.getItem("medipredict_weekly_diet_plan");
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

      const savedDate = await AsyncStorage.getItem("medipredict_diet_last_date");
      if (savedDate !== todayStr) {
        loadedPlan = loadedPlan.map((dp) => ({
          ...dp,
          meals: dp.meals.map((m) => ({ ...m, completed: false })),
        }));
        await AsyncStorage.setItem("medipredict_diet_last_date", todayStr);
      }

      setWeeklyPlan(loadedPlan);

      const savedWater = await AsyncStorage.getItem("medipredict_water_glasses");
      if (savedWater) {
        setWaterGlasses(parseInt(savedWater, 10) || 3);
      }

      // Fetch latest cloud state
      await fetchBackendPlan();
    } catch (err) {
      console.warn("Failed to load diet data", err);
    }
  };

  const saveWeeklyPlan = async (newPlan: DayPlan[], waterVal = waterGlasses) => {
    setWeeklyPlan(newPlan);
    try {
      await AsyncStorage.setItem("medipredict_weekly_diet_plan", JSON.stringify(newPlan));

      const currentDayPlan = newPlan.find((dp) => dp.day === selectedDay) || newPlan[0];
      if (currentDayPlan) {
        await AsyncStorage.setItem("medipredict_diet_items", JSON.stringify(currentDayPlan.meals));
      }
      await AsyncStorage.setItem("medipredict_diet_last_date", todayStr);

      // Post to Spring Boot backend
      await api.post("/lifestyle/diet", {
        dietPlanJson: JSON.stringify(newPlan),
        waterGlasses: waterVal,
      });
    } catch (err) {
      console.warn("Failed to save weekly diet plan", err);
    }
  };

  const updateWater = async (delta: number) => {
    const newVal = Math.max(0, Math.min(16, waterGlasses + delta));
    setWaterGlasses(newVal);
    await AsyncStorage.setItem("medipredict_water_glasses", newVal.toString());
    await saveWeeklyPlan(weeklyPlan, newVal);
  };

  const toggleMealCompleted = (dayName: string, mealId: string) => {
    const updated = weeklyPlan.map((dp) => {
      if (dp.day === dayName) {
        return {
          ...dp,
          meals: dp.meals.map((m) => (m.id === mealId ? { ...m, completed: !m.completed } : m)),
        };
      }
      return dp;
    });
    saveWeeklyPlan(updated);
  };

  const handleAddMeal = () => {
    if (!customMealName.trim()) {
      Alert.alert("Missing Name", "Please enter a meal title.");
      return;
    }

    const newMeal: MealItem = {
      id: `custom_${Date.now()}`,
      timeOfDay: customTime.trim() || "12:00 PM",
      mealName: customMealName.trim(),
      description: customDesc.trim() || "Custom nutritional meal entry",
      calories: customCal.trim() ? `${customCal.trim()} kcal` : undefined,
      completed: false,
    };

    const updated = weeklyPlan.map((dp) => {
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
    setModalVisible(false);
  };

  const removeMeal = (dayName: string, mealId: string) => {
    Alert.alert("Remove Meal", "Are you sure you want to remove this meal item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          const updated = weeklyPlan.map((dp) => {
            if (dp.day === dayName) {
              return { ...dp, meals: dp.meals.filter((m) => m.id !== mealId) };
            }
            return dp;
          });
          saveWeeklyPlan(updated);
        },
      },
    ]);
  };

  const resetWeeklyPlan = () => {
    Alert.alert("Reset Baseline", "Are you sure you want to reset to the default nutrition baseline?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("medipredict_weekly_diet_plan");
          setIsAssessmentPlan(false);
          saveWeeklyPlan(DEFAULT_WEEKLY_PLAN);
        },
      },
    ]);
  };

  // Active day calculations
  const activeDayObj = weeklyPlan.find((dp) => dp.day === selectedDay) || weeklyPlan[0] || { day: selectedDay, meals: [] };
  const currentMeals = activeDayObj.meals || [];
  const completedCount = currentMeals.filter((m) => m.completed).length;
  const totalCount = currentMeals.length;
  const dayProgressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 7-day overall calculations
  const totalWeeklyMeals = weeklyPlan.reduce((acc, dp) => acc + dp.meals.length, 0);
  const totalWeeklyCompleted = weeklyPlan.reduce((acc, dp) => acc + dp.meals.filter((m) => m.completed).length, 0);
  const weeklyProgressPercent = totalWeeklyMeals > 0 ? Math.round((totalWeeklyCompleted / totalWeeklyMeals) * 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F9FF" }}>
      {/* Top Header Bar */}
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.menuIconBtn} onPress={openDrawer} activeOpacity={0.8}>
          <Ionicons name="menu-outline" size={24} color="#1E88E5" />
        </TouchableOpacity>
        <Text style={styles.topAppTitle}>Nutrition Command</Text>
        <TouchableOpacity style={styles.addNavBtn} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
          <Ionicons name="add" size={22} color="#10B981" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* 1. Header Command Banner (Dark Box matching Web App) */}
        <View style={styles.commandBanner}>
          <View style={styles.bannerHeaderRow}>
            <View style={styles.bannerTitleGroup}>
              <Text style={styles.bannerEmoji}>🥗</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Clinical Nutrition & Diet Command</Text>
                <Text style={styles.bannerSub}>
                  {isAssessmentPlan
                    ? "✨ Active Medical Diet Plan (Synced directly from AI Health Assessment)"
                    : "Personalized weekly nutrition schedule & hydration tracker."}
                </Text>
              </View>
            </View>

            <View style={styles.dateActionRow}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateBadgeLabel}>TODAY'S DATE</Text>
                <Text style={styles.dateBadgeValue}>📅 {formattedTodayDate}</Text>
              </View>

              {isAssessmentPlan && (
                <TouchableOpacity style={styles.resetBtn} onPress={resetWeeklyPlan} activeOpacity={0.8}>
                  <Ionicons name="refresh-outline" size={14} color="#F87171" />
                  <Text style={styles.resetBtnText}>Reset Baseline</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Progress Metric Bars */}
          <View style={styles.progressRow}>
            <View style={styles.progressCardBox}>
              <View style={styles.progressCardHeader}>
                <Text style={styles.progressCardLabel}>{selectedDay} Target Completion</Text>
                <Text style={styles.progressCardValueGreen}>
                  {completedCount} / {totalCount} Meals ({dayProgressPercent}%)
                </Text>
              </View>
              <View style={styles.trackBg}>
                <View style={[styles.trackFillGreen, { width: `${dayProgressPercent}%` }]} />
              </View>
            </View>

            <View style={styles.progressCardBox}>
              <View style={styles.progressCardHeader}>
                <Text style={styles.progressCardLabel}>7-Day Overall Progress</Text>
                <Text style={styles.progressCardValueBlue}>
                  {totalWeeklyCompleted} / {totalWeeklyMeals} Meals ({weeklyProgressPercent}%)
                </Text>
              </View>
              <View style={styles.trackBg}>
                <View style={[styles.trackFillBlue, { width: `${weeklyProgressPercent}%` }]} />
              </View>
            </View>
          </View>
        </View>

        {/* 2. Hydration & Diet Principle Row */}
        <View style={styles.cardsRow}>
          {/* Daily Hydration Card */}
          <View style={styles.whiteCard}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardSectionLabel}>DAILY HYDRATION MONITOR</Text>
                <Text style={styles.cardTitleText}>💧 Water Intake</Text>
              </View>
              <View style={styles.waterTargetPill}>
                <Text style={styles.waterTargetText}>{(waterGlasses * 0.25).toFixed(2)} / 2.0 L</Text>
              </View>
            </View>

            <View style={styles.waterControlRow}>
              <View style={styles.cupsGrid}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.cupBox, i < waterGlasses && styles.cupBoxFilled]}
                    onPress={() => updateWater(i < waterGlasses ? -1 : 1)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 13 }}>🥛</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.waterButtons}>
                <TouchableOpacity style={styles.waterStepBtn} onPress={() => updateWater(-1)}>
                  <Text style={styles.waterStepText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.waterStepBtnPlus} onPress={() => updateWater(1)}>
                  <Text style={styles.waterStepTextPlus}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Clinical Diet Principle Card */}
          <View style={styles.whiteCard}>
            <Text style={styles.cardSectionLabel}>CLINICAL DIET PRINCIPLE</Text>
            <Text style={styles.cardTitleText}>🥗 Balance & Glycemic Index</Text>
            <Text style={styles.cardBodyText}>
              Prioritize low-glycemic complex carbohydrates (quinoa, oats) alongside lean proteins. Avoid refined sugars and keep sodium intake below 2000mg/day to maintain metabolic baseline.
            </Text>
          </View>
        </View>

        {/* 3. 7-Day Day Selector Cards Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelectorRow}>
          {DAYS_OF_WEEK.map((dayName) => {
            const isSelected = selectedDay === dayName;
            const isToday = dayName === currentDayName;
            const dayObj = weeklyPlan.find((dp) => dp.day === dayName);
            const dayDone = dayObj ? dayObj.meals.filter((m) => m.completed).length : 0;
            const dayTotal = dayObj ? dayObj.meals.length : 0;

            return (
              <TouchableOpacity
                key={dayName}
                style={[styles.dayCard, isSelected && styles.dayCardActive]}
                onPress={() => setSelectedDay(dayName)}
                activeOpacity={0.85}
              >
                <Text style={[styles.dayCardTitle, isSelected && styles.dayCardTitleActive]}>
                  {dayName.toUpperCase()} {isToday ? "(TODAY)" : ""}
                </Text>
                <Text style={[styles.dayCardProgress, isSelected && styles.dayCardProgressActive]}>
                  {dayDone} / {dayTotal} Done
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 4. Meal Schedule Section Header */}
        <View style={styles.mealSectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.mealSectionTitle}>{selectedDay} Medical Meal Schedule</Text>
            <Text style={styles.mealSectionSub}>Click any meal card to mark it as consumed for today</Text>
          </View>

          <TouchableOpacity
            style={styles.addMealBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.addMealBtnText}>Add Meal for {selectedDay}</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Meals List for Selected Day */}
        <View style={styles.mealsListContainer}>
          {currentMeals.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🍽️</Text>
              <Text style={styles.emptyTitle}>No Meals Scheduled for {selectedDay}</Text>
              <Text style={styles.emptySub}>Tap "Add Meal for {selectedDay}" to insert custom entries.</Text>
            </View>
          ) : (
            currentMeals.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.mealCard, item.completed && styles.mealCardCompleted]}
                onPress={() => toggleMealCompleted(selectedDay, item.id)}
                activeOpacity={0.85}
              >
                <View style={styles.mealCardLeftRow}>
                  {/* Circle Checkbox */}
                  <View style={[styles.circleCheck, item.completed && styles.circleCheckCompleted]}>
                    {item.completed && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.timeTitleRow}>
                      <View style={styles.timeTag}>
                        <Text style={styles.timeTagText}>⏰ {item.timeOfDay}</Text>
                      </View>
                      <Text
                        style={[styles.mealNameText, item.completed && styles.mealNameCompleted]}
                        numberOfLines={1}
                      >
                        {item.mealName}
                      </Text>
                    </View>

                    <Text style={styles.mealDescText}>{item.description}</Text>
                  </View>
                </View>

                <View style={styles.mealCardRightRow}>
                  {item.calories && (
                    <View style={styles.calBadge}>
                      <Text style={styles.calBadgeText}>🔥 {item.calories}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      removeMeal(selectedDay, item.id);
                    }}
                    style={styles.trashBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Custom Meal Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Meal to {selectedDay}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>TIME OF DAY</Text>
              <TextInput
                style={styles.input}
                value={customTime}
                onChangeText={setCustomTime}
                placeholder="e.g. 08:00 AM"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>MEAL TITLE / NAME</Text>
              <TextInput
                style={styles.input}
                value={customMealName}
                onChangeText={setCustomMealName}
                placeholder="e.g. Morning Protein Smoothie"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>ESTIMATED CALORIES (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                value={customCal}
                onChangeText={setCustomCal}
                placeholder="e.g. 350"
                keyboardType="numeric"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>INGREDIENTS / DETAILS</Text>
              <TextInput
                style={[styles.input, { height: 75, textAlignVertical: "top" }]}
                multiline
                value={customDesc}
                onChangeText={setCustomDesc}
                placeholder="e.g. Spinach, chia seeds, banana, and almond milk"
                placeholderTextColor="#94A3B8"
              />

              <View style={styles.modalFooterBtns}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddMeal}>
                  <Text style={styles.modalSaveText}>Save Meal to {selectedDay}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topAppBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  menuIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  topAppTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#1E293B",
  },
  addNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  contentContainer: {
    padding: 16,
    gap: 18,
  },
  commandBanner: {
    backgroundColor: "#0F172A",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  bannerHeaderRow: {
    gap: 14,
  },
  bannerTitleGroup: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  bannerEmoji: {
    fontSize: 28,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#F8FAFC",
  },
  bannerSub: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
    lineHeight: 16,
  },
  dateActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 10,
  },
  dateBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dateBadgeLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#34D399",
    letterSpacing: 0.5,
  },
  dateBadgeValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#F8FAFC",
    marginTop: 2,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#F87171",
  },
  progressRow: {
    marginTop: 18,
    gap: 10,
  },
  progressCardBox: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    padding: 12,
  },
  progressCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressCardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#CBD5E1",
  },
  progressCardValueGreen: {
    fontSize: 12,
    fontWeight: "800",
    color: "#34D399",
  },
  progressCardValueBlue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#38BDF8",
  },
  trackBg: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  trackFillGreen: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 4,
  },
  trackFillBlue: {
    height: "100%",
    backgroundColor: "#38BDF8",
    borderRadius: 4,
  },
  cardsRow: {
    gap: 14,
  },
  whiteCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardSectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  cardTitleText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 2,
  },
  cardBodyText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    fontWeight: "500",
  },
  waterTargetPill: {
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    borderWidth: 1,
    borderColor: "#0EA5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  waterTargetText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0EA5E9",
  },
  waterControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    gap: 10,
  },
  cupsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    flex: 1,
  },
  cupBox: {
    width: 32,
    height: 34,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  cupBoxFilled: {
    borderColor: "#0EA5E9",
    backgroundColor: "#0EA5E9",
  },
  waterButtons: {
    flexDirection: "row",
    gap: 6,
  },
  waterStepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  waterStepText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
  },
  waterStepBtnPlus: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#0EA5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  waterStepTextPlus: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  daySelectorRow: {
    gap: 10,
    paddingVertical: 4,
  },
  dayCard: {
    width: 120,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  dayCardActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  dayCardTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  dayCardTitleActive: {
    color: "#FFFFFF",
  },
  dayCardProgress: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1E293B",
    marginTop: 4,
  },
  dayCardProgressActive: {
    color: "#FFFFFF",
  },
  mealSectionHeader: {
    gap: 10,
    marginTop: 4,
  },
  mealSectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#1E293B",
  },
  mealSectionSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  addMealBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    alignSelf: "flex-start",
  },
  addMealBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  mealsListContainer: {
    gap: 12,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
  },
  emptySub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  mealCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  mealCardCompleted: {
    backgroundColor: "rgba(240, 253, 244, 0.9)",
    borderColor: "#10B981",
  },
  mealCardLeftRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  circleCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  circleCheckCompleted: {
    borderColor: "#10B981",
    backgroundColor: "#10B981",
  },
  timeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  timeTag: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timeTagText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#10B981",
  },
  mealNameText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    flex: 1,
  },
  mealNameCompleted: {
    color: "#059669",
    textDecorationLine: "line-through",
  },
  mealDescText: {
    fontSize: 13,
    color: "#475569",
    marginTop: 6,
    lineHeight: 18,
    fontWeight: "500",
  },
  mealCardRightRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  calBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  calBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
  },
  trashBtn: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600",
  },
  modalFooterBtns: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  modalSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#10B981",
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
