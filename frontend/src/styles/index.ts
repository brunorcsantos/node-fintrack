// src/styles/index.ts
// Todos os valores usam CSS variables definidas no ThemeContext

export const S = {
  // ── Layout ────────────────────────────────────────────────────────────────
  app: {
    minHeight: "100vh",
    background: "var(--bg-base)",
    color: "var(--text-primary)",
    fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
    display: "flex",
    flexDirection: "column" as const,
    transition: "background 0.2s, color 0.2s",
  },

  main: {
    flex: 1,
    padding: "24px",
    maxWidth: 1200,
    margin: "0 auto",
    width: "100%",
  },

  mainMobile: {
    flex: 1,
    padding: "16px",
    width: "100%",
  },

  // ── Cards ─────────────────────────────────────────────────────────────────
  card: {
    background: "var(--bg-surface)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-subtle)",
    padding: 24,
    boxShadow: "var(--shadow-sm)",
    transition: "box-shadow 0.2s",
  },

  cardMobile: {
    background: "var(--bg-surface)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-subtle)",
    padding: 16,
    boxShadow: "var(--shadow-sm)",
  },

  statCard: (color: string) => ({
    background: "var(--bg-surface)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-subtle)",
    borderLeft: `4px solid ${color}`,
    padding: "20px 24px",
    boxShadow: "var(--shadow-sm)",
  }),

  // ── Grids ─────────────────────────────────────────────────────────────────
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },

  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 16,
  },

  grid2Mobile: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
  },

  grid3Mobile: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
  },

  // ── Tipografia ────────────────────────────────────────────────────────────
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: 6,
  },

  value: {
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: 16,
    letterSpacing: "-0.01em",
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "-0.02em",
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    background: "var(--bg-surface)",
    borderBottom: "1px solid var(--border-subtle)",
    padding: "0 24px",
    height: 60,
    display: "flex",
    alignItems: "center",
    gap: 8,
    position: "sticky" as const,
    top: 0,
    zIndex: 100,
    boxShadow: "var(--shadow-sm)",
  },

  logo: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    color: "var(--text-primary)",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  nav: {
    display: "flex",
    gap: 2,
    marginLeft: "auto",
  },

  navBtn: (active: boolean) => ({
    padding: "7px 14px",
    borderRadius: "var(--radius-md)",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    background: active ? "var(--accent-blue)" : "transparent",
    color: active ? "var(--text-inverse)" : "var(--text-muted)",
    transition: "all 0.15s",
    whiteSpace: "nowrap" as const,
  }),

  // ── Botões ────────────────────────────────────────────────────────────────
  btn: (variant: "primary" | "ghost" | "danger") => ({
    padding: "9px 18px",
    borderRadius: "var(--radius-md)",
    border: variant === "ghost" ? "1px solid var(--border-default)" : "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    transition: "all 0.15s",
    background:
      variant === "primary"
        ? "var(--accent-blue)"
        : variant === "danger"
          ? "transparent"
          : "transparent",
    color:
      variant === "primary"
        ? "#ffffff"
        : variant === "danger"
          ? "var(--accent-red)"
          : "var(--text-secondary)",
    boxShadow: variant === "primary" ? "var(--shadow-sm)" : "none",
  }),

  // ── Inputs ────────────────────────────────────────────────────────────────
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "var(--radius-md)",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    color: "var(--text-primary)",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s",
  },

  select: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "var(--radius-md)",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    color: "var(--text-primary)",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box" as const,
    cursor: "pointer",
  },

  // ── Transações ────────────────────────────────────────────────────────────
  txRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 0",
    borderBottom: "1px solid var(--border-subtle)",
    transition: "background 0.15s",
  },

  pill: (color: string) => ({
    background: color + "22",
    color,
    borderRadius: "var(--radius-full)",
    padding: "3px 10px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.02em",
  }),

  // ── Modal ─────────────────────────────────────────────────────────────────
  modal: {
    position: "fixed" as const,
    inset: 0,
    background: "var(--bg-overlay)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
    padding: 16,
    backdropFilter: "blur(4px)",
  },

  modalBox: {
    background: "var(--bg-surface)",
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--border-default)",
    padding: 28,
    width: "100%",
    maxWidth: 480,
    boxShadow: "var(--shadow-lg)",
  },
};

// ── Hook de responsividade ─────────────────────────────────────────────────
export function useIsMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}