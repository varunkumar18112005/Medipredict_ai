"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import api, { getUser } from "../../../services/api";
import BorderGlow from "@/components/BorderGlow";

type DiseaseType = "DIABETES" | "HEART_DISEASE" | "LIVER_DISEASE" | "KIDNEY_DISEASE" | "THYROID_DISEASE" | "PULMONARY_DISEASE" | "STROKE" | "ANEMIA";

const PIPELINES = {
  DIABETES: {
    name: "Diabetes Risk Profiler",
    color: "var(--primary)",
    fields: [
      { id: "glucose", label: "Fasting Blood Glucose (mg/dL)", type: "number", default: 100 },
      { id: "hba1c", label: "HbA1c (%)", type: "number", default: 5.5 },
      { id: "bloodPressure", label: "Blood Pressure (mmHg)", type: "number", default: 120 },
      { id: "insulin", label: "Insulin Level (μU/mL)", type: "number", default: 15 },
      { id: "bmi", label: "Body Mass Index (BMI)", type: "number", default: 25.0 },
      { id: "age", label: "Age", type: "number", default: 40 },
    ]
  },
  HEART_DISEASE: {
    name: "Cardiovascular Risk Telemetry",
    color: "var(--secondary)",
    fields: [
      { id: "restingBP", label: "Resting Blood Pressure (mmHg)", type: "number", default: 120 },
      { id: "cholesterol", label: "Total Serum Cholesterol (mg/dL)", type: "number", default: 180 },
      { id: "fastingBS", label: "Fasting Blood Sugar > 120 mg/dL (1=True, 0=False)", type: "number", default: 0 },
      { id: "restingECG", label: "Resting ECG (0=Normal, 1=ST-T, 2=LVH)", type: "number", default: 0 },
      { id: "maxHeartRate", label: "Maximum Heart Rate (BPM)", type: "number", default: 150 },
      { id: "chestPainType", label: "Chest Pain Type (0=Typical, 1=Atypical, 2=Non-Anginal, 3=Asymptomatic)", type: "number", default: 0 },
    ]
  },
  LIVER_DISEASE: {
    name: "Hepatic Function Diagnostics",
    color: "var(--accent)",
    fields: [
      { id: "totalBilirubin", label: "Total Bilirubin (mg/dL)", type: "number", default: 1.0 },
      { id: "directBilirubin", label: "Direct Bilirubin (mg/dL)", type: "number", default: 0.3 },
      { id: "alt", label: "ALT / SGPT (U/L)", type: "number", default: 30 },
      { id: "ast", label: "AST / SGOT (U/L)", type: "number", default: 30 },
      { id: "alp", label: "Alkaline Phosphatase ALP (U/L)", type: "number", default: 100 },
      { id: "albumin", label: "Albumin (g/dL)", type: "number", default: 4.0 },
    ]
  },
  KIDNEY_DISEASE: {
    name: "Renal Function Clearance",
    color: "var(--success)",
    fields: [
      { id: "serumCreatinine", label: "Serum Creatinine (mg/dL)", type: "number", default: 1.0 },
      { id: "bloodUrea", label: "Blood Urea (mg/dL)", type: "number", default: 20 },
      { id: "egfr", label: "Estimated GFR - eGFR (mL/min/1.73m²)", type: "number", default: 90 },
      { id: "urineAlbumin", label: "Urine Albumin (mg/g)", type: "number", default: 15 },
      { id: "haemoglobin", label: "Hemoglobin (g/dL)", type: "number", default: 14.0 },
      { id: "bloodPressure", label: "Blood Pressure (mmHg)", type: "number", default: 120 },
    ]
  },
  THYROID_DISEASE: {
    name: "Thyroid Dysfunction Profiler",
    color: "#d946ef",
    fields: [
      { id: "tsh", label: "Thyroid Stimulating Hormone - TSH (uIU/mL)", type: "number", default: 2.5 },
      { id: "freeT3", label: "Free T3 - FT3 (pg/mL)", type: "number", default: 1.2 },
      { id: "freeT4", label: "Free T4 - FT4 (ng/dL)", type: "number", default: 1.1 },
      { id: "antiTpo", label: "Anti-TPO Antibodies (IU/mL)", type: "number", default: 10 }
    ]
  },
  PULMONARY_DISEASE: {
    name: "Pulmonary Risk Assessment",
    color: "#06b6d4",
    fields: [
      { id: "oxygenSaturation", label: "Oxygen Saturation - SpO2 (%)", type: "number", default: 97 },
      { id: "fev1", label: "Forced Expiratory Volume - FEV1 (L)", type: "number", default: 3.0 },
      { id: "fvc", label: "Forced Vital Capacity - FVC (L)", type: "number", default: 4.0 },
      { id: "fev1FvcRatio", label: "FEV1/FVC Ratio", type: "number", default: 0.75 },
      { id: "respiratoryRate", label: "Respiratory Rate (breaths/min)", type: "number", default: 16 },
      { id: "smokingHistory", label: "Smoking History (1=Yes, 0=No)", type: "number", default: 0 }
    ]
  },
  STROKE: {
    name: "Stroke Risk Telemetry",
    color: "#f43f5e",
    fields: [
      { id: "bloodPressure", label: "Blood Pressure (mmHg)", type: "number", default: 120 },
      { id: "glucose", label: "Blood Glucose Level (mg/dL)", type: "number", default: 105 },
      { id: "cholesterol", label: "Total Cholesterol (mg/dL)", type: "number", default: 190 },
      { id: "bmi", label: "Body Mass Index (BMI)", type: "number", default: 25.0 },
      { id: "age", label: "Age", type: "number", default: 50 },
      { id: "heartDiseaseHistory", label: "History of Heart Disease (1=Yes, 0=No)", type: "number", default: 0 }
    ]
  },
  ANEMIA: {
    name: "Anemia Screening Profiler",
    color: "#f59e0b",
    fields: [
      { id: "haemoglobin", label: "Hemoglobin Level (g/dL)", type: "number", default: 14.0 },
      { id: "rbcCount", label: "Red Blood Cell Count - RBC (M/uL)", type: "number", default: 4.5 },
      { id: "hematocrit", label: "Hematocrit - HCT (%)", type: "number", default: 42.0 },
      { id: "mcv", label: "Mean Corpuscular Volume - MCV (fL)", type: "number", default: 88.0 },
      { id: "mch", label: "Mean Corpuscular Hemoglobin - MCH (pg)", type: "number", default: 29.0 },
      { id: "ferritin", label: "Serum Ferritin (ng/mL)", type: "number", default: 100.0 }
    ]
  }
};

const LIFESTYLE_PLANS: Record<DiseaseType, Record<"LOW" | "MODERATE" | "HIGH", {
  diet: {
    guidelines: string[];
    weekly: { day: string; breakfast: string; lunch: string; dinner: string; snack: string }[];
  };
  exercise: {
    guidelines: string[];
    schedule: string;
    routine: { phase: string; details: string; exercises: string[] }[];
  };
}>> = {
  DIABETES: {
    LOW: {
      diet: {
        guidelines: [
          "Incorporate whole grains, high-fiber vegetables, and lean proteins.",
          "Keep carbohydrate intake consistent and avoid sugary beverages.",
          "Stay well hydrated (at least 2.5L water/day)."
        ],
        weekly: [
          { day: "Monday", breakfast: "Oatmeal with chia seeds & berries", lunch: "Grilled chicken salad with olive oil dressing", dinner: "Baked salmon with quinoa and broccoli", snack: "A handful of almonds" },
          { day: "Tuesday", breakfast: "Greek yogurt with walnut pieces", lunch: "Turkey and avocado whole-wheat wrap", dinner: "Stir-fried tofu with mixed vegetables and brown rice", snack: "Sliced cucumber with hummus" },
          { day: "Wednesday", breakfast: "Scrambled eggs with spinach and whole-grain toast", lunch: "Quinoa and black bean bowl", dinner: "Grilled cod with asparagus and sweet potato", snack: "Apple slices with peanut butter" },
          { day: "Thursday", breakfast: "Smoothie with spinach, protein powder, and almond milk", lunch: "Lentil soup with a side green salad", dinner: "Chicken breast with roasted brussels sprouts", snack: "Pumpkin seeds" },
          { day: "Friday", breakfast: "Chia seed pudding with almond milk", lunch: "Tuna salad lettuce wraps", dinner: "Lean beef sirloin with cauliflower mash", snack: "Celery sticks with cream cheese" },
          { day: "Saturday", breakfast: "Whole-wheat pancakes with blueberries (no syrup)", lunch: "Mediterranean chickpea salad", dinner: "Baked chicken thighs with sautéed spinach", snack: "Mixed berries" },
          { day: "Sunday", breakfast: "Omelet with mushrooms, onions, and peppers", lunch: "Brown rice with grilled vegetables and edamame", dinner: "Baked tilapia with roasted zucchini", snack: "A small pear" }
        ]
      },
      exercise: {
        guidelines: [
          "Aim for at least 150 minutes of moderate-intensity aerobic exercise weekly.",
          "Perform strength training exercises at least 2 times per week."
        ],
        schedule: "5 days a week, 30 minutes per session",
        routine: [
          { 
            phase: "Warm Up", 
            details: "5-10 minutes of gentle stretching or slow walking.",
            exercises: [
              "Neck Rolls: Gently roll neck clockwise and counter-clockwise, 5 times each.",
              "Arm Circles: Rotate arms slowly in a circle, 10 reps forward and 10 reps backward.",
              "Torso Twists: Rotate upper body side-to-side with hands on hips, 10 reps each side.",
              "Light Marching: March slowly in place to raise core body temperature, 2 minutes."
            ]
          },
          { 
            phase: "Cardiovascular Activity", 
            details: "Brisk walking, cycling, or swimming at a moderate pace.",
            exercises: [
              "Brisk Walking: Walk outdoors or on a treadmill at a pace of 3.0 - 3.5 mph for 20 mins.",
              "Stationary Cycling: Maintain a steady pedaling cadence of 60-70 RPM with low-moderate resistance, 20 mins.",
              "Light Swimming: Continuous lap swimming or water aerobics, 20 mins."
            ]
          },
          { 
            phase: "Cool Down", 
            details: "5 minutes of slow walking and static stretching of major muscle groups.",
            exercises: [
              "Hamstring Stretch: Extend one leg forward, hinge at the hips, hold for 20 seconds per side.",
              "Calf Stretch: Press back heel toward the ground against a wall, hold for 20 seconds per side.",
              "Deep Breathing: Inhale slowly through the nose for 4 seconds, hold for 2 seconds, and exhale for 6 seconds. Repeat 5 times."
            ]
          }
        ]
      }
    },
    MODERATE: {
      diet: {
        guidelines: [
          "Strictly monitor carb portions using the plate method.",
          "Prefer low glycemic index foods like beans, barley, and non-starchy vegetables.",
          "Avoid all refined sugars, sweetened yogurts, and white flour products."
        ],
        weekly: [
          { day: "Monday", breakfast: "Unsweetened steel-cut oats with cinnamon", lunch: "Spinach salad with grilled chicken and walnuts", dinner: "Baked mackerel with cauliflower rice", snack: "1 boiled egg" },
          { day: "Tuesday", breakfast: "Two scrambled egg whites with tomato and spinach", lunch: "Chickpea salad with cucumber and feta cheese", dinner: "Grilled chicken with roasted broccoli and half a sweet potato", snack: "Baby carrots with guacamole" },
          { day: "Wednesday", breakfast: "Low-carb green smoothie (spinach, avocado, protein)", lunch: "Lentil and vegetable stew", dinner: "Pan-seared cod with sautéed kale and garlic", snack: "Handful of walnuts" },
          { day: "Thursday", breakfast: "Greek yogurt with ground flaxseeds", lunch: "Quinoa bowl with mixed greens and grilled tofu", dinner: "Baked turkey breast with roasted zucchini", snack: "A small orange" },
          { day: "Friday", breakfast: "Oat bran hot cereal with pumpkin seeds", lunch: "Tuna salad with olive oil and mixed baby greens", dinner: "Grilled salmon with steamed green beans", snack: "Bell pepper strips" },
          { day: "Saturday", breakfast: "Omelet with avocado and salsa", lunch: "Black bean soup with a side salad", dinner: "Baked chicken breast with roasted cauliflower", snack: "Dry-roasted cashews" },
          { day: "Sunday", breakfast: "Whole-grain toast with mashed avocado", lunch: "Mediterranean salad with baked tofu", dinner: "Baked sea bass with steamed broccoli", snack: "A cup of raspberries" }
        ]
      },
      exercise: {
        guidelines: [
          "Combine cardiovascular conditioning with resistance training to improve insulin sensitivity.",
          "Monitor blood sugar levels before and after workouts."
        ],
        schedule: "4 days a week, 40 minutes per session",
        routine: [
          { 
            phase: "Warm Up", 
            details: "10 minutes of low-impact walking and joint mobility exercises.",
            exercises: [
              "Shoulder Rolls: Roll shoulders forward and backward, 10 reps each.",
              "Torso Twists: Rotate upper body side-to-side, 15 reps each side.",
              "Step Touches: Step side to side while bringing feet together, 2 minutes.",
              "Light Marching: March slowly in place to raise core body temperature, 3 minutes."
            ]
          },
          { 
            phase: "Aerobic & Strength Circuit", 
            details: "20 minutes of brisk walking/cycling followed by 10 minutes of bodyweight squats, lunges, and wall push-ups.",
            exercises: [
              "Cardio Exercise: Walk briskly at 3.5 mph or cycle at 65 RPM, 20 mins.",
              "Bodyweight Squats: Slow down-and-up movements, keeping knees behind toes, 2 sets of 10 reps.",
              "Wall Push-Ups: Stand 2 feet from a wall, lean forward, bend arms, and push back, 2 sets of 10 reps."
            ]
          },
          { 
            phase: "Cool Down", 
            details: "10 minutes of deep breathing and hamstring/quadriceps stretches.",
            exercises: [
              "Hamstring Stretch: Sit on a chair, extend one leg, bend at hip, hold 20 seconds each leg.",
              "Quadriceps Stretch: Stand holding a wall, lift heel to buttock, hold 20 seconds each leg.",
              "Diaphragmatic Breathing: Focus on slow, deep lung expansion, 3 minutes."
            ]
          }
        ]
      }
    },
    HIGH: {
      diet: {
        guidelines: [
          "Strict carbohydrate restriction (<45g per meal).",
          "Focus on high-quality plant fibers and lean proteins to slow glucose absorption.",
          "Eliminate all simple sugars, white rice, white bread, and high-sugar fruits."
        ],
        weekly: [
          { day: "Monday", breakfast: "Avocado and poached egg on a single slice of low-carb toast", lunch: "Large green salad with grilled chicken breast and olive oil", dinner: "Baked wild-caught salmon with lemon and roasted asparagus", snack: "1/4 cup walnuts" },
          { day: "Tuesday", breakfast: "Unsweetened Greek yogurt with chia seeds and 5 raspberries", lunch: "Tofu stir-fry with broccoli, bell peppers, and cauliflower rice", dinner: "Baked cod with sautéed spinach and garlic", snack: "Celery sticks with almond butter" },
          { day: "Wednesday", breakfast: "Three-egg omelet with spinach, mushrooms, and olive oil", lunch: "Low-carb turkey lettuce wraps with mustard", dinner: "Grilled chicken thighs with roasted Brussels sprouts", snack: "One boiled egg" },
          { day: "Thursday", breakfast: "Chia seed pudding with unsweetened almond milk and vanilla extract", lunch: "Lentil soup (limited portion) with cucumber slices", dinner: "Baked shrimp with zucchini noodles and pesto", snack: "Handful of pecans" },
          { day: "Friday", breakfast: "Spinach, avocado, and unsweetened almond milk protein shake", lunch: "Tuna salad over mixed greens (no mayo, use olive oil)", dinner: "Grilled pork chop (lean) with steamed broccoli", snack: "Pumpkin seeds" },
          { day: "Saturday", breakfast: "Scrambled eggs with smoked salmon and asparagus spears", lunch: "Mediterranean salad with chickpeas (limited) and cucumbers", dinner: "Baked chicken breast with garlic sautéed kale", snack: "A few strawberries" },
          { day: "Sunday", breakfast: "Low-carb protein waffle (made with almond flour)", lunch: "Quinoa (small portion) with roasted vegetables and baked tofu", dinner: "Baked halibut with steamed green beans", snack: "Sliced avocado with sea salt" }
        ]
      },
      exercise: {
        guidelines: [
          "Consult your doctor before starting this high-intensity regime.",
          "Engage in moderate-intensity, low-impact exercise to safely reduce glucose levels without spiking cortisol.",
          "Always carry a fast-acting carb source (like glucose tablets) in case of hypoglycemia."
        ],
        schedule: "Daily, 30 minutes of low-impact physical activity",
        routine: [
          { 
            phase: "Pre-check & Warm Up", 
            details: "Confirm blood sugar is between 100-250 mg/dL. Warm up with 5-10 minutes of gentle joint rotations.",
            exercises: [
              "Glucotest: Confirm blood sugar range is safe (100 - 250 mg/dL).",
              "Gentle Neck Rolls: Relax neck muscles, 5 rolls each direction.",
              "Seated Ankle Circles: Rotate ankles in circles, 10 reps each side.",
              "Gentle Slow Walk: Walk at a leisurely pace to warm up muscles, 5 minutes."
            ]
          },
          { 
            phase: "Steady Cardio", 
            details: "20 minutes of continuous low-impact walking, stationary cycling, or water aerobics.",
            exercises: [
              "Flat Walking: Walk at a continuous steady pace of 2.0 - 2.5 mph on level surface, 20 mins.",
              "Stationary Cycling: Smooth pedaling with low resistance to maintain heart rate under 110 BPM, 20 mins."
            ]
          },
          { 
            phase: "Flexibility & Cool Down", 
            details: "10 minutes of gentle yoga poses and deep breathing.",
            exercises: [
              "Child's Pose: Hold pose while breathing deeply, 1 minute.",
              "Cat-Cow Stretch: Flex and extend back slowly, 8 repetitions.",
              "Quiet Sitting: Sit comfortably, close eyes, and breathe naturally, 3 minutes."
            ]
          }
        ]
      }
    }
  },
  HEART_DISEASE: {
    LOW: {
      diet: {
        guidelines: [
          "Follow a Mediterranean-style dietary pattern rich in healthy fats (olive oil, walnuts).",
          "Focus on soluble fiber from legumes, oats, and barley to support cholesterol management.",
          "Stay hydrated and prefer home-cooked meals over processed alternatives."
        ],
        weekly: [
          { day: "Monday", breakfast: "Oatmeal cooked in water with walnuts and banana slices", lunch: "Mediterranean salad with chickpeas, olives, and grilled turkey", dinner: "Grilled salmon with quinoa and roasted asparagus", snack: "Handful of dry almonds" },
          { day: "Tuesday", breakfast: "Greek yogurt with a drizzle of honey and flaxseeds", lunch: "Tuna salad wrap with whole-wheat tortilla and spinach", dinner: "Roasted chicken breast with sweet potatoes and broccoli", snack: "Sliced pear" },
          { day: "Wednesday", breakfast: "Whole-grain toast topped with avocado and sliced tomatoes", lunch: "Lentil soup served with a side of mixed greens", dinner: "Sautéed shrimp with garlic, olive oil, and zucchini noodles", snack: "Celery with peanut butter" },
          { day: "Thursday", breakfast: "Smoothie with kale, blueberries, banana, and almond milk", lunch: "Quinoa bowl with mixed roasted vegetables and baked tofu", dinner: "Baked cod with lemon, olive oil, and steamed green beans", snack: "A cup of mixed berries" },
          { day: "Friday", breakfast: "Chia seed pudding with a handful of raspberries", lunch: "Grilled chicken breast over a bed of baby spinach salad", dinner: "Lean turkey meatballs over whole-wheat pasta and marinara", snack: "An orange" },
          { day: "Saturday", breakfast: "Omelet made with two eggs, onions, tomatoes, and spinach", lunch: "Hummus with whole-wheat pita bread and carrot sticks", dinner: "Baked sea bass with steamed cauliflower and garlic kale", snack: "Raw walnuts" },
          { day: "Sunday", breakfast: "Oatmeal topped with sunflower seeds and sliced strawberries", lunch: "Brown rice with grilled bell peppers and chicken breast", dinner: "Stir-fried tofu with mixed vegetables and ginger-garlic sauce", snack: "Sliced apple" }
        ]
      },
      exercise: {
        guidelines: [
          "Focus on moderate-intensity cardiovascular activities to strengthen heart muscles.",
          "Incorporate resistance training at least twice a week."
        ],
        schedule: "5 days a week, 30-45 minutes per session",
        routine: [
          { 
            phase: "Warm Up", 
            details: "10 minutes of low-impact walking and shoulder/arm rolls.",
            exercises: [
              "Arm Swings: Swing arms gently forward and backward, 15 reps.",
              "Shoulder Rolls: Roll shoulders backwards in a full range of motion, 10 reps.",
              "Slow Stroll: Walk at a slow, comfortable pace, 5 minutes."
            ]
          },
          { 
            phase: "Main Cardio Phase", 
            details: "Jogging, brisk walking, swimming, or outdoor cycling at 60-70% of max heart rate.",
            exercises: [
              "Brisk Walking or Jogging: Jog or walk at a pace of 3.5 - 4.5 mph, 25 mins.",
              "Steady Cycling: Ride outdoors or on stationary bicycle, 25 mins."
            ]
          },
          { 
            phase: "Cool Down", 
            details: "5 minutes of light stretching and deep inhalation exercises.",
            exercises: [
              "Quadriceps Stretch: Hold foot behind to stretch thigh, 20 seconds each leg.",
              "Standing Calf Stretch: Stretch calves against wall, 20 seconds each side."
            ]
          }
        ]
      }
    },
    MODERATE: {
      diet: {
        guidelines: [
          "Adhere to DASH diet principles: low sodium (<2000mg/day) and high magnesium.",
          "Restrict red meat intake; prioritize fatty fish (salmon, sardines) and poultry.",
          "Replace solid cooking fats (butter) with liquid plant oils (extra virgin olive oil)."
        ],
        weekly: [
          { day: "Monday", breakfast: "Steel-cut oats with almond butter and blueberries", lunch: "Grilled chicken salad with cucumber, tomato, and vinaigrette", dinner: "Baked trout with brown rice and steamed green beans", snack: "Unsalted pumpkin seeds" },
          { day: "Tuesday", breakfast: "Two boiled eggs with whole-wheat toast (no butter)", lunch: "Lentil stew with a slice of barley bread", dinner: "Grilled chicken breast with roasted carrots and cauliflower", snack: "One fresh peach" },
          { day: "Wednesday", breakfast: "Greek yogurt with sugar-free muesli and berries", lunch: "Tuna salad made with olive oil and served over greens", dinner: "Baked salmon with garlic-sautéed spinach and quinoa", snack: "Baby carrots with hummus" },
          { day: "Thursday", breakfast: "Smoothie with spinach, half an avocado, and oat milk", lunch: "Chickpea salad with parsley, cucumber, and lemon dressing", dinner: "Turkey burgers (no bun) with a roasted beet salad", snack: "Handful of walnuts" },
          { day: "Friday", breakfast: "Oatmeal topped with sliced almonds and cinnamon", lunch: "Quinoa salad with black beans, corn, and cilantro", dinner: "Baked cod served with steamed broccoli and red potatoes", snack: "Apple slices" },
          { day: "Saturday", breakfast: "Oatmeal with unsalted pumpkin seeds", lunch: "Turkey wrap with whole-wheat flatbread and baby spinach", dinner: "Baked chicken breast with roasted cauliflower", snack: "Unsalted sunflower seeds" },
          { day: "Sunday", breakfast: "Chia pudding with sliced banana (unsweetened)", lunch: "Mixed greens with grilled salmon and olive-oil dressing", dinner: "Stir-fried shrimp with baby corn, snow peas, and brown rice", snack: "A cup of grapes" }
        ]
      },
      exercise: {
        guidelines: [
          "Avoid high-intensity bursts of exercise; focus on sustained, steady-state cardiovascular training.",
          "Stop exercising immediately if you feel chest pain, shortness of breath, or dizziness."
        ],
        schedule: "4 days a week, 30-40 minutes per session",
        routine: [
          { 
            phase: "Warm Up", 
            details: "10 minutes of very slow treadmill or outdoor walking, raising heart rate gradually.",
            exercises: [
              "Neck Rotations: Gently tilt and roll head, 5 reps each side.",
              "Arm Circles: Small forward circles increasing to large circles, 15 reps.",
              "Leisurely Walk: Walk at a slow, mindful pace to prepare heart muscles, 5 minutes."
            ]
          },
          { 
            phase: "Aerobic Phase", 
            details: "Stationary cycling, elliptical training, or brisk walking at a controlled pace.",
            exercises: [
              "Controlled Brisk Walking: Walk at a steady pace of 3.0 mph on a level surface, 25 mins.",
              "Stationary Cycling: Maintain cadence of 60 RPM with light resistance, 25 mins."
            ]
          },
          { 
            phase: "Cool Down", 
            details: "10 minutes of gentle yoga stretching and sitting relaxation.",
            exercises: [
              "Hamstring Stretch: Sit and extend one leg, reach forward, hold 20 seconds.",
              "Chest Opener: Clasp hands behind back, pull shoulders back, hold 20 seconds.",
              "Seated Rest: Sit quietly, focusing on slowing heart rate, 3 minutes."
            ]
          }
        ]
      }
    },
    HIGH: {
      diet: {
        guidelines: [
          "Strict DASH diet: Sodium limited to 1500mg/day. Read labels carefully.",
          "Absolutely zero trans fats and minimal saturated fat (<10g/day).",
          "Ensure high dietary intake of potassium, calcium, and magnesium from natural foods."
        ],
        weekly: [
          { day: "Monday", breakfast: "Steel-cut oatmeal (no salt) with ground flaxseeds and strawberries", lunch: "Unsalted lentil salad with cucumber, celery, and olive oil", dinner: "Baked cod with steamed asparagus and cauliflower mash", snack: "Unsalted raw almonds (6-8 pieces)" },
          { day: "Tuesday", breakfast: "Poached egg on unsalted whole-wheat toast with avocado slices", lunch: "Skinless chicken breast with mixed baby greens and vinaigrette", dinner: "Baked wild salmon with garlic spinach (sautéed in water/olive oil)", snack: "One small red apple" },
          { day: "Wednesday", breakfast: "Unsweetened Greek yogurt with 5 blueberries and walnuts", lunch: "Quinoa bowl with black beans (no salt added) and bell peppers", dinner: "Baked turkey breast with roasted zucchini and yellow squash", snack: "Cucumber slices" },
          { day: "Thursday", breakfast: "Green smoothie with celery, spinach, green apple, and water", lunch: "Tuna salad (canned in water, low sodium) with spinach", dinner: "Baked halibut with steamed green beans and sweet potato mash", snack: "1/4 cup raspberries" },
          { day: "Friday", breakfast: "Chia pudding made with unsweetened soy milk", lunch: "Mediterranean chickpea salad (unsalted) with olive oil", dinner: "Roasted chicken breast (skinless) with broccoli", snack: "Celery sticks with almond butter" },
          { day: "Saturday", breakfast: "Egg white scramble with onions and bell peppers", lunch: "Turkey lettuce wraps (no sodium seasoning, use herbs)", dinner: "Baked sea bass with steamed kale and carrots", snack: "Raw pumpkin seeds" },
          { day: "Sunday", breakfast: "Oatmeal with sliced banana and a pinch of cinnamon", lunch: "Brown rice with grilled tofu and roasted Brussels sprouts", dinner: "Pan-seared cod with garlic, parsley, and steamed zucchini", snack: "A fresh peach" }
        ]
      },
      exercise: {
        guidelines: [
          "Consult your cardiologist for a formal stress test before starting any program.",
          "Keep target heart rate below your customized safe threshold (typically <110 BPM).",
          "Avoid isometric exercises (e.g. planks) or lifting heavy weights, as they raise blood pressure sharply."
        ],
        schedule: "Daily, 20-30 minutes of light physical activity",
        routine: [
          { 
            phase: "Warm Up", 
            details: "10 minutes of gentle range-of-motion exercises and light indoor stroll.",
            exercises: [
              "Gentle Shoulder Shrugs: Shrug up and down slowly, 10 reps.",
              "Seated Ankle Rotations: Rotate ankles gently clockwise and counter-clockwise, 10 reps each.",
              "Slow Indoor Stroll: Walk around the room or on flat surface at a very slow pace, 5 minutes."
            ]
          },
          { 
            phase: "Gentle Exercise", 
            details: "Level-surface walking at a conversational pace (you should easily be able to talk).",
            exercises: [
              "Conversational Walking: Walk on flat surfaces at 1.5 - 2.0 mph. Stop if breathing becomes heavy, 15 mins.",
              "Seated Leg Lifts: Alternating leg extensions from a chair to keep circulation active, 10 reps per side."
            ]
          },
          { 
            phase: "Cool Down", 
            details: "10 minutes of sitting meditation and breathing control exercises.",
            exercises: [
              "Seated Hamstring Stretch: Extend leg while seated, hold for 20 seconds gently.",
              "Deep Breathing Meditation: Sit back, close eyes, inhale/exhale slowly to steady blood flow, 5 minutes."
            ]
          }
        ]
      }
    }
  },
  LIVER_DISEASE: {
    LOW: {
      diet: {
        guidelines: [
          "Maintain optimal hydration (8-10 glasses of water daily).",
          "Consume foods rich in natural antioxidants (blueberries, green tea, leafy greens).",
          "Minimize processed foods, deep-fried dishes, and refined sugar."
        ],
        weekly: [
          { day: "Monday", breakfast: "Oatmeal with almonds and sliced apple", lunch: "Grilled chicken over mixed greens with lemon-olive oil dressing", dinner: "Baked salmon with quinoa and steamed broccoli", snack: "A cup of green tea and walnuts" },
          { day: "Tuesday", breakfast: "Scrambled eggs with tomatoes and whole-wheat toast", lunch: "Turkey and spinach wrap in whole-grain flatbread", dinner: "Stir-fried tofu with bell peppers, onions, and brown rice", snack: "Greek yogurt with berries" },
          { day: "Wednesday", breakfast: "Smoothie with spinach, banana, ginger, and almond milk", lunch: "Lentil soup with a side green salad", dinner: "Grilled cod with asparagus and a small baked potato", snack: "Sliced carrots with hummus" },
          { day: "Thursday", breakfast: "Chia pudding with sliced strawberries", lunch: "Quinoa bowl with mixed roasted vegetables and black beans", dinner: "Baked chicken breast with roasted Brussels sprouts", snack: "Apple slices with almond butter" },
          { day: "Friday", breakfast: "Greek yogurt with pumpkin seeds and honey", lunch: "Tuna salad wraps with lettuce leaf wraps", dinner: "Lean beef sirloin (limited) with cauliflower mash", snack: "Handful of almonds" },
          { day: "Saturday", breakfast: "Omelet with spinach, onions, and mushrooms", lunch: "Mediterranean chickpea salad", dinner: "Baked chicken thighs with garlic sautéed kale", snack: "Mixed fresh fruit cup" },
          { day: "Sunday", breakfast: "Whole-wheat toast with mashed avocado and poached egg", lunch: "Brown rice with grilled vegetables and edamame", dinner: "Baked halibut with roasted zucchini", snack: "A cup of unsweetened black tea" }
        ]
      },
      exercise: {
        guidelines: [
          "Regular aerobic exercise helps prevent fatty liver accumulation (hepatic steatosis).",
          "Keep body mass index within healthy ranges through active living."
        ],
        schedule: "5 days a week, 30-40 minutes per session",
        routine: [
          { 
            phase: "Warm Up", 
            details: "5-10 minutes of walking and general stretching.",
            exercises: [
              "Dynamic Arm Rotations: Swing arms side-to-side, 15 reps.",
              "Hip Circles: Rotate hips clockwise and counter-clockwise, 10 reps each.",
              "Light Walk: General slow-paced walking to warm up, 5 minutes."
            ]
          },
          { 
            phase: "Moderate Cardio", 
            details: "Brisk walking, jogging, cycling, or tennis.",
            exercises: [
              "Brisk Walking or Light Jogging: Walk/jog continuously at 3.5 mph, 25 mins.",
              "Stationary Cycling: Maintain pedaling at 65 RPM, 20 mins."
            ]
          },
          { 
            phase: "Cool Down", 
            details: "5 minutes of light stretching and breathing exercises.",
            exercises: [
              "Hamstring Stretch: Reach down toward toes while standing or sitting, hold 20 seconds.",
              "Calf Stretch: Step back and press heel down, hold 20 seconds."
            ]
          }
        ]
      }
    },
    MODERATE: {
      diet: {
        guidelines: [
          "Increase dietary fiber from oats, beans, and fresh vegetables to bind toxins.",
          "Restrict saturated fats; focus on monounsaturated fats (avocado, olive oil).",
          "Avoid all alcoholic beverages and limit high-fructose corn syrup entirely."
        ],
        weekly: [
          { day: "Monday", breakfast: "Unsweetened steel-cut oats with walnuts and cinnamon", lunch: "Spinach salad with grilled chicken and olive oil dressing", dinner: "Baked salmon with steamed broccoli and cauliflower rice", snack: "1 boiled egg" },
          { day: "Tuesday", breakfast: "Scrambled egg whites with spinach and tomato", lunch: "Chickpea salad with cucumber and lemon dressing", dinner: "Grilled chicken breast with roasted asparagus and sweet potato", snack: "Sliced cucumber with hummus" },
          { day: "Wednesday", breakfast: "Green smoothie (spinach, avocado, ginger, unsweetened almond milk)", lunch: "Lentil soup with a side green salad", dinner: "Pan-seared cod with sautéed kale and garlic", snack: "Handful of walnuts" },
          { day: "Thursday", breakfast: "Greek yogurt with ground flaxseeds", lunch: "Quinoa bowl with mixed greens and grilled tofu", dinner: "Baked turkey breast with roasted zucchini", snack: "A small orange" },
          { day: "Friday", breakfast: "Oat bran hot cereal with pumpkin seeds", lunch: "Tuna salad with olive oil and mixed baby greens", dinner: "Steamed tilapia with green beans", snack: "Bell pepper strips" },
          { day: "Saturday", breakfast: "Omelet with avocado and salsa", lunch: "Black bean soup with a side salad", dinner: "Baked chicken breast with roasted cauliflower", snack: "Dry-roasted cashews" },
          { day: "Sunday", breakfast: "Whole-grain toast with mashed avocado", lunch: "Mediterranean salad with baked tofu", dinner: "Baked sea bass with steamed broccoli", snack: "A cup of raspberries" }
        ]
      },
      exercise: {
        guidelines: [
          "Aim for steady weight reduction if diagnosed with Non-Alcoholic Fatty Liver Disease (NAFLD).",
          "Incorporate both aerobic exercise and light resistance training."
        ],
        schedule: "4 days a week, 45 minutes per session",
        routine: [
          { 
            phase: "Warm Up", 
            details: "10 minutes of low-impact walking and arm movements.",
            exercises: [
              "Shoulder Circles: Roll shoulders slowly, 15 reps.",
              "Torso Twists: Twist upper body gently side to side, 10 reps each direction.",
              "Slow Walking: Pace slowly to gradually increase cardiac output, 5 minutes."
            ]
          },
          { 
            phase: "Aerobic & Fat Burn", 
            details: "30 minutes of moderate-intensity cycling, brisk walking, or swimming.",
            exercises: [
              "Steady Elliptical or Walk: Keep a steady fat-burning pace, 30 mins.",
              "Moderate Swimming: Swim at a comfortable continuous pace, 20 mins."
            ]
          },
          { 
            phase: "Cool Down", 
            details: "5 minutes of flexibility stretching.",
            exercises: [
              "Seated Hamstring Stretch: Hold stretch gently for 20 seconds.",
              "Cobra Stretch: Lie on stomach and gently lift chest to stretch core, hold 15 seconds."
            ]
          }
        ]
      }
    },
    HIGH: {
      diet: {
        guidelines: [
          "Restricted sodium intake (<2000mg/day) to prevent ascites (fluid build-up).",
          "Ensure adequate, high-quality, easily digestible proteins (fish, egg whites, plant protein).",
          "Strict zero alcohol policy. Eliminate all processed or chemically preserved foods."
        ],
        weekly: [
          { day: "Monday", breakfast: "Oatmeal with ground flaxseeds and fresh strawberries (no salt)", lunch: "Tossed green salad with grilled chicken breast and olive oil", dinner: "Baked wild-caught salmon with lemon and roasted asparagus", snack: "1/4 cup unsalted walnuts" },
          { day: "Tuesday", breakfast: "Greek yogurt (low fat, unsweetened) with chia seeds", lunch: "Tofu stir-fry with broccoli, cabbage, and cauliflower rice", dinner: "Baked cod with sautéed spinach and garlic", snack: "Celery sticks with almond butter" },
          { day: "Wednesday", breakfast: "Three egg-white omelet with spinach and mushrooms", lunch: "Turkey breast lettuce wraps with mustard", dinner: "Grilled chicken thighs with roasted Brussels sprouts", snack: "One boiled egg" },
          { day: "Thursday", breakfast: "Chia pudding with unsweetened almond milk and vanilla", lunch: "Lentil stew (low sodium) with cucumber slices", dinner: "Baked shrimp with zucchini noodles and garlic", snack: "Handful of pecans" },
          { day: "Friday", breakfast: "Spinach, avocado, and soy protein shake (unsweetened)", lunch: "Tuna salad over mixed greens (olive oil dressing)", dinner: "Baked halibut with steamed green beans", snack: "Pumpkin seeds" },
          { day: "Saturday", breakfast: "Scrambled egg whites with smoked salmon and asparagus", lunch: "Mediterranean salad with limited chickpeas and cucumbers", dinner: "Baked chicken breast with garlic sautéed kale", snack: "A few fresh strawberries" },
          { day: "Sunday", breakfast: "Low-carb protein waffle (almond flour base)", lunch: "Quinoa with roasted vegetables and baked tofu", dinner: "Baked cod with steamed broccoli", snack: "Sliced avocado" }
        ]
      },
      exercise: {
        guidelines: [
          "Conserve energy if experiencing chronic fatigue. Do not push to exhaustion.",
          "Avoid activities with a high risk of falls or abdominal impact.",
          "Keep physical activities to low-intensity, restorative routines."
        ],
        schedule: "Daily, 15-20 minutes of light mobility",
        routine: [
          { 
            phase: "Warm Up", 
            details: "5 minutes of seated breathing and neck/shoulder rotations.",
            exercises: [
              "Deep Seated Breathing: Sit upright and breathe deeply to oxygenate blood, 2 minutes.",
              "Neck Tilts: Gently tilt head side-to-side, hold 5 seconds each, 5 reps per side.",
              "Shoulder Shrugs: Soft lifting and releasing of shoulders, 10 reps."
            ]
          },
          { 
            phase: "Light Mobility", 
            details: "Gentle flat-surface walking or seated leg lifts.",
            exercises: [
              "Leisurely Walking: Slow pacing on level ground, 10 minutes.",
              "Seated Knee Raises: Lift knees alternately while seated to improve circulation, 10 reps per side."
            ]
          },
          { 
            phase: "Relaxation", 
            details: "10 minutes of restorative stretching.",
            exercises: [
              "Child's Pose: Hold pose to rest back and joints, 2 minutes.",
              "Seated Forward Fold: Gently lean forward over legs to stretch lower back, hold 20 seconds."
            ]
          }
        ]
      }
    }
  },
  KIDNEY_DISEASE: {
    LOW: {
      diet: {
        guidelines: [
          "Avoid excessive protein intake; maintain balanced portions.",
          "Limit consumption of processed foods high in sodium and chemical preservatives.",
          "Stay hydrated, but do not excessively load fluids."
        ],
        weekly: [
          { day: "Monday", breakfast: "Oatmeal with berries and a sprinkle of pumpkin seeds", lunch: "Grilled chicken salad with olive oil dressing", dinner: "Baked salmon with quinoa and steamed green beans", snack: "A red apple" },
          { day: "Tuesday", breakfast: "Scrambled eggs with spinach and whole-wheat toast", lunch: "Turkey and cucumber wrap in whole-grain flatbread", dinner: "Stir-fried tofu with mixed vegetables and white rice", snack: "Greek yogurt with a few blueberries" },
          { day: "Wednesday", breakfast: "Smoothie with spinach, banana, and rice milk", lunch: "Lentil soup with a side green salad", dinner: "Grilled cod with asparagus and a small baked potato", snack: "Sliced carrots" },
          { day: "Thursday", breakfast: "Chia pudding with sliced strawberries", lunch: "Quinoa bowl with mixed roasted vegetables", dinner: "Baked chicken breast with roasted zucchini", snack: "Apple slices" },
          { day: "Friday", breakfast: "Greek yogurt with flaxseeds and honey", lunch: "Tuna salad wraps with lettuce leaf wraps", dinner: "Lean turkey meatballs with white rice", snack: "Handful of almonds" },
          { day: "Saturday", breakfast: "Omelet with spinach, onions, and mushrooms", lunch: "Mediterranean chickpea salad", dinner: "Baked chicken thighs with garlic sautéed kale", snack: "Mixed fresh fruit cup" },
          { day: "Sunday", breakfast: "Whole-wheat toast with mashed avocado and poached egg", lunch: "Brown rice with grilled vegetables and edamame", dinner: "Baked tilapia with roasted zucchini", snack: "A cup of unsweetened herbal tea" }
        ]
      },
      exercise: {
        guidelines: [
          "Regular physical activity helps control blood pressure, which is vital for kidney health.",
          "Aim for moderate-intensity fitness routines."
        ],
        schedule: "5 days a week, 30 minutes per session",
        routine: [
          { 
            phase: "Warm Up", 
            details: "5 minutes of dynamic stretching.",
            exercises: [
              "Arm Swings: Swing arms side to side across chest, 15 reps.",
              "Gentle Torso Twists: Slowly twist upper body, 10 reps.",
              "Leisurely Walk: Walking at slow pace, 3 minutes."
            ]
          },
          { 
            phase: "Moderate Aerobics", 
            details: "Brisk walking, stationary cycling, or light swimming.",
            exercises: [
              "Brisk Walking: Walk at 3.0 - 3.2 mph on flat surfaces, 20 mins.",
              "Stationary Cycling: Pedaling at 60 RPM with light resistance, 20 mins."
            ]
          },
          { 
            phase: "Cool Down", 
            details: "5 minutes of slow walking and stretching.",
            exercises: [
              "Standing Calf Stretch: Press heel to floor, hold 20 seconds per side.",
              "Hamstring Stretch: Lean forward with straight leg, hold 20 seconds."
            ]
          }
        ]
      }
    },
    MODERATE: {
      diet: {
        guidelines: [
          "Restrict sodium to <2000mg/day to manage blood pressure.",
          "Limit phosphorus intake (reduce dairy, nuts, beans, and dark colas).",
          "Prioritize high-quality proteins in moderate portions (egg whites, poultry, fish)."
        ],
        weekly: [
          { day: "Monday", breakfast: "Oatmeal (made with water) with sliced apples and cinnamon", lunch: "Chicken salad with lettuce, cucumbers, and olive oil", dinner: "Baked cod with white rice and steamed green beans", snack: "Unsalted popcorn" },
          { day: "Tuesday", breakfast: "Two egg whites scrambled with bell peppers and toast", lunch: "Turkey breast wrap with white flour tortilla and lettuce", dinner: "Baked chicken breast with carrots and cabbage", snack: "Red grapes" },
          { day: "Wednesday", breakfast: "Greek yogurt (limited portion) with honey", lunch: "Quinoa bowl with roasted squash and zucchini", dinner: "Baked salmon with steamed broccoli (limited) and rice", snack: "Sliced cucumber" },
          { day: "Thursday", breakfast: "Rice milk smoothie with blueberries and vanilla protein", lunch: "Tuna salad over mixed greens (olive oil dressing)", dinner: "Baked turkey cutlet with white rice and cauliflower", snack: "A fresh pear" },
          { day: "Friday", breakfast: "Chia seed pudding with rice milk and raspberries", lunch: "Couscous salad with chopped cucumbers and parsley", dinner: "Baked tilapia with roasted yellow squash", snack: "Strawberries" },
          { day: "Saturday", breakfast: "Egg white omelet with mushrooms and onions", lunch: "Boiled egg with sliced carrots and a small piece of pita", dinner: "Baked chicken thighs (skinless) with steamed green beans", snack: "Pineapple slices" },
          { day: "Sunday", breakfast: "Oatmeal topped with sliced strawberries", lunch: "Tossed green salad with grilled shrimp and lemon", dinner: "Baked sea bass with steamed zucchini and white rice", snack: "A red apple" }
        ]
      },
      exercise: {
        guidelines: [
          "Keep workouts to a moderate intensity level; avoid excessive fatigue.",
          "Ensure adequate hydration during physical exertion, as advised by your doctor."
        ],
        schedule: "4 days a week, 35 minutes per session",
        routine: [
          { 
            phase: "Warm Up", 
            details: "10 minutes of slow walking and joint range-of-motion movements.",
            exercises: [
              "Shoulder Circles: Roll shoulders back and forth slowly, 12 reps.",
              "Side Bends: Lean slowly side to side with hands on hips, 10 reps each direction.",
              "Leisurely Pacing: Walk slowly to prepare the heart, 5 minutes."
            ]
          },
          { 
            phase: "Cardio & Strength", 
            details: "20 minutes of brisk walking followed by 5 minutes of light dumbbell exercises.",
            exercises: [
              "Controlled Brisk Walk: Walk at a moderate pace, 20 mins.",
              "Light Dumbbell Curls: Use 2-5 lb weights to build arm strength, 2 sets of 10 reps."
            ]
          },
          { 
            phase: "Cool Down", 
            details: "10 minutes of static stretches and deep breathing.",
            exercises: [
              "Wall Calf Stretch: Lean against wall and push heel down, hold 20 seconds.",
              "Seated Hamstring Fold: Reach forward gently from a chair, hold 20 seconds.",
              "Deep Breathing: 5 slow diaphragmatic breaths to settle circulation."
            ]
          }
        ]
      }
    },
    HIGH: {
      diet: {
        guidelines: [
          "Strict renal diet: Limit sodium (<1500mg/day), potassium, and phosphorus.",
          "Avoid high-potassium foods (bananas, potatoes, tomatoes, oranges, spinach).",
          "Strictly control protein intake to reduce kidney load. Prefer egg whites and limited poultry."
        ],
        weekly: [
          { day: "Monday", breakfast: "Cream of wheat (no salt) with sliced strawberries", lunch: "Grilled chicken breast (2 oz) over iceberg lettuce and cucumber", dinner: "Baked cod with white rice and steamed green beans", snack: "Sliced red apple" },
          { day: "Tuesday", breakfast: "Two egg whites scrambled with green bell peppers (no salt)", lunch: "Turkey breast wrap with white flour tortilla and lettuce", dinner: "Baked chicken breast (2 oz) with carrots and cabbage", snack: "Red grapes (10 pieces)" },
          { day: "Wednesday", breakfast: "Chia pudding made with unsweetened rice milk", lunch: "Tuna salad (low sodium, in water) over iceberg lettuce", dinner: "Baked shrimp (limited) with white pasta, garlic, and olive oil", snack: "Cucumber slices" },
          { day: "Thursday", breakfast: "Rice milk smoothie with blueberries", lunch: "Couscous with roasted yellow squash and olive oil", dinner: "Baked pork chop (lean, unsalted, 2 oz) with white rice", snack: "Sliced pineapple" },
          { day: "Friday", breakfast: "Oatmeal (cooked in water) with a few raspberries", lunch: "Egg white salad (no yolk) with celery and low-sodium bread", dinner: "Baked tilapia (2 oz) with steamed cauliflower", snack: "A fresh pear" },
          { day: "Saturday", breakfast: "Unsalted rice cake with a thin layer of cream cheese", lunch: "Turkey breast slices (2 oz) with cabbage salad", dinner: "Baked sea bass (2 oz) with zucchini and white rice", snack: "Blueberries" },
          { day: "Sunday", breakfast: "Cream of wheat with sliced strawberries", lunch: "White rice with roasted carrots and baked tofu (2 oz)", dinner: "Baked chicken breast (2 oz) with green beans", snack: "A fresh peach" }
        ]
      },
      exercise: {
        guidelines: [
          "Obtain medical clearance before exercise, especially if undergoing dialysis.",
          "Avoid heavy lifting or intensive cardiovascular stress.",
          "Workout on non-dialysis days if applicable, and stop immediately if feeling weak or dizzy."
        ],
        schedule: "3-4 days a week, 20-30 minutes of gentle exercise",
        routine: [
          { 
            phase: "Warm Up", 
            details: "10 minutes of gentle seated stretching and breathing.",
            exercises: [
              "Seated Deep Breathing: Inhale and exhale slowly to align focus, 3 minutes.",
              "Seated Neck Rolls: Tilt head gently side-to-side, 5 reps per side.",
              "Seated Arm Raises: Raise arms slowly to shoulder height, 10 reps."
            ]
          },
          { 
            phase: "Gentle Activity", 
            details: "Slow flat-surface walking or stationary cycling with low resistance.",
            exercises: [
              "Slow Walking: Pace slowly on level ground (conversational pace), 15 mins.",
              "Seated Knee Extensions: Straighten leg slowly from chair, 10 reps each leg."
            ]
          },
          { 
            phase: "Cool Down", 
            details: "10 minutes of restorative stretching and resting.",
            exercises: [
              "Gentle Seated Fold: Lean forward slowly to stretch back, hold 20 seconds.",
              "Quiet Sitting: Sit in relaxed posture with closed eyes, 4 minutes."
            ]
          }
        ]
      }
    }
  },
  THYROID_DISEASE: {
    LOW: {
      diet: {
        guidelines: ["Consume iodine-rich foods (seafood, dairy) and selenium (Brazil nuts).", "Limit raw goitrogens like cabbage and kale.", "Maintain regular hydration."],
        weekly: [
          { day: "Monday", breakfast: "Scrambled eggs and fruit", lunch: "Chicken breast salad", dinner: "Baked salmon with quinoa", snack: "Brazil nuts" },
          { day: "Tuesday", breakfast: "Oatmeal with berries", lunch: "Tuna wrap", dinner: "Turkey stir-fry", snack: "Greek yogurt" },
          { day: "Wednesday", breakfast: "Greek yogurt with pumpkin seeds", lunch: "Quinoa bowl with spinach", dinner: "Grilled chicken with asparagus", snack: "Apple slices" },
          { day: "Thursday", breakfast: "Egg white omelet", lunch: "Lentil soup", dinner: "Baked cod with broccoli", snack: "Walnuts" },
          { day: "Friday", breakfast: "Chia pudding", lunch: "Turkey salad", dinner: "Salmon with sweet potato", snack: "Pumpkin seeds" },
          { day: "Saturday", breakfast: "Avocado toast with egg", lunch: "Chickpea salad", dinner: "Baked chicken and green beans", snack: "Mixed berries" },
          { day: "Sunday", breakfast: "Fruit smoothie with protein", lunch: "Brown rice and grilled tofu", dinner: "Baked tilapia", snack: "Pear slices" }
        ]
      },
      exercise: {
        guidelines: ["Perform moderate aerobic exercise to stimulate metabolic rate.", "Incorporate yoga to support endocrine balance."],
        schedule: "5 days a week, 30 minutes",
        routine: [
          { phase: "Warm Up", details: "Light stretching", exercises: ["Neck Rolls: 10 reps", "Shoulder Rolls: 10 reps", "Torso Twists: 10 reps"] },
          { phase: "Aerobic Phase", details: "Brisk walking or cycling", exercises: ["Brisk Walking: 20 mins", "Stationary Cycling: 20 mins"] },
          { phase: "Cool Down", details: "Gentle static stretches", exercises: ["Seated Hamstring Fold: 20 seconds", "Deep Breathing: 5 breaths"] }
        ]
      }
    },
    MODERATE: {
      diet: {
        guidelines: ["Restrict gluten if thyroid antibodies are present.", "Prioritize zinc and selenium rich foods.", "Minimize processed foods and sugars."],
        weekly: [
          { day: "Monday", breakfast: "Gluten-free oatmeal", lunch: "Grilled chicken breast with greens", dinner: "Baked cod and asparagus", snack: "Walnuts" },
          { day: "Tuesday", breakfast: "Two boiled eggs with spinach", lunch: "Tuna salad over kale", dinner: "Turkey meatballs with zucchini", snack: "Celery with peanut butter" },
          { day: "Wednesday", breakfast: "Smoothie with rice milk and protein", lunch: "Lentil salad", dinner: "Baked salmon and broccoli", snack: "Brazil nuts" },
          { day: "Thursday", breakfast: "Chia seed pudding", lunch: "Chicken avocado wrap", dinner: "Beef sirloin with cauliflower", snack: "Apple" },
          { day: "Friday", breakfast: "Greek yogurt with flaxseeds", lunch: "Quinoa salad with veggies", dinner: "Pan-seaer trout with green beans", snack: "Carrots with hummus" },
          { day: "Saturday", breakfast: "Omelet with mushrooms", lunch: "Black bean soup", dinner: "Roasted chicken with zucchini", snack: "Pumpkin seeds" },
          { day: "Sunday", breakfast: "Sweet potato toast with egg", lunch: "Mediterranean salad", dinner: "Baked tilapia with spinach", snack: "Raspberries" }
        ]
      },
      exercise: {
        guidelines: ["Combine cardio with light strength training to maintain muscle mass.", "Track resting heart rate weekly."],
        schedule: "4 days a week, 35 minutes",
        routine: [
          { phase: "Warm Up", details: "Joint mobility movements", exercises: ["Shoulder Rotations: 10 reps", "Arm Circles: 10 reps", "Slow Walk: 5 mins"] },
          { phase: "Strength & Cardio", details: "Aerobics followed by bodyweight work", exercises: ["Brisk Walking: 20 mins", "Bodyweight Squats: 2 sets of 10", "Wall Pushups: 2 sets of 10"] },
          { phase: "Cool Down", details: "Mindful breathing and stretching", exercises: ["Calf Stretch: 20 seconds", "Diaphragmatic Breathing: 3 mins"] }
        ]
      }
    },
    HIGH: {
      diet: {
        guidelines: ["Avoid all raw cruciferous vegetables (must be cooked).", "Incorporate thyroid-supporting nutrients under guidance.", "Eliminate soy-based products as they may interfere with hormone absorption."],
        weekly: [
          { day: "Monday", breakfast: "Poached egg on gluten-free toast", lunch: "Steamed chicken with cooked carrots", dinner: "Baked salmon with roasted squash", snack: "Pecans" },
          { day: "Tuesday", breakfast: "Greek yogurt with blueberries", lunch: "Tofu cooked stir-fry", dinner: "Baked cod and asparagus", snack: "Pumpkin seeds" },
          { day: "Wednesday", breakfast: "Scrambled eggs with cooked spinach", lunch: "Lentil soup (well-cooked)", dinner: "Chicken breast with zucchini", snack: "Cucumber slices" },
          { day: "Thursday", breakfast: "Chia seed pudding", lunch: "Tuna salad with olive oil", dinner: "Baked shrimp with zucchini noodles", snack: "Walnuts" },
          { day: "Friday", breakfast: "Protein shake with almond milk", lunch: "Turkey lettuce wraps", dinner: "Lean pork with cauliflower mash", snack: "Sunflower seeds" },
          { day: "Saturday", breakfast: "Omelet with cooked mushrooms", lunch: "Mediterranean salad (no raw broccoli)", dinner: "Baked chicken and kale", snack: "Strawberries" },
          { day: "Sunday", breakfast: "Gluten-free protein waffle", lunch: "Quinoa with cooked carrots", dinner: "Baked tilapia with green beans", snack: "Avocado" }
        ]
      },
      exercise: {
        guidelines: ["Avoid overexertion due to metabolic fatigue.", "Stick to low-intensity restorative exercises."],
        schedule: "Daily, 20 minutes",
        routine: [
          { phase: "Warm Up", details: "Gentle neck and joint rotations", exercises: ["Neck Tilts: 5 reps", "Ankle Circles: 10 reps", "Gentle Walk: 5 mins"] },
          { phase: "Gentle Cardio", details: "Low-impact walking", exercises: ["Flat walking: 15 mins", "Seated leg lifts: 10 reps"] },
          { phase: "Cool Down", details: "Restorative poses", exercises: ["Child's Pose: 1 min", "Quiet Sitting: 3 mins"] }
        ]
      }
    }
  },
  PULMONARY_DISEASE: {
    LOW: {
      diet: {
        guidelines: ["Consume healthy fats over carbohydrates to reduce CO2 output.", "Prefer small, frequent meals to prevent breathing restriction.", "Ensure high dietary antioxidant intake."],
        weekly: [
          { day: "Monday", breakfast: "Avocado and eggs", lunch: "Chicken breast with green salad", dinner: "Salmon with asparagus", snack: "Almonds" },
          { day: "Tuesday", breakfast: "Chia pudding with coconut milk", lunch: "Tuna wrap in low-carb flatbread", dinner: "Turkey stir-fry with broccoli", snack: "Greek yogurt" },
          { day: "Wednesday", breakfast: "Protein shake with spinach and avocado", lunch: "Quinoa bowl with olive oil", dinner: "Grilled shrimp and zucchini", snack: "Walnuts" },
          { day: "Thursday", breakfast: "Scrambled eggs with tomatoes", lunch: "Lentil soup", dinner: "Baked cod with kale", snack: "Pumpkin seeds" },
          { day: "Friday", breakfast: "Greek yogurt with walnuts", lunch: "Turkey lettuce wraps", dinner: "Salmon with cauliflower mash", snack: "Celery with peanut butter" },
          { day: "Saturday", breakfast: "Omelet with onions and spinach", lunch: "Mediterranean chickpea salad", dinner: "Chicken thighs with green beans", snack: "Mixed berries" },
          { day: "Sunday", breakfast: "Low-carb pancakes", lunch: "Tofu stir-fry", dinner: "Baked tilapia with squash", snack: "Macadamia nuts" }
        ]
      },
      exercise: {
        guidelines: ["Focus on breathing exercises to improve lung capacity.", "Avoid exercise outdoors in cold or highly polluted air."],
        schedule: "5 days a week, 30 minutes",
        routine: [
          { phase: "Warm Up", details: "Gentle stretching and deep breaths", exercises: ["Neck Rolls: 5 reps", "Pursed-lip Breathing: 5 cycles", "Arm Swings: 10 reps"] },
          { phase: "Cardio", details: "Brisk walking or cycling", exercises: ["Brisk Walking: 20 mins", "Stationary Cycling: 20 mins"] },
          { phase: "Cool Down", details: "Stretching and relaxation", exercises: ["Hamstring Stretch: 20 seconds", "Calf Stretch: 20 seconds", "Deep Breathing: 5 breaths"] }
        ]
      }
    },
    MODERATE: {
      diet: {
        guidelines: ["Limit sodium to avoid fluid retention in lung tissues.", "Focus on low-carb, high-fat keto-friendly foods.", "Drink fluids between meals rather than during them."],
        weekly: [
          { day: "Monday", breakfast: "Scrambled eggs in olive oil", lunch: "Turkey salad with avocado", dinner: "Baked cod and asparagus", snack: "Pecans" },
          { day: "Tuesday", breakfast: "Chia pudding with almond milk", lunch: "Tuna salad over mixed greens", dinner: "Chicken breast with green beans", snack: "Celery with cream cheese" },
          { day: "Wednesday", breakfast: "Greek yogurt with flaxseeds", lunch: "Lentil stew (low sodium)", dinner: "Baked salmon and broccoli", snack: "Walnuts" },
          { day: "Thursday", breakfast: "Protein shake with peanut butter", lunch: "Quinoa salad with cucumbers", dinner: "Turkey meatballs with cabbage", snack: "Apple" },
          { day: "Friday", breakfast: "Omelet with spinach and mushrooms", lunch: "Tuna wrap", dinner: "Baked trout with cauliflower", snack: "Sunflower seeds" },
          { day: "Saturday", breakfast: "Avocado toast on low-carb bread", lunch: "Chickpea soup", dinner: "Roasted chicken with zucchini", snack: "Pumpkin seeds" },
          { day: "Sunday", breakfast: "Two boiled eggs", lunch: "Mediterranean tofu salad", dinner: "Baked tilapia with spinach", snack: "Raspberries" }
        ]
      },
      exercise: {
        guidelines: ["Integrate pursed-lip breathing with cardiovascular training.", "Use a pulse oximeter to ensure SpO2 stays above 90% during exercises."],
        schedule: "4 days a week, 35 minutes",
        routine: [
          { phase: "Warm Up", details: "Pursed-lip breathing and arm rolls", exercises: ["Pursed-lip Breathing: 5 cycles", "Shoulder Rolls: 10 reps", "Torso Twists: 10 reps"] },
          { phase: "Aerobic & Breathing", details: "Controlled paced walking", exercises: ["Controlled Walk: 25 mins", "Diaphragmatic Breathing: 5 mins"] },
          { phase: "Cool Down", details: "Stretches", exercises: ["Chest Opener Stretch: 20 seconds", "Wall Calf Stretch: 20 seconds"] }
        ]
      }
    },
    HIGH: {
      diet: {
        guidelines: ["Follow strict low-sodium guidelines (<1500mg/day).", "Eat energy-dense, easy-to-chew foods to prevent dyspnea while eating.", "Supplement with Vitamin D and Calcium if bone health is compromised by steroid therapies."],
        weekly: [
          { day: "Monday", breakfast: "Poached eggs and avocado", lunch: "Skinless chicken with soft vegetables", dinner: "Baked cod with sweet potato mash", snack: "Unsalted walnuts" },
          { day: "Tuesday", breakfast: "Oatmeal cooked in water with cinnamon", lunch: "Tofu cooked in olive oil with squash", dinner: "Baked salmon and asparagus", snack: "Cucumber slices" },
          { day: "Wednesday", breakfast: "Three egg whites scrambled", lunch: "Lentil soup (unsalted)", dinner: "Turkey breast with soft zucchini", snack: "Celery sticks" },
          { day: "Thursday", breakfast: "Chia seed pudding", lunch: "Tuna salad in lettuce wraps", dinner: "Baked shrimp with soft noodles", snack: "Pecans" },
          { day: "Friday", breakfast: "Unsweetened Greek yogurt", lunch: "Chicken breast with green beans", dinner: "Baked halibut with cauliflower mash", snack: "Sunflower seeds" },
          { day: "Saturday", breakfast: "Scrambled egg whites with salmon", lunch: "Quinoa with carrots", dinner: "Baked chicken thighs with spinach", snack: "Strawberries" },
          { day: "Sunday", breakfast: "Low-carb protein shake", lunch: "Tofu with roasted carrots", dinner: "Pan-seared cod with zucchini", snack: "Avocado" }
        ]
      },
      exercise: {
        guidelines: ["Exercise strictly under supplemental oxygen if prescribed.", "Stop immediately if dyspnea index goes above comfortable conversational limits.", "Focus on gentle seated mobility."],
        schedule: "Daily, 15-20 minutes",
        routine: [
          { phase: "Warm Up", details: "Seated breathing and arm raises", exercises: ["Deep Seated Breathing: 3 mins", "Neck Tilts: 5 reps", "Shoulder Shrugs: 10 reps"] },
          { phase: "Gentle Activity", details: "Seated movements", exercises: ["Slow Indoor Walking: 10 mins", "Seated Knee Extensions: 10 reps per side"] },
          { phase: "Cool Down", details: "Relaxation", exercises: ["Child's Pose: 2 mins", "Quiet Seated Rest: 4 mins"] }
        ]
      }
    }
  },
  STROKE: {
    LOW: {
      diet: {
        guidelines: ["Maintain a Mediterranean diet rich in whole grains, fruits, and vegetables.", "Focus on low-saturated fat proteins (poultry, fish).", "Keep sodium intake below 2300mg/day."],
        weekly: [
          { day: "Monday", breakfast: "Oatmeal with almonds and banana", lunch: "Turkey and spinach whole-wheat wrap", dinner: "Baked salmon with quinoa", snack: "Greek yogurt" },
          { day: "Tuesday", breakfast: "Greek yogurt with honey", lunch: "Tuna salad with olive oil", dinner: "Grilled chicken with broccoli", snack: "Pear" },
          { day: "Wednesday", breakfast: "Whole-grain toast with avocado", lunch: "Lentil soup and green salad", dinner: "Baked cod with sweet potato", snack: "Apple" },
          { day: "Thursday", breakfast: "Smoothie with spinach and banana", lunch: "Quinoa salad with vegetables", dinner: "Shrimp with zucchini noodles", snack: "Walnuts" },
          { day: "Friday", breakfast: "Chia pudding with raspberries", lunch: "Chicken breast salad", dinner: "Lean turkey meatballs", snack: "Orange" },
          { day: "Saturday", breakfast: "Omelet with spinach and mushrooms", lunch: "Hummus with carrots", dinner: "Baked sea bass with kale", snack: "Pumpkin seeds" },
          { day: "Sunday", breakfast: "Oatmeal with strawberries", lunch: "Brown rice with tofu", dinner: "Stir-fried chicken and veggies", snack: "Grapes" }
        ]
      },
      exercise: {
        guidelines: ["Aerobic exercises help prevent vascular clogging.", "Engage in swimming or cycling weekly."],
        schedule: "5 days a week, 30-45 minutes",
        routine: [
          { phase: "Warm Up", details: "General joint mobilizers", exercises: ["Arm Swings: 15 reps", "Shoulder Rolls: 10 reps", "Slow Walking: 5 mins"] },
          { phase: "Cardio", details: "Moderate-intensity cardio", exercises: ["Brisk Walking: 25 mins", "Cycling: 25 mins"] },
          { phase: "Cool Down", details: "Static stretches", exercises: ["Hamstring Stretch: 20 seconds", "Standing Calf Stretch: 20 seconds"] }
        ]
      }
    },
    MODERATE: {
      diet: {
        guidelines: ["Follow DASH diet guidelines (high calcium, potassium, magnesium).", "Strictly limit alcohol and caffeinated drinks.", "Eliminate trans fats entirely from food intake."],
        weekly: [
          { day: "Monday", breakfast: "Oatmeal with walnuts", lunch: "Chicken salad with vinaigrette", dinner: "Baked trout with brown rice", snack: "Pumpkin seeds" },
          { day: "Tuesday", breakfast: "Two boiled eggs and toast", lunch: "Lentil soup", dinner: "Grilled chicken and cauliflower", snack: "Peach" },
          { day: "Wednesday", breakfast: "Greek yogurt with muesli", lunch: "Tuna salad with greens", dinner: "Baked salmon and kale", snack: "Baby carrots with hummus" },
          { day: "Thursday", breakfast: "Avocado green smoothie", lunch: "Chickpea salad", dinner: "Turkey burger (no bun)", snack: "Walnuts" },
          { day: "Friday", breakfast: "Oatmeal with almonds", lunch: "Quinoa salad", dinner: "Baked cod and broccoli", snack: "Apple slices" },
          { day: "Saturday", breakfast: "Chia pudding", lunch: "Turkey wrap", dinner: "Baked chicken breast", snack: "Sunflower seeds" },
          { day: "Sunday", breakfast: "Omelet with bell peppers", lunch: "Tossed greens with salmon", dinner: "Stir-fried shrimp with brown rice", snack: "Fresh grapes" }
        ]
      },
      exercise: {
        guidelines: ["Avoid isometric exercises which cause blood pressure spikes.", "Focus on steady-state cardiorespiratory workouts."],
        schedule: "4 days a week, 35 minutes",
        routine: [
          { phase: "Warm Up", details: "Neck rolls and arm circles", exercises: ["Neck Rotations: 5 reps", "Arm Circles: 15 reps", "Slow Walk: 5 mins"] },
          { phase: "Steady Cardio", details: "Moderate treadmill or cycling", exercises: ["Brisk Walking: 25 mins", "Stationary Cycling: 25 mins"] },
          { phase: "Cool Down", details: "Static stretch and breathing", exercises: ["Hamstring Stretch: 20 seconds", "Chest Opener: 20 seconds"] }
        ]
      }
    },
    HIGH: {
      diet: {
        guidelines: ["Sodium restriction strictly under 1500mg/day.", "Minimize fats and cholesterol; focus on high-fiber vegetables.", "Exclude processed meats, commercial baked goods, and canned foods."],
        weekly: [
          { day: "Monday", breakfast: "Steel-cut oats (no salt) with strawberries", lunch: "Unsalted lentil salad", dinner: "Baked cod and cauliflower mash", snack: "Raw walnuts (6 pieces)" },
          { day: "Tuesday", breakfast: "Poached egg on unsalted toast", lunch: "Chicken breast with green salad", dinner: "Baked salmon and asparagus", snack: "Apple" },
          { day: "Wednesday", breakfast: "Greek yogurt with blueberries", lunch: "Quinoa and black beans (no salt)", dinner: "Turkey breast and zucchini", snack: "Cucumber" },
          { day: "Thursday", breakfast: "Green smoothie", lunch: "Tuna salad in lettuce wraps", dinner: "Baked halibut and green beans", snack: "Raspberries" },
          { day: "Friday", breakfast: "Chia pudding", lunch: "Chickpea salad", dinner: "Roasted chicken and broccoli", snack: "Almond butter with celery" },
          { day: "Saturday", breakfast: "Egg white scramble", lunch: "Turkey wraps (unsalted)", dinner: "Baked sea bass and steamed kale", snack: "Pumpkin seeds" },
          { day: "Sunday", breakfast: "Oatmeal with banana", lunch: "Brown rice with tofu", dinner: "Pan-seared cod and zucchini", snack: "Peach" }
        ]
      },
      exercise: {
        guidelines: ["Obtain clinical stroke-risk profile and clearance before exercising.", "Keep target heart rate below 105-110 BPM.", "Prioritize balance and range-of-motion to restore coordination."],
        schedule: "Daily, 20-30 minutes",
        routine: [
          { phase: "Warm Up", details: "Seated joint rotations", exercises: ["Shoulder Shrugs: 10 reps", "Seated Ankle Rotations: 10 reps", "Gentle Indoor Walk: 5 mins"] },
          { phase: "Gentle Activity", details: "Low-impact walking", exercises: ["Conversational Walking: 15 mins", "Seated Leg Extensions: 10 reps per side"] },
          { phase: "Cool Down", details: "Restorative deep breaths", exercises: ["Seated Hamstring Stretch: 20 seconds", "Deep Breathing: 5 mins"] }
        ]
      }
    }
  },
  ANEMIA: {
    LOW: {
      diet: {
        guidelines: ["Incorporate iron-rich foods (red meat, poultry, beans, spinach).", "Consume vitamin C (citrus, bell peppers) alongside iron to enhance absorption.", "Limit tea and coffee during meals as they block iron absorption."],
        weekly: [
          { day: "Monday", breakfast: "Scrambled eggs with spinach", lunch: "Grilled beef salad with lemon dressing", dinner: "Baked salmon with quinoa", snack: "Oranges" },
          { day: "Tuesday", breakfast: "Greek yogurt with pumpkin seeds", lunch: "Tuna whole-wheat wrap", dinner: "Turkey stir-fry with broccoli", snack: "Walnuts" },
          { day: "Wednesday", breakfast: "Oatmeal with strawberries and almonds", lunch: "Lentil soup and green salad", dinner: "Grilled chicken with asparagus", snack: "Bell pepper strips" },
          { day: "Thursday", breakfast: "Smoothie with spinach and banana", lunch: "Quinoa bowl with black beans", dinner: "Shrimp and zucchini noodles", snack: "Greek yogurt" },
          { day: "Friday", breakfast: "Chia pudding with raspberries", lunch: "Turkey wrap with spinach", dinner: "Lean beef sirloin with cauliflower", snack: "Pumpkin seeds" },
          { day: "Saturday", breakfast: "Omelet with tomatoes and spinach", lunch: "Chickpea salad with lemon", dinner: "Baked chicken thighs with broccoli", snack: "Mixed berries" },
          { day: "Sunday", breakfast: "Whole-wheat toast with avocado", lunch: "Brown rice with tofu", dinner: "Baked tilapia with green beans", snack: "Pear" }
        ]
      },
      exercise: {
        guidelines: ["Regular moderate exercise helps stimulate red blood cell production.", "Avoid over-exhaustion if hemoglobin levels are low."],
        schedule: "5 days a week, 30 minutes",
        routine: [
          { phase: "Warm Up", details: "Gentle joint mobility", exercises: ["Neck Rolls: 10 reps", "Shoulder Rolls: 10 reps", "Slow Walk: 5 mins"] },
          { phase: "Aerobic Phase", details: "Walking or swimming", exercises: ["Brisk Walking: 20 mins", "Light Swimming: 20 mins"] },
          { phase: "Cool Down", details: "Static stretches", exercises: ["Hamstring Stretch: 20 seconds", "Calf Stretch: 20 seconds"] }
        ]
      }
    },
    MODERATE: {
      diet: {
        guidelines: ["Focus on foods rich in Vitamin B12 and Folate (eggs, fortified cereals, liver).", "Avoid calcium supplements near iron-rich meals.", "Increase intake of dark leafy green vegetables."],
        weekly: [
          { day: "Monday", breakfast: "Oatmeal with pumpkin seeds", lunch: "Turkey salad with spinach", dinner: "Baked salmon and broccoli", snack: "Walnuts" },
          { day: "Tuesday", breakfast: "Two boiled eggs and toast", lunch: "Lentil soup with spinach", dinner: "Grilled chicken breast and carrots", snack: "Strawberries" },
          { day: "Wednesday", breakfast: "Greek yogurt with chia seeds", lunch: "Tuna salad over spinach", dinner: "Lean beef stir-fry with broccoli", snack: "Orange" },
          { day: "Thursday", breakfast: "Spinach avocado smoothie", lunch: "Chickpea bowl", dinner: "Turkey burger and green beans", snack: "Pecans" },
          { day: "Friday", breakfast: "Oatmeal with strawberries", lunch: "Quinoa salad with beans", dinner: "Baked cod and kale", snack: "Sunflower seeds" },
          { day: "Saturday", breakfast: "Chia pudding", lunch: "Turkey wraps with spinach", dinner: "Baked chicken thighs", snack: "Pumpkin seeds" },
          { day: "Sunday", breakfast: "Omelet with tomatoes", lunch: "Tossed greens with salmon", dinner: "Stir-fried tofu with brown rice", snack: "Raspberries" }
        ]
      },
      exercise: {
        guidelines: ["Keep workouts light to moderate; monitor breathing and heart rate.", "Take frequent rest breaks to prevent sudden fatigue."],
        schedule: "4 days a week, 30 minutes",
        routine: [
          { phase: "Warm Up", details: "Neck tilting and shoulder rolls", exercises: ["Neck Tilts: 10 reps", "Shoulder Rolls: 12 reps", "Slow Walk: 5 mins"] },
          { phase: "Moderate Cardio", details: "Paced walking", exercises: ["Paced Walking: 20 mins", "Diaphragmatic Breathing: 5 mins"] },
          { phase: "Cool Down", details: "Light stretching", exercises: ["Hamstring Stretch: 20 seconds", "Calf Stretch: 20 seconds"] }
        ]
      }
    },
    HIGH: {
      diet: {
        guidelines: ["Strictly prioritize doctor-prescribed therapeutic iron supplements.", "Eliminate tea, coffee, and dairy within 2 hours of iron intake.", "Consume vitamin C rich juices with iron-dense foods."],
        weekly: [
          { day: "Monday", breakfast: "Scrambled eggs with spinach", lunch: "Beef liver (cautious portion) or red meat with salad", dinner: "Baked salmon with roasted asparagus", snack: "Orange slices" },
          { day: "Tuesday", breakfast: "Greek yogurt with pumpkin seeds", lunch: "Tuna salad in spinach lettuce wraps", dinner: "Baked cod and broccoli", snack: "Strawberries" },
          { day: "Wednesday", breakfast: "Three egg whites scramble", lunch: "Lentil stew with leafy greens", dinner: "Turkey breast and zucchini", snack: "Grapefruit" },
          { day: "Thursday", breakfast: "Chia pudding with raspberries", lunch: "Quinoa and black bean salad", dinner: "Baked halibut and green beans", snack: "Pumpkin seeds" },
          { day: "Friday", breakfast: "Spinach smoothie with orange juice", lunch: "Chicken breast salad with bell peppers", dinner: "Grilled beef sirloin and asparagus", snack: "Walnuts" },
          { day: "Saturday", breakfast: "Omelet with cooked spinach and onions", lunch: "Tuna wraps with spinach", dinner: "Baked sea bass and cabbage", snack: "Sunflower seeds" },
          { day: "Sunday", breakfast: "Low-carb protein shake", lunch: "Quinoa with roasted beets", dinner: "Baked chicken breast with green beans", snack: "Peach" }
        ]
      },
      exercise: {
        guidelines: ["Limit physical exertion strictly to avoid hypoxia-induced dizziness or fainting.", "Stick to low-intensity mobility and breathing exercises.", "Perform workouts in a seated position if feeling lightheaded."],
        schedule: "Daily, 15 minutes",
        routine: [
          { phase: "Warm Up", details: "Seated stretches", exercises: ["Shoulder Shrugs: 10 reps", "Seated Ankle Rotations: 10 reps", "Deep Breathing: 3 mins"] },
          { phase: "Gentle Activity", details: "Leisurely walks or seated extensions", exercises: ["Leisurely Walk: 10 mins", "Seated Knee Extensions: 8 reps per side"] },
          { phase: "Cool Down", details: "Resting", exercises: ["Child's Pose: 1 min", "Quiet Seated Rest: 3 mins"] }
        ]
      }
    }
  }
};

const TypewriterEffect = ({ text, delay = 15, startDelay = 0 }: { text: string; delay?: number, startDelay?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [started, setStarted] = useState(false);
  
  useEffect(() => {
    setDisplayedText("");
    setStarted(false);
    let interval: NodeJS.Timeout;
    
    const timeout = setTimeout(() => {
      setStarted(true);
      let i = 0;
      interval = setInterval(() => {
        i++;
        setDisplayedText(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, delay);
    }, startDelay);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, delay, startDelay]);

  return <span>{displayedText}{started && displayedText.length < text.length ? <span style={{ opacity: 0.7 }}>▋</span> : ""}</span>;
};

const calculateAge = (dobString?: string): number => {
  if (!dobString) return 40;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return 40;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age > 0 ? age : 40;
};

function AssessmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") as DiseaseType;
  const pipelineKey: DiseaseType = typeParam && PIPELINES[typeParam] ? typeParam : "DIABETES";
  const pipeline = PIPELINES[pipelineKey];

  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [activeResultTab, setActiveResultTab] = useState<"analysis" | "diet" | "exercise">("analysis");
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [hovered, setHovered] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getGlowColor = () => {
    switch (pipelineKey) {
      case "DIABETES": return "rgba(59, 130, 246, 0.25)";
      case "HEART_DISEASE": return "rgba(0, 242, 254, 0.25)";
      case "LIVER_DISEASE": return "rgba(255, 0, 127, 0.25)";
      case "KIDNEY_DISEASE": return "rgba(16, 185, 129, 0.25)";
      case "THYROID_DISEASE": return "rgba(217, 70, 239, 0.25)";
      case "PULMONARY_DISEASE": return "rgba(6, 182, 212, 0.25)";
      case "STROKE": return "rgba(244, 63, 94, 0.25)";
      case "ANEMIA": return "rgba(245, 158, 11, 0.25)";
      default: return "rgba(255, 255, 255, 0.15)";
    }
  };

  useEffect(() => {
    const activeUser = getUser();
    if (!activeUser) {
      router.push("/login");
      return;
    }
    setUser(activeUser);

    const userAge = calculateAge(activeUser?.dateOfBirth);

    // Seed defaults
    const initialData: Record<string, any> = {};
    pipeline.fields.forEach((f) => {
      initialData[f.id] = f.id === "age" ? userAge : f.default;
    });
    setFormData(initialData);
  }, [pipelineKey, router, pipeline.fields]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value === "" ? "" : Number(value)
    }));
  };

  const ALIAS_MAP: Record<string, string[]> = {
    glucose: ["glucose", "fasting_glucose", "blood_glucose", "fbs", "sugar", "blood_sugar"],
    hba1c: ["hba1c", "hb_a1c", "glycated_hemoglobin", "a1c"],
    bloodPressure: ["bloodpressure", "bp", "blood_pressure", "sys_bp", "resting_bp", "restingbp", "systolic"],
    insulin: ["insulin", "serum_insulin", "insulin_level"],
    bmi: ["bmi", "body_mass_index"],
    age: ["age", "patient_age"],
    restingBP: ["restingbp", "resting_bp", "bp", "blood_pressure", "bloodpressure", "systolic"],
    cholesterol: ["cholesterol", "total_cholesterol", "serum_cholesterol"],
    fastingBS: ["fastingbs", "fasting_bs", "fasting_sugar", "fbs", "sugar"],
    restingECG: ["restingecg", "ecg"],
    maxHeartRate: ["maxheartrate", "heart_rate", "max_hr", "hr", "pulse"],
    chestPainType: ["chestpaintype", "chest_pain"],
    totalBilirubin: ["totalbilirubin", "total_bilirubin", "bilirubin"],
    directBilirubin: ["directbilirubin", "direct_bilirubin"],
    alt: ["alt", "sgpt", "alt_sgpt"],
    ast: ["ast", "sgot", "ast_sgot"],
    alp: ["alp", "alkaline_phosphatase"],
    albumin: ["albumin", "serum_albumin"],
    serumCreatinine: ["serumcreatinine", "serum_creatinine", "creatinine"],
    bloodUrea: ["bloodurea", "blood_urea", "urea", "bun"],
    egfr: ["egfr", "gfr"],
    urineAlbumin: ["urinealbumin", "urine_albumin", "microalbumin"],
    haemoglobin: ["haemoglobin", "hemoglobin", "hb"],
    tsh: ["tsh", "thyroid_stimulating_hormone"],
    freeT3: ["freet3", "free_t3", "ft3", "t3"],
    freeT4: ["freet4", "free_t4", "ft4", "t4"],
    antiTpo: ["antitpo", "anti_tpo", "tpo"],
    oxygenSaturation: ["oxygensaturation", "oxygen_saturation", "spo2", "o2_sat", "oxygen"],
    fev1: ["fev1"],
    fvc: ["fvc"],
    fev1FvcRatio: ["fev1fvcratio", "fev1_fvc"],
    respiratoryRate: ["respiratoryrate", "respiratory_rate", "rr"],
    smokingHistory: ["smokinghistory", "smoking"],
    rbcCount: ["rbccount", "rbc_count", "rbc"],
    hematocrit: ["hematocrit", "hct"],
    mcv: ["mcv"],
    mch: ["mch"],
    ferritin: ["ferritin", "serum_ferritin"]
  };

  const findMatchingValue = (parsed: Record<string, any>, fieldId: string) => {
    if (!parsed || typeof parsed !== "object") return undefined;
    
    if (parsed[fieldId] !== undefined && parsed[fieldId] !== null) {
      return parsed[fieldId];
    }
    
    const aliases = ALIAS_MAP[fieldId] || [fieldId.toLowerCase()];
    
    for (const key of Object.keys(parsed)) {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const alias of aliases) {
        const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (cleanKey === cleanAlias || cleanKey.includes(cleanAlias) || cleanAlias.includes(cleanKey)) {
          const val = parsed[key];
          if (val !== undefined && val !== null && !isNaN(Number(val))) {
            return Number(val);
          }
        }
      }
    }
    return undefined;
  };

  const parseOCRText = (text: string): Record<string, number> => {
    const result: Record<string, number> = {};
    if (!text || typeof text !== "string") return result;

    try {
      const parsedJson = typeof text === "string" && text.trim().startsWith("{") ? JSON.parse(text) : (typeof text === "object" ? text : null);
      if (parsedJson && typeof parsedJson === "object") {
        Object.keys(parsedJson).forEach((k) => {
          const val = parsedJson[k];
          if (val !== undefined && val !== null && !isNaN(Number(val))) {
            result[k] = Number(val);
          }
        });
        if (Object.keys(result).length > 0) return result;
      }
    } catch (e) {}

    // Regex pattern matching for raw OCR text
    const PATTERNS: { id: string; regex: RegExp[] }[] = [
      { id: "glucose", regex: [/(?:fasting\s*)?(?:blood\s*)?glucose[:\s=]+(\d+\.?\d*)/i, /fbs[:\s=]+(\d+\.?\d*)/i, /sugar[:\s=]+(\d+\.?\d*)/i] },
      { id: "hba1c", regex: [/hba1c[:\s=]+(\d+\.?\d*)/i, /a1c[:\s=]+(\d+\.?\d*)/i, /glycated[:\s=]+(\d+\.?\d*)/i] },
      { id: "bloodPressure", regex: [/blood\s*pressure[:\s=]+(\d+)/i, /bp[:\s=]+(\d+)/i, /systolic[:\s=]+(\d+)/i] },
      { id: "insulin", regex: [/insulin[:\s=]+(\d+\.?\d*)/i] },
      { id: "bmi", regex: [/bmi[:\s=]+(\d+\.?\d*)/i, /body\s*mass[:\s=]+(\d+\.?\d*)/i] },
      { id: "age", regex: [/age[:\s=]+(\d+)/i] },
      { id: "restingBP", regex: [/resting\s*bp[:\s=]+(\d+)/i, /blood\s*pressure[:\s=]+(\d+)/i] },
      { id: "cholesterol", regex: [/cholesterol[:\s=]+(\d+\.?\d*)/i, /serum\s*cholesterol[:\s=]+(\d+\.?\d*)/i] },
      { id: "fastingBS", regex: [/fasting\s*bs[:\s=]+(\d+\.?\d*)/i, /fasting\s*sugar[:\s=]+(\d+\.?\d*)/i] },
      { id: "totalBilirubin", regex: [/total\s*bilirubin[:\s=]+(\d+\.?\d*)/i, /bilirubin[:\s=]+(\d+\.?\d*)/i] },
      { id: "directBilirubin", regex: [/direct\s*bilirubin[:\s=]+(\d+\.?\d*)/i] },
      { id: "alt", regex: [/alt[:\s=]+(\d+\.?\d*)/i, /sgpt[:\s=]+(\d+\.?\d*)/i] },
      { id: "ast", regex: [/ast[:\s=]+(\d+\.?\d*)/i, /sgot[:\s=]+(\d+\.?\d*)/i] },
      { id: "alp", regex: [/alp[:\s=]+(\d+\.?\d*)/i, /alkaline[:\s=]+(\d+\.?\d*)/i] },
      { id: "albumin", regex: [/albumin[:\s=]+(\d+\.?\d*)/i] },
      { id: "serumCreatinine", regex: [/creatinine[:\s=]+(\d+\.?\d*)/i, /serum\s*creatinine[:\s=]+(\d+\.?\d*)/i] },
      { id: "bloodUrea", regex: [/urea[:\s=]+(\d+\.?\d*)/i, /bun[:\s=]+(\d+\.?\d*)/i] },
      { id: "egfr", regex: [/egfr[:\s=]+(\d+\.?\d*)/i, /gfr[:\s=]+(\d+\.?\d*)/i] },
      { id: "haemoglobin", regex: [/hemoglobin[:\s=]+(\d+\.?\d*)/i, /hb[:\s=]+(\d+\.?\d*)/i] },
      { id: "tsh", regex: [/tsh[:\s=]+(\d+\.?\d*)/i] },
      { id: "freeT3", regex: [/free\s*t3[:\s=]+(\d+\.?\d*)/i, /ft3[:\s=]+(\d+\.?\d*)/i] },
      { id: "freeT4", regex: [/free\s*t4[:\s=]+(\d+\.?\d*)/i, /ft4[:\s=]+(\d+\.?\d*)/i] },
      { id: "oxygenSaturation", regex: [/spo2[:\s=]+(\d+\.?\d*)/i, /oxygen[:\s=]+(\d+\.?\d*)/i] },
      { id: "fev1", regex: [/fev1[:\s=]+(\d+\.?\d*)/i] },
      { id: "fvc", regex: [/fvc[:\s=]+(\d+\.?\d*)/i] },
      { id: "rbcCount", regex: [/rbc[:\s=]+(\d+\.?\d*)/i] },
      { id: "hematocrit", regex: [/hematocrit[:\s=]+(\d+\.?\d*)/i, /hct[:\s=]+(\d+\.?\d*)/i] },
      { id: "mcv", regex: [/mcv[:\s=]+(\d+\.?\d*)/i] },
      { id: "mch", regex: [/mch[:\s=]+(\d+\.?\d*)/i] },
      { id: "ferritin", regex: [/ferritin[:\s=]+(\d+\.?\d*)/i] }
    ];

    for (const item of PATTERNS) {
      for (const rx of item.regex) {
        const match = text.match(rx);
        if (match && match[1]) {
          const num = parseFloat(match[1]);
          if (!isNaN(num)) {
            result[item.id] = num;
            break;
          }
        }
      }
    }

    return result;
  };

  const readLocalFileText = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        resolve(typeof text === "string" ? text : "");
      };
      reader.onerror = () => resolve("");
      reader.readAsText(file.slice(0, 50000));
    });
  };

  const processFile = async (file: File) => {
    setUploadError("");
    setUploading(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    let parsedValues: Record<string, any> = {};

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const response = await api.post("/reports/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 20000
      });

      const responseData = response.data || {};
      const rawExtracted = responseData.extractedtext || responseData.extractedText || responseData.extracted_text;

      if (rawExtracted) {
        parsedValues = parseOCRText(rawExtracted);
      }
    } catch (err: any) {
      console.warn("Backend OCR endpoint offline or timed out:", err);
    }

    // Client-side fallback if backend OCR yielded no matching parameters
    if (Object.keys(parsedValues).length === 0) {
      try {
        const localText = await readLocalFileText(file);
        if (localText) {
          parsedValues = parseOCRText(localText);
        }
      } catch (localErr) {
        console.error("Local file reading notice:", localErr);
      }
    }

    // Populate formData state fields
    let filledCount = 0;
    const filledFieldsList: string[] = [];

    setFormData((prev) => {
      const next = { ...prev };
      pipeline.fields.forEach((f) => {
        const matchedVal = findMatchingValue(parsedValues, f.id);
        if (matchedVal !== undefined && matchedVal !== null && !isNaN(Number(matchedVal))) {
          next[f.id] = Number(matchedVal);
          filledCount++;
          filledFieldsList.push(`${f.label.split("(")[0].trim()}: ${matchedVal}`);
        }
      });
      return next;
    });

    if (filledCount > 0) {
      alert(`✓ Medical report scanned successfully!\n\n${filledCount} parameters extracted and populated into form:\n• ` + filledFieldsList.join("\n• "));
    } else {
      alert("⚠️ Medical report received! Standard baseline parameters loaded below. Please review or adjust your inputs before running assessment.");
    }

    setUploading(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAnalyzing(true);
    setResult(null);

    // Simulate scanning delay for futuristic look
    await new Promise((resolve) => setTimeout(resolve, 2500));

    try {
      const payload = {
        diseaseType: pipelineKey,
        ...formData
      };

      const response = await api.post("/assessments", payload);
      setResult(response.data);
      setActiveResultTab("analysis");
      setExpandedPhase(null);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        "Inference request failed. Please check backend log systems."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: "800px", width: "100%", marginLeft: "auto", marginRight: "auto" }}>
      {/* Back to dashboard breadcrumb */}
      <div style={{ marginBottom: "24px" }}>
        <Link href="/dashboard" style={{ color: "var(--primary)", fontSize: "0.95rem", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          ← Back to Predictor Overview
        </Link>
      </div>

      {/* Step 1: Analyzing Telemetry Effect */}
      {analyzing && (
        <div className="card-3d" style={{ padding: "50px 30px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div className="scan-line" style={{ background: `linear-gradient(to right, transparent, ${pipeline.color}, transparent)` }}></div>
          <h2 className="text-glow" style={{ fontSize: "1.8rem", fontWeight: 800, color: pipeline.color, marginBottom: "15px" }}>
            RUNNING INFERENCE SYSTEM
          </h2>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            border: `4px solid rgba(255, 255, 255, 0.05)`,
            borderTopColor: pipeline.color,
            animation: "spin 1s linear infinite",
            margin: "30px auto"
          }}></div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Evaluating biological metrics against standard ML models...
          </p>
          <style jsx global>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Step 2: Display Results */}
      {!analyzing && result && (
        <div className="card-3d" style={{ position: "relative", display: "flex", flexDirection: "column", gap: "30px" }}>
          <div>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>DIAGNOSTIC ASSESSMENT RESULT</span>
            <h2 style={{ fontSize: "2rem", fontWeight: 900, color: "#1e293b", marginTop: "8px" }}>
              {pipeline.name} Result
            </h2>
          </div>

          {/* Risk Gauge Panel */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "30px",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "24px"
          }}>
            <div style={{
              position: "relative",
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: `conic-gradient(${result.riskScore > 50 ? "var(--error)" : "var(--success)"} ${result.riskScore * 3.6}deg, #e2e8f0 0deg)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 20px ${result.riskScore > 50 ? "rgba(239, 68, 68, 0.15)" : "rgba(46, 189, 133, 0.15)"}`
            }}>
              <div style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <span style={{ fontSize: "1.6rem", fontWeight: 900, color: "#263238" }}>{Number(result.riskScore).toFixed(1)}%</span>
                <span style={{ fontSize: "0.6rem", color: "#64748b", fontWeight: 700 }}>RISK SCORE</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>CLASSIFICATION LEVEL</span>
              <h3 style={{
                fontSize: "1.8rem",
                fontWeight: 900,
                color: result.riskLevel === "HIGH" || result.riskLevel === "CRITICAL" ? "var(--error)" : result.riskLevel === "MODERATE" ? "var(--primary)" : "var(--success)",
                marginTop: "4px"
              }}>
                {result.riskLevel}
              </h3>
            </div>
          </div>

          {/* Lifestyle Actions and Recommendations Tab System */}
          {(() => {
            const levelKey: "LOW" | "MODERATE" | "HIGH" = (result.riskLevel === "CRITICAL" || result.riskLevel === "HIGH") ? "HIGH" : (result.riskLevel === "MODERATE" ? "MODERATE" : "LOW");
            const plan = LIFESTYLE_PLANS[pipelineKey]?.[levelKey];

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Tab Selector */}
                <div style={{ display: "flex", borderBottom: "1px solid var(--border)", gap: "10px", width: "100%", overflowX: "auto" }}>
                  <button
                    type="button"
                    onClick={() => setActiveResultTab("analysis")}
                    style={{
                      background: "none",
                      border: "none",
                      borderBottom: activeResultTab === "analysis" ? `3px solid ${pipeline.color}` : "3px solid transparent",
                      color: activeResultTab === "analysis" ? pipeline.color : "#64748B",
                      padding: "12px 16px",
                      fontWeight: 800,
                      cursor: "pointer",
                      fontSize: "0.95rem",
                      transition: "all 0.2s",
                      whiteSpace: "nowrap"
                    }}
                  >
                    📊 AI Analysis
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveResultTab("diet")}
                    style={{
                      background: "none",
                      border: "none",
                      borderBottom: activeResultTab === "diet" ? `3px solid ${pipeline.color}` : "3px solid transparent",
                      color: activeResultTab === "diet" ? pipeline.color : "#64748B",
                      padding: "12px 16px",
                      fontWeight: 800,
                      cursor: "pointer",
                      fontSize: "0.95rem",
                      transition: "all 0.2s",
                      whiteSpace: "nowrap"
                    }}
                  >
                    🥗 Weekly Diet Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveResultTab("exercise")}
                    style={{
                      background: "none",
                      border: "none",
                      borderBottom: activeResultTab === "exercise" ? `3px solid ${pipeline.color}` : "3px solid transparent",
                      color: activeResultTab === "exercise" ? pipeline.color : "#64748B",
                      padding: "12px 16px",
                      fontWeight: 800,
                      cursor: "pointer",
                      fontSize: "0.95rem",
                      transition: "all 0.2s",
                      whiteSpace: "nowrap"
                    }}
                  >
                    🏃 Exercise & Recovery
                  </button>
                </div>

                {/* Tab content 1: AI Analysis */}
                {activeResultTab === "analysis" && (
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#263238", marginBottom: "12px" }}>AI Predictive Analysis</h3>
                    <div style={{ marginBottom: "20px", padding: "16px", background: "rgba(0, 242, 254, 0.08)", borderLeft: "4px solid var(--primary)", borderRadius: "0 8px 8px 0", color: "#263238", fontSize: "0.95rem", lineHeight: 1.6, fontWeight: 500 }}>
                      <TypewriterEffect text={(() => {
                        const high = result.riskFactors?.filter((f: any) => f.level === "HIGH" || f.level === "CRITICAL") || [];
                        const mod = result.riskFactors?.filter((f: any) => f.level === "MODERATE") || [];
                        let txt = "";
                        if (result.riskLevel === "HIGH" || result.riskLevel === "CRITICAL") {
                          txt += `Based on the deep-learning model analysis for the ${pipeline.name}, your risk profile is classified as ${result.riskLevel} (${Number(result.riskScore).toFixed(1)}%). `;
                          if (high.length > 0) {
                            txt += `This elevated risk is primarily driven by your ${high.map((f: any) => f.name).join(" and ")}, which are currently critically out of optimal range. `;
                          }
                          txt += "Given these indicators, it is highly recommended that you consult with a specialized doctor or clinician immediately for a professional medical evaluation.";
                        } else if (result.riskLevel === "MODERATE") {
                          txt += `Your ${pipeline.name} analysis indicates a ${result.riskLevel} risk (${Number(result.riskScore).toFixed(1)}%). `;
                          if (mod.length > 0 || high.length > 0) {
                            const issues = [...high, ...mod];
                            txt += `While generally stable, metrics such as ${issues.map((f: any) => f.name).join(" and ")} show deviations from the ideal baseline. `;
                          }
                          txt += "Consider scheduling a routine check-up with your primary care physician to monitor these levels proactively.";
                        } else {
                          txt += `Excellent news. Your ${pipeline.name} analysis shows a ${result.riskLevel} risk profile (${Number(result.riskScore).toFixed(1)}%). `;
                          txt += "All provided biological markers and telemetry data appear to fall well within the normal healthy ranges. Continue maintaining your current lifestyle. No immediate medical consultation is necessary.";
                        }
                        return txt;
                      })()} delay={15} />
                    </div>

                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#263238", marginBottom: "12px" }}>Recommended Medical Interventions</h3>
                    <ul style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "20px", color: "#475569" }}>
                      {(() => {
                        const cleanSuggestions = (result.suggestions || [])
                          .filter((s: string) => s && !s.toLowerCase().includes("unreachable"));
                        const displayList = cleanSuggestions.length > 0 ? cleanSuggestions : [
                          `Your biological markers indicate a ${result.riskLevel || "standard"} risk profile. Maintain balanced nutrition and regular physical activity.`,
                          "Schedule routine clinical screenings with your primary care physician to monitor long-term trends.",
                          "Ensure consistent hydration and 7-8 hours of quality sleep daily."
                        ];
                        return displayList.map((s: string, i: number) => (
                          <li key={i} style={{ fontSize: "0.9rem", lineHeight: 1.5, fontWeight: 600, color: "#334155" }}>
                            <TypewriterEffect text={s} startDelay={(i + 1) * 600} />
                          </li>
                        ));
                      })()}
                    </ul>
                  </div>
                )}

                {/* Tab content 2: Diet Plan */}
                {activeResultTab === "diet" && plan && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ padding: "16px", background: "rgba(16, 185, 129, 0.08)", borderLeft: `4px solid ${pipeline.color}`, borderRadius: "0 8px 8px 0" }}>
                      <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#263238", marginBottom: "8px" }}>🥗 Core Nutrition Guidelines ({result.riskLevel} Risk)</h4>
                      <ul style={{ paddingLeft: "20px", color: "#334155", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "6px", fontWeight: 500 }}>
                        {plan.diet.guidelines.map((g, i) => (
                          <li key={i}>{g}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#263238", margin: 0 }}>Weekly Meal Plan</h4>
                        <button
                          type="button"
                          onClick={() => {
                            const fullWeeklyExport = plan.diet.weekly.map((d, idx) => ({
                              day: d.day,
                              meals: [
                                { id: `exp_${idx}_b`, timeOfDay: "08:00 AM", mealName: "Breakfast", description: d.breakfast, calories: "350 kcal", completed: false },
                                { id: `exp_${idx}_l`, timeOfDay: "01:30 PM", mealName: "Lunch", description: d.lunch, calories: "480 kcal", completed: false },
                                { id: `exp_${idx}_s`, timeOfDay: "04:30 PM", mealName: "Snack", description: d.snack, calories: "150 kcal", completed: false },
                                { id: `exp_${idx}_d`, timeOfDay: "07:30 PM", mealName: "Dinner", description: d.dinner, calories: "380 kcal", completed: false },
                              ]
                            }));
                            const todayStr = new Date().toISOString().split("T")[0];
                            localStorage.setItem("medipredict_weekly_diet_plan", JSON.stringify(fullWeeklyExport));
                            localStorage.setItem("medipredict_diet_items", JSON.stringify(fullWeeklyExport[0].meals));
                            localStorage.setItem("medipredict_diet_last_date", todayStr);
                            router.push("/dashboard/diet");
                          }}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "10px",
                            background: "#10B981",
                            color: "#FFF",
                            border: "none",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
                          }}
                        >
                          📌 Export to Daily Diet To-Do List
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                        {plan.diet.weekly.map((d, i) => (
                          <div key={i} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "18px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)" }}>
                            <h5 style={{ color: pipeline.color, fontWeight: 800, marginBottom: "12px", fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>{d.day}</h5>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.88rem", color: "#475569" }}>
                              <div><strong style={{ color: "#263238", fontWeight: 800 }}>🍳 Breakfast:</strong> {d.breakfast}</div>
                              <div><strong style={{ color: "#263238", fontWeight: 800 }}>🥗 Lunch:</strong> {d.lunch}</div>
                              <div><strong style={{ color: "#263238", fontWeight: 800 }}>🍽️ Dinner:</strong> {d.dinner}</div>
                              <div><strong style={{ color: "#263238", fontWeight: 800 }}>🥜 Snack:</strong> {d.snack}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab content 3: Exercise Plan */}
                {activeResultTab === "exercise" && plan && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ padding: "16px", background: "rgba(0, 242, 254, 0.08)", borderLeft: `4px solid ${pipeline.color}`, borderRadius: "0 8px 8px 0" }}>
                      <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#263238", marginBottom: "4px" }}>🏃 Target Training Schedule</h4>
                      <p style={{ color: pipeline.color, fontSize: "1.1rem", fontWeight: 800 }}>{plan.exercise.schedule}</p>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#263238", margin: 0 }}>Daily Training Routine</h4>
                        <button
                          type="button"
                          onClick={() => {
                            const fullWeeklyExerciseExport = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((dayName) => ({
                              day: dayName,
                              tasks: plan.exercise.routine.map((r, idx) => ({
                                id: `exp_ex_${dayName}_${idx}`,
                                category: r.phase,
                                taskName: r.details || r.phase,
                                duration: r.exercises ? `${r.exercises.length} drills` : "15 mins",
                                intensity: "Moderate",
                                exercises: r.exercises || [],
                                completed: false,
                              }))
                            }));
                            const todayStr = new Date().toISOString().split("T")[0];
                            localStorage.setItem("medipredict_weekly_exercise_plan", JSON.stringify(fullWeeklyExerciseExport));
                            localStorage.setItem("medipredict_exercise_tasks", JSON.stringify(fullWeeklyExerciseExport[0].tasks));
                            localStorage.setItem("medipredict_exercise_last_date", todayStr);
                            router.push("/dashboard/exercise");
                          }}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "10px",
                            background: "#1E88E5",
                            color: "#FFF",
                            border: "none",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            boxShadow: "0 4px 12px rgba(30, 136, 229, 0.2)"
                          }}
                        >
                          📌 Export to Daily Exercise To-Do List
                        </button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {plan.exercise.routine.map((r, i) => {
                          const isExpanded = expandedPhase === i;
                          return (
                            <div 
                              key={i} 
                              onClick={() => setExpandedPhase(isExpanded ? null : i)}
                              className="card-3d" 
                              style={{ 
                                display: "flex", 
                                flexDirection: "column",
                                gap: "12px", 
                                background: isExpanded ? "rgba(30, 136, 229, 0.04)" : "#FFFFFF", 
                                border: isExpanded ? `1.5px solid ${pipeline.color}` : "1px solid #E2E8F0", 
                                borderRadius: "14px", 
                                padding: "16px",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                transform: "none"
                              }}
                            >
                              <div style={{ display: "flex", gap: "16px", alignItems: "center", width: "100%" }}>
                                <div style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "50%",
                                  background: `rgba(${pipelineKey === "DIABETES" ? "59, 130, 246" : pipelineKey === "HEART_DISEASE" ? "0, 242, 254" : pipelineKey === "LIVER_DISEASE" ? "255, 0, 127" : "16, 185, 129"}, 0.1)`,
                                  border: `1px solid ${pipeline.color}`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 800,
                                  color: pipeline.color,
                                  flexShrink: 0
                                }}>
                                  {i + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <h5 style={{ color: "#263238", fontWeight: 800, fontSize: "0.95rem", marginBottom: "4px" }}>{r.phase}</h5>
                                  <p style={{ color: "#475569", fontSize: "0.85rem", margin: 0, fontWeight: 500 }}>{r.details}</p>
                                </div>
                                <div style={{ color: pipeline.color, fontSize: "0.8rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}>
                                  {isExpanded ? "Hide Exercises ▲" : "Show Exercises ▼"}
                                </div>
                              </div>
                              
                              {isExpanded && r.exercises && (
                                <div 
                                  style={{ 
                                    marginTop: "8px", 
                                    paddingTop: "12px", 
                                    borderTop: "1px solid #E2E8F0", 
                                    animation: "fadeIn 0.2s ease" 
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <h6 style={{ fontSize: "0.8rem", color: pipeline.color, textTransform: "uppercase", fontWeight: 800, marginBottom: "8px" }}>Specific Exercises:</h6>
                                  <ul style={{ paddingLeft: "20px", color: "#334155", fontSize: "0.88rem", display: "flex", flexDirection: "column", gap: "6px", fontWeight: 500 }}>
                                    {r.exercises.map((ex, idx) => (
                                      <li key={idx} style={{ lineHeight: 1.4 }}>
                                        {ex}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ marginTop: "10px", padding: "16px", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "12px" }}>
                      <h5 style={{ fontSize: "0.9rem", color: "var(--error)", fontWeight: 800, marginBottom: "8px" }}>⚠️ Safety Guidelines & Warnings</h5>
                      <ul style={{ paddingLeft: "20px", color: "#334155", fontSize: "0.88rem", display: "flex", flexDirection: "column", gap: "6px", fontWeight: 500 }}>
                        {plan.exercise.guidelines.map((g, i) => (
                          <li key={i}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <div style={{ display: "flex", gap: "16px", marginTop: "10px" }}>
            <button onClick={() => setResult(null)} className="btn-3d" style={{ flex: 1 }}>
              New Assessment
            </button>
            <button 
              onClick={() => window.open(`/dashboard/print/${result.id}`, "_blank")} 
              className="btn-3d-secondary" 
              style={{ flex: 1 }}
            >
              Share with Doctor
            </button>
            <Link href="/dashboard" className="btn-3d-neutral" style={{ flex: 1 }}>
              Return Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Step 3: Diagnostic Input Form */}
      {!analyzing && !result && (
        <div className="card-3d" style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          <div>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>DIAGNOSTIC TELEMETRY PORTAL</span>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#1e293b", marginTop: "8px" }}>
              {pipeline.name}
            </h2>
          </div>

          {/* Glassy Drag and Drop upload zone */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              background: dragActive 
                ? "rgba(244, 250, 255, 0.9)" 
                : (hovered ? "rgba(244, 250, 255, 0.6)" : "#ffffff"),
              border: dragActive 
                ? `2px solid ${pipeline.color}` 
                : (hovered ? `1px dashed ${pipeline.color}` : "1px dashed #cbd5e1"),
              boxShadow: dragActive 
                ? `0 0 20px ${getGlowColor()}` 
                : (hovered ? `0 0 10px ${getGlowColor()}` : "none"),
              borderRadius: "16px",
              padding: "30px 20px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
              disabled={uploading}
            />
            
            {uploading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                <div className="loader-spin" style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  border: "3px solid #e2e8f0",
                  borderTopColor: pipeline.color,
                  animation: "spin 1s linear infinite",
                  boxShadow: `0 0 15px ${getGlowColor()}`
                }}></div>
                <div>
                  <span style={{ display: "block", fontSize: "0.95rem", fontWeight: 800, color: "#1e293b", marginBottom: "4px" }}>
                    AI OCR SYSTEM ACTIVE
                  </span>
                  <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Scanning clinical markers and mapping biological telemetry...
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                {/* Modern Cloud Upload SVG */}
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: dragActive || hovered ? `${getGlowColor()}` : "rgba(255, 255, 255, 0.02)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${dragActive || hovered ? pipeline.color : "rgba(255, 255, 255, 0.08)"}`,
                  transition: "all 0.3s ease"
                }}>
                  <svg 
                    width="26" 
                    height="26" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke={dragActive || hovered ? "#fff" : "rgba(255, 255, 255, 0.5)"} 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ transition: "stroke 0.3s ease" }}
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                
                <div>
                  <span style={{ 
                    display: "block", 
                    fontSize: "0.95rem", 
                    fontWeight: 700, 
                    color: dragActive || hovered ? "#fff" : "rgba(255, 255, 255, 0.85)",
                    transition: "color 0.3s ease",
                    marginBottom: "4px"
                  }}>
                    {dragActive ? "Release to drop clinical file" : "Drag & drop clinical report, or click to browse"}
                  </span>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Supports clinical PDF, PNG, JPG, or WEBP (Max 10MB)
                  </span>
                </div>
              </div>
            )}

            {uploadError && (
              <div style={{ color: "var(--error)", fontSize: "0.8rem", fontWeight: 600, marginTop: "12px" }}>
                ⚠️ {uploadError}
              </div>
            )}
          </div>

          {error && (
            <div style={{
              background: "rgba(255, 51, 102, 0.1)",
              border: "1px solid var(--error)",
              borderRadius: "8px",
              padding: "12px",
              color: "var(--error)",
              fontSize: "0.85rem",
              lineHeight: 1.4,
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px"
            }}>
              {pipeline.fields.filter(f => f.id !== "age").map((f) => (
                <div key={f.id}>
                  <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    step="any"
                    className="input-3d"
                    value={formData[f.id] ?? ""}
                    onChange={(e) => handleInputChange(f.id, e.target.value)}
                    required
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="btn-3d"
              style={{
                width: "100%",
                marginTop: "16px",
                background: pipeline.color,
                boxShadow: `0 6px 0 ${pipelineKey === "DIABETES" ? "var(--primary-dark)" : pipelineKey === "HEART_DISEASE" ? "var(--secondary-dark)" : pipelineKey === "LIVER_DISEASE" ? "var(--accent-dark)" : "var(--success-dark)"}, 0 12px 24px rgba(0, 0, 0, 0.3)`
              }}
            >
              Run Health Assessment
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyItems: "center" }}>
        <p style={{ textAlign: "center", width: "100%" }}>Loading Diagnostic Systems...</p>
      </div>
    }>
      <AssessmentForm />
    </Suspense>
  );
}
