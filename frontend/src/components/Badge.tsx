// src/components/Badge.tsx
import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  color?: string;
}

export default function Badge({ children, color }: BadgeProps) {
  return (
    <span style={{
      background: color ? color + "22" : "var(--bg-elevated)",
      color: color || "var(--text-secondary)",
      borderRadius: "var(--radius-full)",
      padding: "4px 12px",
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: "0.02em",
      border: `1px solid ${color ? color + "33" : "var(--border-default)"}`,
      whiteSpace: "nowrap" as const,
    }}>
      {children}
    </span>
  );
}