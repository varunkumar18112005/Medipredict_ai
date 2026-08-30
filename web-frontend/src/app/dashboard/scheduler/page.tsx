"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "../../../services/api";
import CustomDropdown from "../../../components/CustomDropdown";

import { useGoogleLogin } from "@react-oauth/google";
import BorderGlow from "@/components/BorderGlow";

interface Reminder {
  id: string;
  type: string;
  date: string;
  notes: string;
  centerName?: string;
  centerAddress?: string;
  centerLat?: number;
  centerLon?: number;
  consultationType?: string;
  timeSlot?: string;
  bookingRef?: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
}

export default function SchedulerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<"tests" | "medications">("tests");

  // Tests state
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newReminderType, setNewReminderType] = useState("DIABETES");
  const [newReminderDate, setNewReminderDate] = useState("");
  const [newReminderNotes, setNewReminderNotes] = useState("");

  // Medications state
  const [medications, setMedications] = useState<Medication[]>([]);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedTime, setNewMedTime] = useState("");

  const [googleToken, setGoogleToken] = useState<string | null>(null);

  const connectGoogle = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setGoogleToken(codeResponse.access_token);
    },
    scope: 'https://www.googleapis.com/auth/calendar.events',
  });

  useEffect(() => {
    const activeUser = getUser();
    if (!activeUser) {
      router.push("/login");
      return;
    }
    setUser(activeUser);

    const loadRemindersAndMeds = () => {
      const savedReminders = localStorage.getItem("mediReminders");
      if (savedReminders) {
        setReminders(JSON.parse(savedReminders));
      }

      const savedMeds = localStorage.getItem("mediMedications");
      if (savedMeds) {
        setMedications(JSON.parse(savedMeds));
      }
    };

    loadRemindersAndMeds();

    const handleFocus = () => {
      loadRemindersAndMeds();
    };

    window.addEventListener("focus", handleFocus);

    // Request notification permission for medication reminders
    if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission();
    }

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [router]);

  // Interval for checking medication times
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeString = `${currentHours}:${currentMinutes}`;
      
      if (now.getSeconds() === 0) { // Trigger only once when seconds hit 0
        medications.forEach(med => {
          if (med.time === currentTimeString) {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("💊 Medication Reminder", {
                body: `It is time to take your ${med.name} ${med.dosage ? `(${med.dosage})` : ''}.`,
              });
            } else {
              // Fallback to browser alert if notifications are blocked but app is open
              alert(`💊 Medication Reminder: It is time to take your ${med.name} ${med.dosage ? `(${med.dosage})` : ''}.`);
            }
          }
        });
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [medications]);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderDate) return;

    const newRem: Reminder = {
      id: Date.now().toString(),
      type: newReminderType,
      date: newReminderDate,
      notes: newReminderNotes
    };

    const updated = [...reminders, newRem].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setReminders(updated);
    localStorage.setItem("mediReminders", JSON.stringify(updated));

    if (googleToken) {
      try {
        const event = {
          summary: newRem.type.replace("_", " ") + " Assessment",
          description: newRem.notes || "Auto-synced from MediPredict",
          start: { date: newRem.date },
          end: { date: newRem.date }
        };
        await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${googleToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event)
        });
        alert("✅ Automatically synced to Google Calendar!");
      } catch (err) {
        console.error("Google Sync failed", err);
      }
    }

    setNewReminderDate("");
    setNewReminderNotes("");
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName || !newMedTime) return;

    const newMed: Medication = {
      id: Date.now().toString(),
      name: newMedName,
      dosage: newMedDosage,
      time: newMedTime
    };

    const updated = [...medications, newMed].sort((a, b) => a.time.localeCompare(b.time));
    setMedications(updated);
    localStorage.setItem("mediMedications", JSON.stringify(updated));

    if (googleToken) {
      try {
        const now = new Date();
        const [hours, minutes] = newMed.time.split(":");
        now.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // If the time has already passed today, set the first occurrence to tomorrow
        if (now.getTime() < Date.now()) {
          now.setDate(now.getDate() + 1);
        }

        const event = {
          summary: `💊 Take ${newMed.name} ${newMed.dosage}`,
          description: "Auto-synced daily regimen from MediPredict Tracker",
          start: { dateTime: now.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          end: { dateTime: new Date(now.getTime() + 15 * 60000).toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          recurrence: [
            "RRULE:FREQ=DAILY"
          ],
          reminders: {
            useDefault: false,
            overrides: [
              { method: "popup", minutes: 0 }
            ]
          }
        };
        await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${googleToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event)
        });
        alert("✅ Daily medication synced to Google Calendar!");
      } catch (err) {
        console.error("Google Sync failed", err);
      }
    }

    setNewMedName("");
    setNewMedDosage("");
    setNewMedTime("");
  };

  const handleDeleteReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    localStorage.setItem("mediReminders", JSON.stringify(updated));
  };

  const handleDeleteMedication = (id: string) => {
    const updated = medications.filter(m => m.id !== id);
    setMedications(updated);
    localStorage.setItem("mediMedications", JSON.stringify(updated));
  };

  const handleNavigateToCenter = (rem: Reminder) => {
    if (rem.centerName) {
      sessionStorage.setItem(
        "route_target_center",
        JSON.stringify({
          id: rem.id,
          name: rem.centerName,
          address: rem.centerAddress || "",
          lat: rem.centerLat,
          lon: rem.centerLon,
          assignedDisease: rem.type
        })
      );
    }
    router.push("/dashboard/centers");
  };

  if (!user) return null;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
        <div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>DIAGNOSTIC & REGIMEN CALENDAR</span>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#1e293b", marginTop: "8px" }}>
            Scheduler & Tracker
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", maxWidth: "600px" }}>
            Manage upcoming biological checks, specialist consultations, and daily medication regimens.
          </p>
        </div>
        <div>
          {!googleToken ? (
            <button onClick={() => connectGoogle()} className="btn-3d-secondary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Enable Auto-Sync
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid var(--success)", color: "var(--success)", padding: "10px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700 }}>
              ✅ Google Calendar Connected
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("tests")}
          style={{
            background: activeTab === "tests" ? "var(--primary)" : "#f1f5f9",
            border: "1px solid",
            borderColor: activeTab === "tests" ? "var(--primary)" : "#cbd5e1",
            color: activeTab === "tests" ? "#ffffff" : "#475569",
            padding: "10px 24px",
            borderRadius: "8px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          Diagnostic Tests
        </button>
        <button
          onClick={() => setActiveTab("medications")}
          style={{
            background: activeTab === "medications" ? "var(--primary)" : "#f1f5f9",
            border: "1px solid",
            borderColor: activeTab === "medications" ? "var(--primary)" : "#cbd5e1",
            color: activeTab === "medications" ? "#ffffff" : "#475569",
            padding: "10px 24px",
            borderRadius: "8px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          Medication Tracker
        </button>
      </div>

      <div className="card-3d">
        {activeTab === "tests" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "30px" }}>
            {/* Scheduler Form */}
            <form onSubmit={handleAddReminder} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e293b", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
                New Test Schedule
              </h3>
              
              <CustomDropdown
                options={[
                  { value: "DIABETES", label: "Diabetes Risk Test" },
                  { value: "HEART_DISEASE", label: "Cardio Screening" },
                  { value: "LIVER_DISEASE", label: "Hepatic Function Check" },
                  { value: "KIDNEY_DISEASE", label: "Renal Clearance Test" },
                  { value: "THYROID_DISEASE", label: "Thyroid Function Test" },
                  { value: "PULMONARY_DISEASE", label: "Pulmonary Risk Test" },
                  { value: "STROKE", label: "Stroke Risk Telemetry" },
                  { value: "ANEMIA", label: "Anemia Screening Check" }
                ]}
                value={newReminderType}
                onChange={setNewReminderType}
                label="Target Health Category"
              />

              <div>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                  Follow-Up Test Date
                </label>
                <input
                  type="date"
                  className="input-3d"
                  value={newReminderDate}
                  onChange={(e) => setNewReminderDate(e.target.value)}
                  required
                  style={{ colorScheme: "light" }}
                />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
                  Laboratory Notes
                </label>
                <input
                  type="text"
                  className="input-3d"
                  value={newReminderNotes}
                  onChange={(e) => setNewReminderNotes(e.target.value)}
                  placeholder="e.g. Fasting report for clinical review"
                />
              </div>

              <button type="submit" className="btn-3d" style={{ width: "100%", marginTop: "10px" }}>
                Add to Calendar
              </button>
            </form>

            {/* Reminders List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e293b", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
                Upcoming Test Reminders
              </h3>
              
              {reminders.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)", background: "rgba(248,250,252,0.8)", border: "1px dashed var(--border)", borderRadius: "10px" }}>
                  <span style={{ fontSize: "1.8rem", display: "block", marginBottom: "10px" }}>📅</span>
                  <p style={{ fontSize: "0.85rem" }}>No upcoming diagnostic checks scheduled.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "350px", overflowY: "auto", paddingRight: "5px" }}>
                  {reminders.map((rem) => {
                    const diffTime = Math.ceil((new Date(rem.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    const isOverdue = diffTime < 0;
                    
                    const formattedDate = rem.date.replace(/-/g, "");
                    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(rem.type.replace("_", " ") + " Appointment")}&dates=${formattedDate}/${formattedDate}&details=${encodeURIComponent(rem.notes || "Medical Appointment booked via MediPredict AI")}`;

                    const isHospitalVisit = !!rem.centerName;

                    return (
                      <div key={rem.id} style={{
                        background: isHospitalVisit ? "#f0fdf4" : "#f8fafc",
                        border: "1px solid",
                        borderColor: isHospitalVisit ? "#bbf7d0" : "#e2e8f0",
                        borderRadius: "10px",
                        padding: "16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "12px"
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>
                              {rem.centerName || rem.type.replace("_", " ")}
                            </span>
                            {rem.consultationType && (
                              <span style={{
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "12px",
                                background: rem.consultationType === "HOSPITAL_VISIT" ? "#dcfce7" : "#f3e8ff",
                                border: "1px solid",
                                borderColor: rem.consultationType === "HOSPITAL_VISIT" ? "#86efac" : "#d8b4fe",
                                color: rem.consultationType === "HOSPITAL_VISIT" ? "#166534" : "#7e22ce"
                              }}>
                                {rem.consultationType === "HOSPITAL_VISIT" ? "🏥 In-Person Hospital Visit" : "💻 Virtual Telehealth"}
                              </span>
                            )}
                          </div>

                          {rem.bookingRef && (
                            <div style={{ fontSize: "0.75rem", color: "#60a5fa", fontWeight: 700, marginBottom: "4px" }}>
                              Booking Ref: {rem.bookingRef}
                            </div>
                          )}

                          {rem.centerAddress && (
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                              📍 {rem.centerAddress}
                            </div>
                          )}

                          {rem.notes && (
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                              {rem.notes}
                            </div>
                          )}

                          <div style={{ fontSize: "0.75rem", color: isOverdue ? "var(--error)" : "var(--primary)", marginTop: "6px", fontWeight: 700 }}>
                            {isOverdue 
                              ? `⚠️ OVERDUE BY ${Math.abs(diffTime)} DAYS` 
                              : `🕒 Scheduled in ${diffTime} days (${new Date(rem.date).toLocaleDateString()}${rem.timeSlot ? ` @ ${rem.timeSlot}` : ""})`}
                          </div>

                          <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {isHospitalVisit && (
                              <button
                                onClick={() => handleNavigateToCenter(rem)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  color: "#fff",
                                  background: "var(--primary)",
                                  border: "none",
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  transition: "all 0.2s"
                                }}
                              >
                                📍 Navigate to Hospital
                              </button>
                            )}

                            <a 
                              href={gcalUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                color: "#fff",
                                background: "rgba(59, 130, 246, 0.15)",
                                border: "1px solid rgba(59, 130, 246, 0.3)",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                textDecoration: "none",
                                transition: "all 0.2s"
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              Google Calendar
                            </a>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteReminder(rem.id)}
                          style={{ background: "none", border: "none", color: "rgba(255,51,102,0.6)", cursor: "pointer", fontSize: "1.1rem", padding: "4px" }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "30px" }}>
            {/* Medication Form */}
            <form onSubmit={handleAddMedication} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#263238", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
                Add Daily Medication
              </h3>
              
              <div>
                <label style={{ display: "block", color: "#475569", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>
                  Medication Name
                </label>
                <input
                  type="text"
                  className="input-3d"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  placeholder="e.g. Levothyroxine"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", color: "#475569", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>
                  Dosage / Instructions
                </label>
                <input
                  type="text"
                  className="input-3d"
                  value={newMedDosage}
                  onChange={(e) => setNewMedDosage(e.target.value)}
                  placeholder="e.g. 50mcg, before breakfast"
                />
              </div>

              <div>
                <label style={{ display: "block", color: "#475569", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>
                  Daily Time
                </label>
                <input
                  type="time"
                  className="input-3d"
                  value={newMedTime}
                  onChange={(e) => setNewMedTime(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-3d" style={{ width: "100%", marginTop: "10px" }}>
                Add to Tracker & Calendar
              </button>
            </form>

            {/* Medications List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#263238", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
                Current Regimen
              </h3>
              
              {medications.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#64748B", background: "#FFFFFF", border: "1px dashed var(--border)", borderRadius: "14px" }}>
                  <span style={{ fontSize: "1.8rem", display: "block", marginBottom: "10px" }}>💊</span>
                  <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>No daily medications tracked.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "350px", overflowY: "auto", paddingRight: "5px" }}>
                  {medications.map((med) => {
                    return (
                      <div key={med.id} style={{
                        background: "#FFFFFF",
                        border: "1px solid var(--border)",
                        borderRadius: "14px",
                        padding: "16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            background: "rgba(16, 185, 129, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.5rem"
                          }}>
                            💊
                          </div>
                          <div>
                            <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#263238" }}>
                              {med.name}
                            </div>
                            {med.dosage && (
                              <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: "2px", fontWeight: 500 }}>
                                {med.dosage}
                              </div>
                            )}
                            <div style={{ fontSize: "0.8rem", color: "var(--primary)", marginTop: "6px", fontWeight: 800 }}>
                              🕒 Every day at {med.time}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteMedication(med.id)}
                          style={{ background: "none", border: "none", color: "rgba(255,51,102,0.6)", cursor: "pointer", fontSize: "1.1rem", padding: "4px" }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
