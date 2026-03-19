// src/components/ColorPicker.tsx

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const PRESETS = [
  "#E8845A", "#5AB88A", "#5A8FE8", "#E85A7A",
  "#A85AE8", "#E8C45A", "#4CAF50", "#00BCD4",
  "#FF5722", "#9C27B0", "#3F51B5", "#009688",
  "#F06292", "#4DB6AC", "#FFB74D", "#90A4AE",
];

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* Input nativo + preview */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative" as const }}>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-default)",
              background: "var(--bg-elevated)",
              cursor: "pointer",
              padding: 2,
            }}
            title="Escolher cor personalizada"
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
            Cor selecionada
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>
            {value.toUpperCase()}
          </span>
        </div>
        <div style={{
          width: 36, height: 36,
          borderRadius: "var(--radius-md)",
          background: value,
          border: "1px solid var(--border-default)",
          flexShrink: 0,
        }} />
      </div>

      {/* Cores predefinidas */}
      <div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
          Sugestões
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          {PRESETS.map((color) => (
            <button
              key={color}
              onClick={() => onChange(color)}
              title={color}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "3px solid",
                borderColor: value === color ? "var(--text-primary)" : "transparent",
                background: color,
                cursor: "pointer",
                transition: "transform 0.15s, border-color 0.15s",
                transform: value === color ? "scale(1.15)" : "scale(1)",
              }}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
