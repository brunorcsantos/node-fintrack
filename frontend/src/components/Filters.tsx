// src/components/Filters.tsx
import { useState, useEffect } from "react";
import type { Category } from "../lib/api";
import { S } from "../styles";

interface FiltersProps {
  categories: Category[];
  filterMonth: string;
  filterCategory: string;
  setFilterMonth: (month: string) => void;
  setFilterCategory: (category: string) => void;
}

export default function Filters({
  categories,
  filterMonth,
  filterCategory,
  setFilterMonth,
  setFilterCategory,
}: FiltersProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{
      background: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-subtle)",
      padding: isMobile ? "10px 16px" : "10px 24px",
      display: "flex",
      flexWrap: "wrap" as const,
      gap: 8,
      alignItems: "center",
    }}>
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        color: "var(--text-muted)",
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        marginRight: 4,
      }}>
        Filtrar:
      </span>

      <input
        type="month"
        value={filterMonth}
        onChange={(e) => setFilterMonth(e.target.value)}
        style={{
          ...S.input,
          width: "auto",
          padding: "6px 12px",
          fontSize: 13,
          flex: isMobile ? "1" : "none",
          minWidth: 140,
        }}
      />

      <select
        value={filterCategory}
        onChange={(e) => setFilterCategory(e.target.value)}
        style={{
          ...S.select,
          width: "auto",
          padding: "6px 12px",
          fontSize: 13,
          flex: isMobile ? "1" : "none",
          minWidth: 160,
        }}
      >
        <option value="all">Todas as categorias</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.icon} {c.name}
          </option>
        ))}
      </select>

      {/* Botão limpar filtros */}
      {filterCategory !== "all" && (
        <button
          onClick={() => setFilterCategory("all")}
          style={{
            padding: "6px 12px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-default)",
            background: "transparent",
            color: "var(--accent-red)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ✕ Limpar
        </button>
      )}
    </div>
  );
}