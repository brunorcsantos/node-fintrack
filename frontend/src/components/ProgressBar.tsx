// src/components/ProgressBar.tsx
interface ProgressBarProps {
  value: number;
  max: number;
  color: string;
}

export default function ProgressBar({ value, max, color }: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const over = value > max;

  return (
    <div style={{
      background: "var(--bg-elevated)",
      borderRadius: "var(--radius-full)",
      height: 7,
      overflow: "hidden",
    }}>
      <div style={{
        width: `${pct}%`,
        height: "100%",
        borderRadius: "var(--radius-full)",
        background: over ? "var(--accent-red)" : color,
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}