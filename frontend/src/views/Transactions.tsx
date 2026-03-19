// src/views/Transactions.tsx
import { useState, useEffect } from "react";
import type { Category, Transaction } from "../lib/api";
import { S } from "../styles";
import { fmt, fmtDate } from "../helpers";
import Badge from "../components/Badge";

interface TransactionsProps {
  filteredTx: Transaction[];
  categories: Category[];
  totalIncome: number;
  totalExpenses: number;
  deleteTransaction: (id: string) => void;
}

export default function Transactions({
  filteredTx,
  categories,
  totalIncome,
  totalExpenses,
  deleteTransaction,
}: TransactionsProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16 }}>

      {/* Cabeçalho */}
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row" as const,
        justifyContent: "space-between",
        alignItems: isMobile ? "flex-start" : "center",
        gap: 12,
      }}>
        <h2 style={{ ...S.pageTitle, fontSize: isMobile ? 18 : 22 }}>
          Lançamentos
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)", marginLeft: 8 }}>
            {filteredTx.length} registros
          </span>
        </h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          <Badge>{fmt(totalIncome)} receitas</Badge>
          <Badge color="var(--accent-red)">{fmt(totalExpenses)} despesas</Badge>
        </div>
      </div>

      {/* Lista */}
      <div style={isMobile ? S.cardMobile : S.card}>
        {filteredTx.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 60, fontSize: 14 }}>
            Nenhum lançamento para o período selecionado.
          </div>
        ) : (
          filteredTx
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              const sub = cat?.subcategories.find((s) => s.id === tx.subcategoryId);
              return (
                <div key={tx.id} style={{ ...S.txRow, gap: isMobile ? 10 : 14 }}>

                  {/* Ícone */}
                  <div style={{
                    width: isMobile ? 34 : 40,
                    height: isMobile ? 34 : 40,
                    borderRadius: "var(--radius-md)",
                    background: (cat?.color || "#888") + "22",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isMobile ? 16 : 18,
                    flexShrink: 0,
                  }}>
                    {sub?.icon || cat?.icon}
                  </div>

                  {/* Descrição + badges */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: isMobile ? 13 : 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap" as const,
                    }}>
                      {tx.description}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" as const, alignItems: "center" }}>
                      <span style={S.pill(cat?.color || "#888")}>{cat?.name}</span>
                      {sub && !isMobile && <span style={S.pill("var(--text-muted)")}>{sub.name}</span>}
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmtDate(tx.date)}</span>
                    </div>
                  </div>

                  {/* Valor */}
                  <span style={{
                    fontWeight: 800,
                    fontSize: isMobile ? 13 : 15,
                    color: tx.type === "income" ? "var(--accent-green)" : "var(--accent-red)",
                    flexShrink: 0,
                  }}>
                    {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                  </span>

                  {/* Remover */}
                  <button
                    onClick={() => deleteTransaction(tx.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      fontSize: 14,
                      padding: 4,
                      borderRadius: "var(--radius-sm)",
                      flexShrink: 0,
                      transition: "color 0.15s",
                    }}
                    title="Remover"
                  >
                    ✕
                  </button>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}