"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { getUser } from "../../../services/api";
import CustomDropdown from "../../../components/CustomDropdown";
import BorderGlow from "@/components/BorderGlow";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "health">("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  // Profile Form States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Health Profile Form States
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [glucoseLevel, setGlucoseLevel] = useState("");
  const [bloodPressureSystolic, setBloodPressureSystolic] = useState("");
  const [bloodPressureDiastolic, setBloodPressureDiastolic] = useState("");
  const [insulinLevel, setInsulinLevel] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [smokingStatus, setSmokingStatus] = useState("NEVER");
  const [alcoholConsumption, setAlcoholConsumption] = useState("NEVER");
  const [physicalActivityLevel, setPhysicalActivityLevel] = useState("SEDENTARY");
  const [dietType, setDietType] = useState("STANDARD");
  const [allergies, setAllergies] = useState("");
  const [existingConditions, setExistingConditions] = useState("");
  const [currentMedications, setCurrentMedications] = useState("");
  const [familyHistory, setFamilyHistory] = useState("");
  
  // Real-time BMI calculation
  const [bmi, setBmi] = useState<number | null>(null);

  useEffect(() => {
    const activeUser = getUser();
    if (!activeUser) {
      router.push("/login");
      return;
    }
    
    // Set Profile Fields from session storage immediately
    setFirstName(activeUser.firstName || "");
    setLastName(activeUser.lastName || "");
    setEmail(activeUser.email || "");
    setGender(activeUser.gender || "");
    if (activeUser.dateOfBirth) {
      setDateOfBirth(activeUser.dateOfBirth);
    }
    setProfileIncomplete(!activeUser.gender || !activeUser.dateOfBirth);

    // Fetch fresh Profile & Health Profile details from the API
    const fetchFreshData = async () => {
      try {
        const profileRes = await api.get("/users/me");
        const freshUser = profileRes.data;
        if (freshUser) {
          setFirstName(freshUser.firstName || "");
          setLastName(freshUser.lastName || "");
          setEmail(freshUser.email || "");
          setGender(freshUser.gender || "");
          if (freshUser.dateOfBirth) {
            setDateOfBirth(freshUser.dateOfBirth);
          }
          setProfileIncomplete(!freshUser.gender || !freshUser.dateOfBirth);
          const localUser = getUser();
          localStorage.setItem("user", JSON.stringify({ ...localUser, ...freshUser }));
          window.dispatchEvent(new Event("userUpdate"));
        }
      } catch (err) {
        console.error("Failed to fetch fresh user profile", err);
      }

      try {
        const res = await api.get("/users/me/health-profile");
        const hp = res.data;
        if (hp) {
          setHeight(hp.height ? hp.height.toString() : "");
          setWeight(hp.weight ? hp.weight.toString() : "");
          setGlucoseLevel(hp.glucoseLevel ? hp.glucoseLevel.toString() : "");
          setBloodPressureSystolic(hp.bloodPressureSystolic ? hp.bloodPressureSystolic.toString() : "");
          setBloodPressureDiastolic(hp.bloodPressureDiastolic ? hp.bloodPressureDiastolic.toString() : "");
          setInsulinLevel(hp.insulinLevel ? hp.insulinLevel.toString() : "");
          setHeartRate(hp.heartRate ? hp.heartRate.toString() : "");
          setSmokingStatus(hp.smokingStatus || "NEVER");
          setAlcoholConsumption(hp.alcoholConsumption || "NEVER");
          setPhysicalActivityLevel(hp.physicalActivityLevel || "SEDENTARY");
          setDietType(hp.dietType || "STANDARD");
          setAllergies(hp.allergies || "");
          setExistingConditions(hp.existingConditions || "");
          setCurrentMedications(hp.currentMedications || "");
          setFamilyHistory(hp.familyHistory || "");
          
          if (hp.bmi) {
            setBmi(hp.bmi);
          }
        }
      } catch (err) {
        console.error("Failed to load health profile", err);
      }
    };

    fetchFreshData();
  }, [router]);

  // Calculate BMI on height/weight change
  useEffect(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      const heightM = h / 100;
      const calculatedBmi = w / (heightM * heightM);
      setBmi(parseFloat(calculatedBmi.toFixed(1)));
    } else {
      setBmi(null);
    }
  }, [height, weight]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await api.put("/users/me", {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        email,
      });

      // Update local storage
      const activeUser = getUser();
      const updatedUser = {
        ...activeUser,
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        email: res.data.email,
        gender: res.data.gender,
        dateOfBirth: res.data.dateOfBirth,
      };
      
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setProfileIncomplete(false);
      
      // Dispatch userUpdate event to trigger sidebar rerender
      window.dispatchEvent(new Event("userUpdate"));

      setMessage({ type: "success", text: "Profile details updated successfully." });
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile details. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHealthProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        glucoseLevel: glucoseLevel ? parseFloat(glucoseLevel) : null,
        bloodPressureSystolic: bloodPressureSystolic ? parseInt(bloodPressureSystolic) : null,
        bloodPressureDiastolic: bloodPressureDiastolic ? parseInt(bloodPressureDiastolic) : null,
        insulinLevel: insulinLevel ? parseFloat(insulinLevel) : null,
        heartRate: heartRate ? parseInt(heartRate) : null,
        smokingStatus,
        alcoholConsumption,
        physicalActivityLevel,
        dietType,
        existingConditions: existingConditions || null,
        currentMedications: currentMedications || null,
        familyHistory: familyHistory || null,
        allergies: allergies || null,
      };

      const res = await api.put("/users/me/health-profile", payload);
      if (res.data.bmi) {
        setBmi(res.data.bmi);
      }

      setMessage({ type: "success", text: "Health profile metrics saved successfully." });
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update health profile. Please check validation requirements.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ marginBottom: "30px" }}>
        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>COMMAND CENTER</span>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#1e293b", marginTop: "8px" }}>
          Account & Vitals Settings
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Configure your user identity credentials and adjust biological vitals telemetry baseline.
        </p>
      </div>

      {/* Tabs Row */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "25px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
        <button
          onClick={() => { setActiveTab("profile"); setMessage(null); }}
          className={activeTab === "profile" ? "btn-3d" : "btn-3d-neutral"}
          style={{ padding: "10px 20px", fontSize: "0.85rem", transform: activeTab === "profile" ? "translateY(-4px)" : "translateY(0)" }}
        >
          👤 Profile Settings
        </button>
        <button
          onClick={() => { setActiveTab("health"); setMessage(null); }}
          className={activeTab === "health" ? "btn-3d" : "btn-3d-neutral"}
          style={{ padding: "10px 20px", fontSize: "0.85rem", transform: activeTab === "health" ? "translateY(-4px)" : "translateY(0)" }}
        >
          🩺 Health Profile & Vitals
        </button>
      </div>

      {profileIncomplete && (
        <div style={{
          background: "rgba(245, 158, 11, 0.1)",
          border: "1px solid #f59e0b",
          borderRadius: "8px",
          padding: "16px",
          color: "#f59e0b",
          fontSize: "0.9rem",
          marginBottom: "25px",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <span>⚠️</span>
          <span><strong>Account Setup Required:</strong> Please complete your personal profile details (Gender & Date of Birth) and save them to activate your full command center access.</span>
        </div>
      )}

      {message && (
        <div style={{
          background: message.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
          border: `1px solid ${message.type === "success" ? "var(--success)" : "var(--error)"}`,
          borderRadius: "8px",
          padding: "16px",
          color: message.type === "success" ? "var(--success)" : "var(--error)",
          fontSize: "0.9rem",
          marginBottom: "25px",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <span>{message.type === "success" ? "✅" : "⚠️"}</span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="card-3d">
          <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e293b", borderBottom: "1px solid var(--border)", paddingBottom: "10px", marginBottom: "10px" }}>
              Personal Details
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
              <div>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                  First Name
                </label>
                <input
                  type="text"
                  className="input-3d"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value.replace(/[^a-zA-Z\s'-]/g, ""))}
                  placeholder="First name"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                  Last Name
                </label>
                <input
                  type="text"
                  className="input-3d"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value.replace(/[^a-zA-Z\s'-]/g, ""))}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
              <div>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="input-3d"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled
                  style={{ opacity: 0.7, cursor: "not-allowed" }}
                />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                  Gender
                </label>
                <CustomDropdown
                  options={[
                    { value: "MALE", label: "Male" },
                    { value: "FEMALE", label: "Female" },
                    { value: "OTHER", label: "Other" }
                  ]}
                  value={gender}
                  onChange={(val) => setGender(val)}
                  placeholder="Select Gender"
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                Date of Birth
              </label>
              <input
                type="date"
                className="input-3d"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                style={{ colorScheme: "light" }}
              />
            </div>

            <div style={{ marginTop: "15px" }}>
              <button type="submit" className="btn-3d" disabled={loading} style={{ width: "200px" }}>
                {loading ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Health Profile & Vitals Tab */}
      {activeTab === "health" && (
        <div className="card-3d">
          <form onSubmit={handleUpdateHealthProfile} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "10px", marginBottom: "10px" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e293b" }}>
                Biological Metrics & Vitals
              </h3>
              {bmi !== null && (
                <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid var(--primary)", borderRadius: "8px", padding: "6px 12px", fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)" }}>
                  Calculated BMI: {bmi}
                </div>
              )}
            </div>

            {/* Grid 1: Basic Telemetry */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              <div>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="input-3d"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 175"
                />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="input-3d"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 70"
                />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                  Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  className="input-3d"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  placeholder="e.g. 72"
                />
              </div>
            </div>

            {/* Grid 2: Laboratory Baselines */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              <div>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                  Glucose Level (mg/dL)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-3d"
                  value={glucoseLevel}
                  onChange={(e) => setGlucoseLevel(e.target.value)}
                  placeholder="e.g. 95"
                />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                  Insulin Level (μIU/mL)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-3d"
                  value={insulinLevel}
                  onChange={(e) => setInsulinLevel(e.target.value)}
                  placeholder="e.g. 6.0"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                    BP Systolic
                  </label>
                  <input
                    type="number"
                    className="input-3d"
                    value={bloodPressureSystolic}
                    onChange={(e) => setBloodPressureSystolic(e.target.value)}
                    placeholder="120"
                  />
                </div>
                <div>
                  <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                    BP Diastolic
                  </label>
                  <input
                    type="number"
                    className="input-3d"
                    value={bloodPressureDiastolic}
                    onChange={(e) => setBloodPressureDiastolic(e.target.value)}
                    placeholder="80"
                  />
                </div>
              </div>
            </div>

            {/* Grid 3: Lifestyle Profile */}
            <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#263238", borderBottom: "1px solid var(--border)", paddingBottom: "6px", marginTop: "15px" }}>
              Lifestyle & Environmental Factors
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
              <CustomDropdown
                options={[
                  { value: "NEVER", label: "Never Smoked" },
                  { value: "FORMER", label: "Former Smoker" },
                  { value: "CURRENT", label: "Current Smoker" }
                ]}
                value={smokingStatus}
                onChange={setSmokingStatus}
                label="Smoking Status"
              />

              <CustomDropdown
                options={[
                  { value: "NEVER", label: "Non-Drinker" },
                  { value: "OCCASIONAL", label: "Occasional" },
                  { value: "REGULAR", label: "Regular Drinker" }
                ]}
                value={alcoholConsumption}
                onChange={setAlcoholConsumption}
                label="Alcohol Consumption"
              />

              <CustomDropdown
                options={[
                  { value: "SEDENTARY", label: "Sedentary (No Exercise)" },
                  { value: "MODERATELY_ACTIVE", label: "Moderately Active (1-3 days/wk)" },
                  { value: "ACTIVE", label: "Active (4+ days/wk)" }
                ]}
                value={physicalActivityLevel}
                onChange={setPhysicalActivityLevel}
                label="Physical Activity"
              />

              <CustomDropdown
                options={[
                  { value: "STANDARD", label: "Standard Mixed Diet" },
                  { value: "VEGETARIAN", label: "Vegetarian" },
                  { value: "VEGAN", label: "Vegan" },
                  { value: "KETO", label: "Ketogenic" }
                ]}
                value={dietType}
                onChange={setDietType}
                label="Diet Type"
              />
            </div>

            {/* Grid 4: Historical & Conditions */}
            <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#263238", borderBottom: "1px solid var(--border)", paddingBottom: "6px", marginTop: "15px" }}>
              Medical History & Annotations
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
              <div>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                  Known Allergies
                </label>
                <input
                  type="text"
                  className="input-3d"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Peanuts"
                />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                  Existing Conditions
                </label>
                <input
                  type="text"
                  className="input-3d"
                  value={existingConditions}
                  onChange={(e) => setExistingConditions(e.target.value)}
                  placeholder="e.g. Hypertension, Asthma"
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
              <div>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                  Current Medications
                </label>
                <input
                  type="text"
                  className="input-3d"
                  value={currentMedications}
                  onChange={(e) => setCurrentMedications(e.target.value)}
                  placeholder="e.g. Metformin 500mg daily"
                />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                  Family Health History
                </label>
                <input
                  type="text"
                  className="input-3d"
                  value={familyHistory}
                  onChange={(e) => setFamilyHistory(e.target.value)}
                  placeholder="e.g. Paternal history of type 2 diabetes"
                />
              </div>
            </div>

            <div style={{ marginTop: "15px" }}>
              <button type="submit" className="btn-3d" disabled={loading} style={{ width: "240px" }}>
                {loading ? "Saving..." : "Save Health Profile"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
