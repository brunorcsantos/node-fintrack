// src/components/Header.tsx
import { useState, useEffect } from "react";
import type { View } from "../types";
import { S } from "../styles";
import { useTheme } from "../context/ThemeContext";
import NotificationCenter from "./NotificationCenter";
import type { Notification } from "../lib/api";

interface HeaderProps {
  view: View;
  setView: (view: View) => void;
  onLogout: () => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDeleteNotification: (id: string) => void;
  onDeleteReadNotifications: () => void;
}

const NAV_ITEMS: { view: View; label: string; icon: string }[] = [
  { view: "dashboard", label: "Visão Geral", icon: "📊" },
  { view: "transactions", label: "Lançamentos", icon: "📋" },
  { view: "budgets", label: "Orçamentos", icon: "🎯" },
  { view: "reports", label: "Relatórios", icon: "📈" },
  { view: "setup", label: "Configurações", icon: "⚙️" },
];

export default function Header({
  view,
  setView,
  onLogout,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
  onDeleteReadNotifications,
}: HeaderProps) {
  const { toggleTheme, isDark } = useTheme();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNavClick = (v: View) => {
    setView(v);
    setMenuOpen(false);
  };

  return (
    <>
      <header style={S.header}>
        {/* Logo */}
        <div style={S.logo}>
          <span style={{ fontSize: 22 }}>💰</span>
          <span>FinTrack</span>
        </div>

        {/* Nav Desktop */}
        {!isMobile && (
          <nav style={S.nav}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.view}
                style={S.navBtn(view === item.view)}
                onClick={() => handleNavClick(item.view)}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        )}

        {/* Ações */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginLeft: isMobile ? "auto" : 16,
          }}
        >
          {/* Novo lançamento — apenas desktop */}
          {/* {!isMobile && (
            <button
              style={{
                ...S.btn("primary"),
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              onClick={() => setShowAddModal(true)}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
              Novo Lançamento
            </button>
          )} */}

          {/* Centro de notificações */}
          <NotificationCenter
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkRead={onMarkRead}
            onMarkAllRead={onMarkAllRead}
            onDelete={onDeleteNotification}
            onDeleteRead={onDeleteReadNotifications}
          />

          {/* Toggle tema */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Modo claro" : "Modo escuro"}
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-default)",
              background: "transparent",
              cursor: "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
              transition: "all 0.15s",
            }}
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {/* Logout — apenas desktop */}
          {!isMobile && (
            <button
              onClick={onLogout}
              title="Sair"
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-default)",
                background: "transparent",
                cursor: "pointer",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                transition: "all 0.15s",
              }}
            >
              🚪
            </button>
          )}

          {/* Hamburger — apenas mobile */}
          {isMobile && (
            <button
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-default)",
                background: "transparent",
                cursor: "pointer",
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-secondary)",
              }}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          )}
        </div>
      </header>

      {/* Menu mobile dropdown */}
      {isMobile && menuOpen && (
        <div
          style={{
            background: "var(--bg-surface)",
            borderBottom: "1px solid var(--border-subtle)",
            padding: "8px 16px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            boxShadow: "var(--shadow-md)",
            position: "sticky" as const,
            top: 60,
            zIndex: 99,
          }}
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              onClick={() => handleNavClick(item.view)}
              style={{
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                textAlign: "left" as const,
                display: "flex",
                alignItems: "center",
                gap: 10,
                background:
                  view === item.view ? "var(--accent-blue)" : "transparent",
                color: view === item.view ? "#ffffff" : "var(--text-secondary)",
                transition: "all 0.15s",
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div
            style={{
              height: 1,
              background: "var(--border-subtle)",
              margin: "8px 0",
            }}
          />

          {/* <button
            onClick={() => {
              setShowAddModal(true);
              setMenuOpen(false);
            }}
            style={{
              ...S.btn("primary"),
              width: "100%",
              textAlign: "center" as const,
              justifyContent: "center",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            + Novo Lançamento
          </button> */}

          <button
            onClick={onLogout}
            style={{
              ...S.btn("ghost"),
              width: "100%",
              textAlign: "center" as const,
              justifyContent: "center",
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "var(--accent-red)",
            }}
          >
            🚪 Sair
          </button>
        </div>
      )}
    </>
  );
}
