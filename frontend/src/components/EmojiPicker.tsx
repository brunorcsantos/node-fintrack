// src/components/EmojiPicker.tsx
import { useEffect, useRef, useState } from "react";
import "emoji-picker-element";

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || !pickerRef.current) return;

    const container = pickerRef.current;

    // Cria o web component
    const picker = document.createElement("emoji-picker") as any;
    picker.style.width = "100%";
    picker.style.height = "300px";
    picker.setAttribute("locale", "pt");

    // Aplica tema baseado no CSS variable
    const isDark = getComputedStyle(document.documentElement)
      .getPropertyValue("--bg-base").trim().startsWith("#0");
    picker.setAttribute("class", isDark ? "dark" : "light");

    picker.addEventListener("emoji-click", (e: any) => {
      onChange(e.detail.unicode);
      setOpen(false);
    });

    container.appendChild(picker);

    return () => {
      container.removeChild(picker);
    };
  }, [open, onChange]);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        pickerRef.current && !pickerRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div style={{ position: "relative" as const }}>
      {/* Botão de seleção */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-default)",
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          cursor: "pointer",
          fontSize: 14,
          fontFamily: "inherit",
          width: "100%",
          transition: "border-color 0.15s",
        }}
      >
        <span style={{ fontSize: 22 }}>{value}</span>
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Clique para escolher o ícone
        </span>
        <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 12 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {/* Dropdown do picker */}
      {open && (
        <div
          ref={pickerRef}
          style={{
            position: "absolute" as const,
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 300,
            width: "100%",
            minWidth: 300,
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-default)",
            overflow: "hidden",
            boxShadow: "var(--shadow-lg)",
          }}
        />
      )}
    </div>
  );
}
