"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import api, { clearSession, getUser } from "../../services/api";
import MediPredictAdvisor from "../../components/MediPredictAdvisor";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleUserUpdate = () => {
      const activeUser = getUser();
      if (activeUser) {
        setUser(activeUser);
        const isIncomplete = !activeUser.gender || !activeUser.dateOfBirth;
        if (isIncomplete && pathname !== "/dashboard/settings") {
          router.push("/dashboard/settings");
        }
      }
    };
    window.addEventListener("userUpdate", handleUserUpdate);

    const activeUser = getUser();
    if (!activeUser) {
      router.push("/login");
      return;
    }
    setUser(activeUser);

    const isIncomplete = !activeUser.gender || !activeUser.dateOfBirth;
    if (isIncomplete && pathname !== "/dashboard/settings") {
      router.push("/dashboard/settings");
    }

    return () => {
      window.removeEventListener("userUpdate", handleUserUpdate);
    };
  }, [router, pathname]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      clearSession();
      router.push("/");
    }
  };

  const getInitials = () => {
    if (!user) return "";
    const f = user.firstName ? user.firstName[0] : "";
    const l = user.lastName ? user.lastName[0] : "";
    return (f + l).toUpperCase();
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: "📊" },
    { label: "Predictor", href: "/dashboard/predictor", icon: "🧠" },
    { label: "Diet", href: "/dashboard/diet", icon: "🥗" },
    { label: "Exercise", href: "/dashboard/exercise", icon: "🏋️" },
    { label: "Scheduler", href: "/dashboard/scheduler", icon: "📅" },
    { label: "History", href: "/dashboard/history", icon: "📜" },
    { label: "Centers", href: "/dashboard/centers", icon: "🏥" },
    { label: "Settings", href: "/dashboard/settings", icon: "⚙️" },
  ];

  const isNavActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (href === "/dashboard/predictor") {
      return pathname.startsWith("/dashboard/predictor") || pathname.startsWith("/dashboard/assessment");
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  if (!user) return null;

  return (
    <div className="dashboard-wrapper" style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
      {/* Collapsible Hover Vertical Left Sidebar */}
      <aside
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        style={{
          width: isExpanded ? '260px' : '72px',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(226, 232, 240, 0.9)',
          boxShadow: isExpanded ? '8px 0 32px rgba(30, 136, 229, 0.12)' : '2px 0 12px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: isExpanded ? '24px 16px' : '24px 10px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
        }}
      >
        {/* Top Brand Header & Navigation Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Brand Logo & Title */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              padding: '0 4px',
              overflow: 'hidden',
            }}
            onClick={() => router.push('/dashboard')}
          >
            <div
              style={{
                position: 'relative',
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(30, 136, 229, 0.3)',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <img
                src="/logo.png"
                alt="Logo"
                style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }}
              />
            </div>
            {isExpanded && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.3px', color: '#1e293b' }}>
                  MediPredict
                </span>
                <span
                  style={{
                    background: 'linear-gradient(135deg, #1E88E5 0%, #38BDF8 100%)',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '6px',
                    boxShadow: '0 2px 8px rgba(30, 136, 229, 0.25)',
                    letterSpacing: '0.5px',
                  }}
                >
                  AI
                </span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navItems.map((item) => {
              const active = isNavActive(item.href);
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  title={!isExpanded ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isExpanded ? 'flex-start' : 'center',
                    gap: '12px',
                    width: '100%',
                    padding: isExpanded ? '12px 16px' : '12px 0',
                    borderRadius: '12px',
                    fontSize: '0.92rem',
                    fontWeight: active ? 800 : 600,
                    color: active ? '#FFFFFF' : '#475569',
                    background: active
                      ? 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)'
                      : 'transparent',
                    border: 'none',
                    boxShadow: active ? '0 4px 14px rgba(30, 136, 229, 0.3)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(241, 245, 249, 0.8)';
                      e.currentTarget.style.color = '#1e293b';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#475569';
                    }
                  }}
                >
                  <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{item.icon}</span>
                  {isExpanded && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile & Logout Controls */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(226, 232, 240, 0.8)',
            overflow: 'hidden',
          }}
        >
          {/* User Profile Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isExpanded ? 'flex-start' : 'center',
              gap: '12px',
              padding: isExpanded ? '10px 12px' : '8px 0',
              background: 'rgba(241, 245, 249, 0.7)',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              whiteSpace: 'nowrap',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1E88E5 0%, #2EBD85 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 800,
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(30, 136, 229, 0.2)',
              }}
            >
              {getInitials()}
            </div>

            {isExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: '#1e293b',
                    lineHeight: '1.2',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.firstName} {user.lastName}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#2ebd85',
                      boxShadow: '0 0 6px #2ebd85',
                    }}
                  ></span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>
                    {user.healthId || 'MP-PENDING'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            title={!isExpanded ? 'Sign Out' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: isExpanded ? '10px 16px' : '10px 0',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#e11d48',
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(225, 29, 72, 0.06)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ffe4e6';
              e.currentTarget.style.borderColor = '#fda4af';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff1f2';
              e.currentTarget.style.borderColor = '#fecdd3';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>🚪</span>
            {isExpanded && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Container */}
      <main
        className="main-content"
        style={{
          marginLeft: '72px',
          width: 'calc(100% - 72px)',
          minHeight: '100vh',
          padding: '32px 40px',
          position: 'relative',
        }}
      >
        {children}
      </main>

      {/* Slide-out Glassy Chatbot Panel */}
      <MediPredictAdvisor />
    </div>
  );
}
