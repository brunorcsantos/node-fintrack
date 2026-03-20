// src/components/TransactionList.tsx
import { useMemo } from "react";
import type { Category, Transaction } from "../lib/api";
import { S } from "../styles";
import { fmt, fmtDate } from "../helpers";
import Pagination from "./Pagination";

interface TransactionListProps {
  filteredTx: Transaction[];
  categories: Category[];
  filterSubcategory: string;
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  hasActiveFilters: boolean;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
  isMobile: boolean;
}

export default function TransactionList({
  filteredTx,
  categories,
  filterSubcategory,
  total,
  page,
  totalPages,
  limit,
  hasActiveFilters,
  onEdit,
  onDelete,
  onPageChange,
  isMobile,
}: TransactionListProps) {
  const displayedTx = useMemo(() => {
    return filteredTx
      .filter((tx) => filterSubcategory === "all" || tx.subcategoryId === filterSubcategory)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredTx, filterSubcategory]);

  if (displayedTx.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 60, fontSize: 14 }}>
        Nenhum lançamento encontrado.
      </div>
    );
  }

  return (
    <>
      {displayedTx.map((tx) => {
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
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: isMobile ? 16 : 18, flexShrink: 0,
            }}>
              {sub?.icon || cat?.icon}
            </div>

            {/* Descrição + badges */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: isMobile ? 13 : 14, fontWeight: 600,
                color: "var(--text-primary)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
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
              fontWeight: 800, fontSize: isMobile ? 13 : 15,
              color: tx.type === "income" ? "var(--accent-green)" : "var(--accent-red)",
              flexShrink: 0,
            }}>
              {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
            </span>

            {/* Editar */}
            <button onClick={() => onEdit(tx)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)", fontSize: 14, padding: 4,
              borderRadius: "var(--radius-sm)", flexShrink: 0,
            }} title="Editar">✏️</button>

            {/* Remover */}
            <button onClick={() => onDelete(tx.id)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)", fontSize: 14, padding: 4,
              borderRadius: "var(--radius-sm)", flexShrink: 0,
              transition: "color 0.15s",
            }} title="Remover">✕</button>
          </div>
        );
      })}

      {!hasActiveFilters && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
}