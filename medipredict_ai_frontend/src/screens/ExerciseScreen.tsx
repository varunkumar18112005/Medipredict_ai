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

export default function ExerciseScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { openDrawer } = useDrawer();

  const currentDayName = DAYS_OF_WEEK[(new Date().getDay() + 6) % 7];
  const [selectedDay, setSelectedDay] = useState<string>(currentDayName);
  const [weeklyPlan, setWeeklyPlan] = useState<DayExercisePlan[]>(DEFAULT_WEEKLY_EXERCISE_PLAN);
  const [activeMinutes, setActiveMinutes] = useState<number>(30);
  const [isAssessmentPlan, setIsAssessmentPlan] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const [customCategory, setCustomCategory] = useState<string>("Workout");
  const [customTaskName, setCustomTaskName] = useState<string>("");
  const [customDuration, setCustomDuration] = useState<string>("15 mins");

  const todayStr = new Date().toISOString().split("T")[0];
  const formattedTodayDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
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
            await AsyncStorage.setItem("medipredict_weekly_exercise_plan", JSON.stringify(parsed));
          }
        }
        if (res.data.workoutMinutes !== undefined && res.data.workoutMinutes !== null) {
          setActiveMinutes(res.data.workoutMinutes);
          await AsyncStorage.setItem("medipredict_active_minutes", res.data.workoutMinutes.toString());
        }
      }
    } catch (err) {
      console.warn("Mobile backend exercise plan fetch fallback to AsyncStorage", err);
    }
  };

  useEffect(() => {
    loadExerciseData();

    const unsubscribe = navigation?.addListener?.("focus", () => {
      fetchBackendExercisePlan();
    });

    const interval = setInterval(fetchBackendExercisePlan, 4000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(interval);
    };
  }, [navigation, todayStr]);

  const loadExerciseData = async () => {
    try {
      const savedWeeklyStr = await AsyncStorage.getItem("medipredict_weekly_exercise_plan");
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

      const savedDate = await AsyncStorage.getItem("medipredict_exercise_last_date");
      if (savedDate !== todayStr) {
        loadedPlan = loadedPlan.map((dp) => ({
          ...dp,
          tasks: dp.tasks.map((t) => ({ ...t, completed: false })),
        }));
        await AsyncStorage.setItem("medipredict_exercise_last_date", todayStr);
      }

      setWeeklyPlan(loadedPlan);

      const savedMins = await AsyncStorage.getItem("medipredict_active_minutes");
      if (savedMins) {
        setActiveMinutes(parseInt(savedMins, 10) || 30);
      }

      // Fetch latest cloud state
      await fetchBackendExercisePlan();
    } catch (err) {
      console.warn("Failed to load exercise data", err);
    }
  };

  const saveWeeklyPlan = async (newPlan: DayExercisePlan[], minsVal = activeMinutes) => {
    setWeeklyPlan(newPlan);
    try {
      await AsyncStorage.setItem("medipredict_weekly_exercise_plan", JSON.stringify(newPlan));

      const currentDayPlan = newPlan.find((dp) => dp.day === selectedDay) || newPlan[0];
      if (currentDayPlan) {
        await AsyncStorage.setItem("medipredict_exercise_tasks", JSON.stringify(currentDayPlan.tasks));
      }
      await AsyncStorage.setItem("medipredict_exercise_last_date", todayStr);

      // Post to Spring Boot backend
      await api.post("/lifestyle/exercise", {
        exercisePlanJson: JSON.stringify(newPlan),
        workoutMinutes: minsVal,
      });
    } catch (err) {
      console.warn("Failed to save weekly exercise plan", err);
    }
  };

  const toggleTaskCompleted = (dayName: string, taskId: string) => {
    const updated = weeklyPlan.map((dp) => {
      if (dp.day === dayName) {
        return {
          ...dp,
          tasks: dp.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
        };
      }
      return dp;
    });
    saveWeeklyPlan(updated);
  };

  const handleAddTask = () => {
    if (!customTaskName.trim()) {
      Alert.alert("Missing Name", "Please enter an exercise title.");
      return;
    }

    const newTask: ExerciseTask = {
      id: `custom_ex_${Date.now()}`,
      category: customCategory.trim() || "Workout",
      taskName: customTaskName.trim(),
      duration: customDuration.trim() || "15 mins",
      intensity: "Moderate",
      completed: false,
    };

    const updated = weeklyPlan.map((dp) => {
      if (dp.day === selectedDay) {
        return { ...dp, tasks: [...dp.tasks, newTask] };
      }
      return dp;
    });

    saveWeeklyPlan(updated);
    setCustomTaskName("");
    setCustomCategory("Workout");
    setCustomDuration("15 mins");
    setModalVisible(false);
  };

  const removeTask = (dayName: string, taskId: string) => {
    Alert.alert("Remove Exercise", "Are you sure you want to remove this exercise task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          const updated = weeklyPlan.map((dp) => {
            if (dp.day === dayName) {
              return { ...dp, tasks: dp.tasks.filter((t) => t.id !== taskId) };
            }
            return dp;
          });
          saveWeeklyPlan(updated);
        },
      },
    ]);
  };

  const updateActiveMinutes = async (delta: number) => {
    const newVal = Math.max(0, Math.min(180, activeMinutes + delta));
    setActiveMinutes(newVal);
    await AsyncStorage.setItem("medipredict_active_minutes", newVal.toString());
    await saveWeeklyPlan(weeklyPlan, newVal);
  };

  const resetWeeklyPlan = () => {
    Alert.alert("Reset Baseline", "Are you sure you want to reset to the default exercise baseline?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("medipredict_weekly_exercise_plan");
          setIsAssessmentPlan(false);
          saveWeeklyPlan(DEFAULT_WEEKLY_EXERCISE_PLAN);
        },
      },
    ]);
  };

  // Active day calculations
  const activeDayObj = weeklyPlan.find((dp) => dp.day === selectedDay) || weeklyPlan[0] || { day: selectedDay, tasks: [] };
  const currentTasks = activeDayObj.tasks || [];
  const completedCount = currentTasks.filter((t) => t.completed).length;
  const totalCount = currentTasks.length;
  const dayProgressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 7-day overall calculations
  const totalWeeklyTasks = weeklyPlan.reduce((acc, dp) => acc + dp.tasks.length, 0);
  const totalWeeklyCompleted = weeklyPlan.reduce((acc, dp) => acc + dp.tasks.filter((t) => t.completed).length, 0);
  const weeklyProgressPercent = totalWeeklyTasks > 0 ? Math.round((totalWeeklyCompleted / totalWeeklyTasks) * 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F9FF" }}>
      {/* Top Header Bar */}
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.menuIconBtn} onPress={openDrawer} activeOpacity={0.8}>
          <Ionicons name="menu-outline" size={24} color="#1E88E5" />
        </TouchableOpacity>
        <Text style={styles.topAppTitle}>Workout Command</Text>
        <TouchableOpacity style={styles.addNavBtn} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
          <Ionicons name="add" size={22} color="#1E88E5" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* 1. Header Command Banner (Dark Box matching Web App) */}
        <View style={styles.commandBanner}>
          <View style={styles.bannerHeaderRow}>
            <View style={styles.bannerTitleGroup}>
              <Text style={styles.bannerEmoji}>🏋️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Clinical Exercise & Recovery Command</Text>
                <Text style={styles.bannerSub}>
                  {isAssessmentPlan
                    ? "✨ Active Medical Exercise Plan (Synced directly from AI Health Assessment)"
                    : "Personalized weekly workout routine & physical activity tracker."}
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
                <Text style={styles.progressCardValueBlue}>
                  {completedCount} / {totalCount} Drills ({dayProgressPercent}%)
                </Text>
              </View>
              <View style={styles.trackBg}>
                <View style={[styles.trackFillBlue, { width: `${dayProgressPercent}%` }]} />
              </View>
            </View>

            <View style={styles.progressCardBox}>
              <View style={styles.progressCardHeader}>
                <Text style={styles.progressCardLabel}>7-Day Overall Progress</Text>
                <Text style={styles.progressCardValueGreen}>
                  {totalWeeklyCompleted} / {totalWeeklyTasks} Drills ({weeklyProgressPercent}%)
                </Text>
              </View>
              <View style={styles.trackBg}>
                <View style={[styles.trackFillGreen, { width: `${weeklyProgressPercent}%` }]} />
              </View>
            </View>
          </View>
        </View>

        {/* 2. Active Training Minutes & Safety Guidance Row */}
        <View style={styles.cardsRow}>
          {/* Active Training Time Card */}
          <View style={styles.whiteCard}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardSectionLabel}>DAILY PHYSICAL ACTIVITY</Text>
                <Text style={styles.cardTitleText}>⏱️ Active Training Time</Text>
              </View>
              <View style={styles.timeTargetPill}>
                <Text style={styles.timeTargetText}>{activeMinutes} Mins / Day</Text>
              </View>
            </View>

            <View style={styles.timeControlRow}>
              <Text style={styles.calText}>
                Est. Caloric Expenditure: <Text style={{ color: "#1E88E5", fontWeight: "800" }}>~{Math.round(activeMinutes * 5.5)} kcal</Text>
              </Text>

              <View style={styles.stepButtonsRow}>
                <TouchableOpacity style={styles.stepBtnMinus} onPress={() => updateActiveMinutes(-5)}>
                  <Text style={styles.stepBtnTextMinus}>- 5m</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.stepBtnPlus} onPress={() => updateActiveMinutes(5)}>
                  <Text style={styles.stepBtnTextPlus}>+ 5m</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Clinical Exercise Safety Card */}
          <View style={styles.whiteCard}>
            <Text style={styles.cardSectionLabel}>CLINICAL EXERCISE SAFETY</Text>
            <Text style={styles.cardTitleText}>🫀 Target Heart Rate Zone</Text>
            <Text style={styles.cardBodyText}>
              Maintain physical exertion within conversational heart-rate limits (50–70% Max HR). Stop immediately and rest if you experience dyspnea, dizziness, or chest tightness.
            </Text>
          </View>
        </View>

        {/* 3. 7-Day Day Selector Cards Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelectorRow}>
          {DAYS_OF_WEEK.map((dayName) => {
            const isSelected = selectedDay === dayName;
            const isToday = dayName === currentDayName;
            const dayObj = weeklyPlan.find((dp) => dp.day === dayName);
            const dayDone = dayObj ? dayObj.tasks.filter((t) => t.completed).length : 0;
            const dayTotal = dayObj ? dayObj.tasks.length : 0;

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

        {/* 4. Workout Schedule Section Header */}
        <View style={styles.workoutSectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.workoutSectionTitle}>{selectedDay} Medical Workout Routine</Text>
            <Text style={styles.workoutSectionSub}>Click any exercise card to mark the drill phase as completed for today</Text>
          </View>

          <TouchableOpacity
            style={styles.addWorkoutBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.addWorkoutBtnText}>Add Exercise for {selectedDay}</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Exercise List for Selected Day */}
        <View style={styles.workoutsListContainer}>
          {currentTasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🏃</Text>
              <Text style={styles.emptyTitle}>No Exercises Scheduled for {selectedDay}</Text>
              <Text style={styles.emptySub}>Tap "Add Exercise for {selectedDay}" to insert custom entries.</Text>
            </View>
          ) : (
            currentTasks.map((item) => {
              const isExpanded = expandedTask === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.workoutCard, item.completed && styles.workoutCardCompleted]}
                  onPress={() => toggleTaskCompleted(selectedDay, item.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.workoutCardTopRow}>
                    <View style={styles.workoutCardLeftGroup}>
                      {/* Circle Checkbox */}
                      <View style={[styles.circleCheck, item.completed && styles.circleCheckCompleted]}>
                        {item.completed && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.categoryTitleRow}>
                          <View style={styles.categoryTag}>
                            <Text style={styles.categoryTagText}>🏋️ {item.category}</Text>
                          </View>
                          <Text
                            style={[styles.taskNameText, item.completed && styles.taskNameCompleted]}
                            numberOfLines={1}
                          >
                            {item.taskName}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.workoutCardBottomRow}>
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationBadgeText}>⏱️ {item.duration}</Text>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      {item.exercises && item.exercises.length > 0 && (
                        <TouchableOpacity
                          style={styles.drillsToggleBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            setExpandedTask(isExpanded ? null : item.id);
                          }}
                        >
                          <Text style={styles.drillsToggleText}>
                            {isExpanded ? "Hide Drills ▲" : "Drills ▼"}
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          removeTask(selectedDay, item.id);
                        }}
                        style={styles.trashBtn}
                      >
                        <Ionicons name="trash-outline" size={18} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Collapsible Drills Accordion */}
                  {isExpanded && item.exercises && (
                    <View style={styles.drillsAccordionBox}>
                      <Text style={styles.drillsTitle}>Specific Training Drills:</Text>
                      {item.exercises.map((ex, idx) => (
                        <View key={idx} style={styles.drillBulletItem}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.drillText}>{ex}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Custom Exercise Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Workout Drill to {selectedDay}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>WORKOUT PHASE / CATEGORY</Text>
              <TextInput
                style={styles.input}
                value={customCategory}
                onChangeText={setCustomCategory}
                placeholder="e.g. Warm-Up / Cardio / Strength"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>EXERCISE TITLE / NAME</Text>
              <TextInput
                style={styles.input}
                value={customTaskName}
                onChangeText={setCustomTaskName}
                placeholder="e.g. Brisk Treadmill Walk"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>TARGET DURATION</Text>
              <TextInput
                style={styles.input}
                value={customDuration}
                onChangeText={setCustomDuration}
                placeholder="e.g. 20 mins"
                placeholderTextColor="#94A3B8"
              />

              <View style={styles.modalFooterBtns}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddTask}>
                  <Text style={styles.modalSaveText}>Save Exercise to {selectedDay}</Text>
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
    backgroundColor: "rgba(30, 136, 229, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#90CAF9",
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
    color: "#38BDF8",
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
  progressCardValueBlue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#38BDF8",
  },
  progressCardValueGreen: {
    fontSize: 12,
    fontWeight: "800",
    color: "#34D399",
  },
  trackBg: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  trackFillBlue: {
    height: "100%",
    backgroundColor: "#1E88E5",
    borderRadius: 4,
  },
  trackFillGreen: {
    height: "100%",
    backgroundColor: "#10B981",
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
  timeTargetPill: {
    backgroundColor: "rgba(30, 136, 229, 0.1)",
    borderWidth: 1,
    borderColor: "#1E88E5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  timeTargetText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E88E5",
  },
  timeControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  calText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  stepButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  stepBtnMinus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  stepBtnTextMinus: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E293B",
  },
  stepBtnPlus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#1E88E5",
  },
  stepBtnTextPlus: {
    fontSize: 12,
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
    backgroundColor: "#1E88E5",
    borderColor: "#1E88E5",
    shadowColor: "#1E88E5",
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
  workoutSectionHeader: {
    gap: 10,
    marginTop: 4,
  },
  workoutSectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#1E293B",
  },
  workoutSectionSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  addWorkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#1E88E5",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: "#1E88E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    alignSelf: "flex-start",
  },
  addWorkoutBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  workoutsListContainer: {
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
  workoutCard: {
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
  workoutCardCompleted: {
    backgroundColor: "rgba(239, 246, 255, 0.9)",
    borderColor: "#1E88E5",
  },
  workoutCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  workoutCardLeftGroup: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
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
    borderColor: "#1E88E5",
    backgroundColor: "#1E88E5",
  },
  categoryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  categoryTag: {
    backgroundColor: "rgba(30, 136, 229, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1E88E5",
  },
  taskNameText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    flex: 1,
  },
  taskNameCompleted: {
    color: "#1D4ED8",
    textDecorationLine: "line-through",
  },
  workoutCardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  durationBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  durationBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
  },
  drillsToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  drillsToggleText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E88E5",
  },
  trashBtn: {
    padding: 6,
  },
  drillsAccordionBox: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 4,
  },
  drillsTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1E88E5",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  drillBulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 12,
    color: "#1E88E5",
    fontWeight: "900",
  },
  drillText: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "600",
    flex: 1,
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
    backgroundColor: "#1E88E5",
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
