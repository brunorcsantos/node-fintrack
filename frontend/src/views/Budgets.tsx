// src/views/Budgets.tsx
import { useState, useEffect } from "react";
import type { Category, Transaction } from "../lib/api";
import { S } from "../styles";
import { fmt } from "../helpers";
import ProgressBar from "../components/ProgressBar";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { useBudgets } from "../hooks/useBudgets";

interface BudgetsProps {
  categories: Category[];
  filteredTx: Transaction[];
  expenseByCategory: Record<string, number>;
  filterMonth: string;
}

export default function Budgets({
  categories,
  filteredTx,
  expenseByCategory,
  filterMonth,
}: BudgetsProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { budgets, loading, error, upsertBudget, refetch } = useBudgets(filterMonth);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const budgetMap: Record<string, number> = {};
  budgets.forEach((b) => {
    if (b.categoryId && !b.subcategoryId) {
      budgetMap[b.categoryId] = Number(b.amount);
    }
  });

  const handleSaveBudget = async (categoryId: string) => {
    const amount = parseFloat(editingValue);
    if (!amount || amount <= 0) return;
    await upsertBudget(amount, categoryId);
    setEditingId(null);
    setEditingValue("");
  };

  if (loading) return <LoadingSpinner message="Carregando orçamentos..." />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 20 }}>

      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ ...S.pageTitle, fontSize: isMobile ? 18 : 22 }}>Orçamentos & Metas</h2>
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{filterMonth}</span>
      </div>

      {categories
        .filter((c) => c.slug !== "receita")
        .map((cat) => {
          const spent = expenseByCategory[cat.id] || 0;
          const budget = budgetMap[cat.id] || 0;
          const pct = budget ? Math.min((spent / budget) * 100, 100) : 0;
          const over = budget > 0 && spent > budget;
          const isEditing = editingId === cat.id;

          return (
            <div key={cat.id} style={isMobile ? S.cardMobile : S.card}>

              {/* Cabeçalho da categoria */}
              <div style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row" as const,
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "flex-start",
                gap: 12,
                marginBottom: 14,
              }}>
                {/* Info */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "var(--radius-md)",
                    background: cat.color + "22",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, flexShrink: 0,
                  }}>
                    {cat.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                      {cat.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {fmt(spent)} gasto
                      {budget > 0 ? ` de ${fmt(budget)}` : " · sem meta definida"}
                    </div>
                  </div>
                </div>

                {/* Percentual + edição */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: isMobile ? 52 : 0 }}>
                  {budget > 0 && !isEditing && (
                    <div style={{ textAlign: "right" as const }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: over ? "var(--accent-red)" : cat.color }}>
                        {pct.toFixed(0)}%
                      </div>
                      {over
                        ? <div style={{ fontSize: 11, color: "var(--accent-red)" }}>⚠ {fmt(spent - budget)} acima</div>
                        : <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmt(budget - spent)} disponível</div>
                      }
                    </div>
                  )}

                  {isEditing ? (
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" as const }}>
                      <input
                        style={{ ...S.input, width: isMobile ? "100%" : 120, padding: "6px 10px", fontSize: 13 }}
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveBudget(cat.id);
                          if (e.key === "Escape") { setEditingId(null); setEditingValue(""); }
                        }}
                      />
                      <button style={{ ...S.btn("primary"), padding: "6px 12px", fontSize: 12 }}
                        onClick={() => handleSaveBudget(cat.id)}>✓ Salvar</button>
                      <button style={{ ...S.btn("ghost"), padding: "6px 12px", fontSize: 12 }}
                        onClick={() => { setEditingId(null); setEditingValue(""); }}>✕</button>
                    </div>
                  ) : (
                    <button
                      style={{ ...S.btn("ghost"), padding: "6px 12px", fontSize: 12, whiteSpace: "nowrap" as const }}
                      onClick={() => { setEditingId(cat.id); setEditingValue(budget ? String(budget) : ""); }}
                    >
                      {budget > 0 ? "✏️ Editar meta" : "＋ Definir meta"}
                    </button>
                  )}
                </div>
              </div>

              {budget > 0 && <ProgressBar value={spent} max={budget} color={cat.color} />}

              {/* Subcategorias */}
              {cat.subcategories.length > 0 && (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  {cat.subcategories.map((sub) => {
                    const subSpent = filteredTx
                      .filter((t) => t.subcategoryId === sub.id && t.type === "expense")
                      .reduce((s, t) => s + t.amount, 0);

                    if (!subSpent) return null;

                    return (
                      <div key={sub.id} style={{ paddingLeft: 16, borderLeft: `2px solid ${cat.color}33` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                            {sub.icon} {sub.name}
                          </span>
                          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                            {fmt(subSpent)}
                          </span>
                        </div>
                        {budget > 0 && <ProgressBar value={subSpent} max={budget} color={cat.color} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}