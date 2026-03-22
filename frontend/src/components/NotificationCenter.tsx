// src/components/NotificationCenter.tsx
import { useState, useRef, useEffect } from "react";
import type { Notification } from "../lib/api";

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
  onDeleteRead: () => void;
}

const typeIcon = (type: Notification["type"]) => {
  switch (type) {
    case "invoice_due":      return "💳";
    case "budget_alert":     return "⚠️";
    case "recurring_pending": return "🔔";
    case "promotion":        return "🎉";
    case "custom":           return "📌";
  }
};

const typeColor = (type: Notification["type"]) => {
  switch (type) {
    case "invoice_due":      return "var(--accent-blue)";
    case "budget_alert":     return "var(--accent-orange, #E8C45A)";
    case "recurring_pending": return "var(--accent-green)";
    case "promotion":        return "var(--accent-red)";
    case "custom":           return "var(--text-muted)";
  }
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  return `${days}d atrás`;
}

export default function NotificationCenter({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onDeleteRead,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" as const }}>

      {/* Botão sino */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "relative" as const,
          background: "none",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-md)",
          width: 36, height: 36,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: 16,
          color: "var(--text-secondary)",
          transition: "all 0.15s",
        }}
        title="Notificações"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute" as const,
            top: -4, right: -4,
            background: "var(--accent-red)",
            color: "#fff",
            borderRadius: "var(--radius-full)",
            fontSize: 10, fontWeight: 700,
            minWidth: 16, height: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px",
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "fixed" as const,
          top: 60,
          right: 8,
          left: 8,
          width: "auto",
          maxWidth: 380,
          marginLeft: "auto",
          maxHeight: 480,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg, 0 8px 32px rgba(0,0,0,0.18))",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>

          {/* Cabeçalho */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 16px",
            borderBottom: "1px solid var(--border-subtle)",
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              Notificações
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: 8, fontSize: 11, fontWeight: 700,
                  background: "var(--accent-blue)22", color: "var(--accent-blue)",
                  borderRadius: "var(--radius-full)", padding: "2px 8px",
                }}>
                  {unreadCount} nova{unreadCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 11, color: "var(--accent-blue)", fontWeight: 600, padding: 0,
                  }}
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
          </div>

          {/* Lista */}
          <div style={{ overflowY: "auto" as const, flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "40px 16px",
                color: "var(--text-muted)", fontSize: 13,
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                Nenhuma notificação
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && onMarkRead(n.id)}
                  style={{
                    display: "flex", gap: 12, padding: "12px 16px",
                    borderBottom: "1px solid var(--border-subtle)",
                    background: n.read ? "transparent" : "var(--accent-blue)08",
                    cursor: n.read ? "default" : "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  {/* Ícone */}
                  <div style={{
                    width: 36, height: 36, flexShrink: 0,
                    borderRadius: "var(--radius-md)",
                    background: typeColor(n.type) + "22",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18,
                  }}>
                    {typeIcon(n.type)}
                  </div>

                  {/* Conteúdo */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: n.read ? 500 : 700,
                      color: "var(--text-primary)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                    }}>
                      {n.title}
                    </div>
                    <div style={{
                      fontSize: 12, color: "var(--text-muted)", marginTop: 2,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                    }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>

                  {/* Indicador não lida + botão remover */}
                  <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {!n.read && (
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: "var(--accent-blue)", flexShrink: 0,
                      }} />
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--text-muted)", fontSize: 12, padding: 2,
                        lineHeight: 1,
                      }}
                      title="Remover"
                    >✕</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Rodapé */}
          {notifications.some((n) => n.read) && (
            <div style={{
              padding: "10px 16px",
              borderTop: "1px solid var(--border-subtle)",
              textAlign: "center" as const,
            }}>
              <button
                onClick={onDeleteRead}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, color: "var(--text-muted)", fontWeight: 600,
                }}
              >
                Limpar notificações lidas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}