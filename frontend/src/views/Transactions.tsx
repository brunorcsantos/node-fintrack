// src/views/Transactions.tsx
import { useState, useEffect, useMemo, useRef } from "react";
import type { Category, Transaction } from "../lib/api";
import { S } from "../styles";
import { fmt, fmtDate } from "../helpers";
import Badge from "../components/Badge";
import AddModal from "../components/AddModal";
import Pagination from "../components/Pagination";

interface TransactionsProps {
  filteredTx: Transaction[];
  categories: Category[];
  totalIncome: number;
  totalExpenses: number;
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  deleteTransaction: (id: string) => void;
  updateTransaction: (
    id: string,
    data: Omit<Transaction, "id" | "category" | "subcategory">,
  ) => void;
  onPageChange: (page: number) => void;
  filterType: "all" | "income" | "expense";
  setFilterType: (t: "all" | "income" | "expense") => void;
  filterCategoryLocal: string;
  setFilterCategoryLocal: (id: string) => void;
  filterSubcategory: string;
  setFilterSubcategory: (id: string) => void;
  search: string;
  setSearch: (s: string) => void;
}

export default function Transactions({
  filteredTx,
  categories,
  totalIncome,
  totalExpenses,
  total,
  page,
  totalPages,
  limit,
  deleteTransaction,
  updateTransaction,
  onPageChange,
  filterType,
  setFilterType,
  filterCategoryLocal,
  setFilterCategoryLocal,
  filterSubcategory,
  setFilterSubcategory,
  search,
  setSearch,
}: TransactionsProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
  if (searchRef.current) {
    const len = searchRef.current.value.length;
    searchRef.current.focus();
    searchRef.current.setSelectionRange(len, len);
  }
}, [filteredTx]);

  // Categoria local selecionada
  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === filterCategoryLocal),
    [categories, filterCategoryLocal],
  );

  // Categorias disponíveis para o tipo selecionado
  const availableCategories = useMemo(() => {
    if (filterType === "all") return [];
    const catIds = new Set(
      filteredTx
        .filter((tx) => tx.type === filterType)
        .map((tx) => tx.categoryId),
    );
    return categories.filter((c) => catIds.has(c.id));
  }, [filteredTx, filterType, categories]);

  // Subcategorias da categoria selecionada
  const availableSubcategories = useMemo(() => {
    if (!selectedCategory) return [];
    return selectedCategory.subcategories;
  }, [selectedCategory]);

  // Reset ao trocar tipo
  const handleTypeChange = (t: "all" | "income" | "expense") => {
    setFilterType(t);
    setFilterCategoryLocal("all");
    setFilterSubcategory("all");
  };

  // Reset subcategoria ao trocar categoria
  const handleCategoryChange = (catId: string) => {
    setFilterCategoryLocal(catId);
    setFilterSubcategory("all");
  };

  // Aplica apenas filtro de subcategoria localmente — demais filtros já vêm do backend
  const displayedTx = useMemo(() => {
    return filteredTx
      .filter(
        (tx) =>
          filterSubcategory === "all" || tx.subcategoryId === filterSubcategory,
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredTx, filterSubcategory]);

  const hasActiveFilters =
    filterType !== "all" ||
    filterCategoryLocal !== "all" ||
    filterSubcategory !== "all" ||
    !!search.trim();

  const pillActive = (active: boolean, color?: string) => ({
    padding: "6px 14px",
    borderRadius: "var(--radius-full)",
    border: "1px solid",
    borderColor: active
      ? color || "var(--accent-blue)"
      : "var(--border-default)",
    background: active
      ? color
        ? color + "22"
        : "var(--accent-blue)22"
      : "transparent",
    color: active ? color || "var(--accent-blue)" : "var(--text-muted)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    transition: "all 0.15s",
    whiteSpace: "nowrap" as const,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 12 : 16,
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : ("row" as const),
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          gap: 12,
        }}
      >
        <h2 style={{ ...S.pageTitle, fontSize: isMobile ? 18 : 22 }}>
          Lançamentos
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-muted)",
              marginLeft: 8,
            }}
          >
            {total} registros
          </span>
        </h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          <Badge>{fmt(totalIncome)} receitas</Badge>
          <Badge color="var(--accent-red)">{fmt(totalExpenses)} despesas</Badge>
        </div>
      </div>

      {/* Filtros */}
      <div
        style={{
          ...S.card,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Tipo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap" as const,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-muted)",
              letterSpacing: "0.05em",
              textTransform: "uppercase" as const,
              marginRight: 4,
            }}
          >
            Tipo:
          </span>
          {(
            [
              { key: "all", label: "Todos" },
              { key: "income", label: "💰 Receitas" },
              { key: "expense", label: "💸 Despesas" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              style={pillActive(filterType === t.key)}
              onClick={() => handleTypeChange(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Categoria — só aparece quando tipo != all */}
        {filterType !== "all" && availableCategories.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap" as const,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-muted)",
                letterSpacing: "0.05em",
                textTransform: "uppercase" as const,
                marginRight: 4,
              }}
            >
              Categoria:
            </span>
            <button
              style={pillActive(filterCategoryLocal === "all")}
              onClick={() => handleCategoryChange("all")}
            >
              Todas
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat.id}
                style={pillActive(filterCategoryLocal === cat.id, cat.color)}
                onClick={() => handleCategoryChange(cat.id)}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Subcategoria — só aparece ao selecionar categoria */}
        {filterCategoryLocal !== "all" && availableSubcategories.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap" as const,
              paddingLeft: 12,
              borderLeft: `3px solid ${selectedCategory?.color || "var(--accent-blue)"}`,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-muted)",
                letterSpacing: "0.05em",
                textTransform: "uppercase" as const,
                marginRight: 4,
              }}
            >
              Subcategoria:
            </span>
            <button
              style={pillActive(filterSubcategory === "all")}
              onClick={() => setFilterSubcategory("all")}
            >
              Todas
            </button>
            {availableSubcategories.map((sub) => (
              <button
                key={sub.id}
                style={pillActive(
                  filterSubcategory === sub.id,
                  selectedCategory?.color,
                )}
                onClick={() => setFilterSubcategory(sub.id)}
              >
                {sub.icon} {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* Limpar filtros */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              setFilterType("all");
              setFilterCategoryLocal("all");
              setFilterSubcategory("all");
              setSearch("");
            }}
            style={{
              ...S.btn("danger"),
              padding: "5px 12px",
              fontSize: 12,
              alignSelf: "flex-start" as const,
            }}
          >
            ✕ Limpar filtros
          </button>
        )}
      </div>

      {/* Lista */}
      <div style={isMobile ? S.cardMobile : S.card}>
        {/* Campo de busca */}
        <div
          style={{
            marginBottom: 16,
            paddingBottom: 16,
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              padding: "0 12px",
              gap: 8,
            }}
          >
            <span
              style={{
                color: "var(--text-muted)",
                fontSize: 14,
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              🔍
            </span>
            <input
              ref={searchRef}
              autoFocus={!!search}
              type="text"
              placeholder="Buscar por descrição ou observação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: 13,
                padding: "10px 0",
                fontFamily: "inherit",
              }}
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 14,
                  padding: 2,
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
        {displayedTx.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              padding: 60,
              fontSize: 14,
            }}
          >
            Nenhum lançamento encontrado.
          </div>
        ) : (
          displayedTx.map((tx) => {
            const cat = categories.find((c) => c.id === tx.categoryId);
            const sub = cat?.subcategories.find(
              (s) => s.id === tx.subcategoryId,
            );
            return (
              <div key={tx.id} style={{ ...S.txRow, gap: isMobile ? 10 : 14 }}>
                {/* Ícone */}
                <div
                  style={{
                    width: isMobile ? 34 : 40,
                    height: isMobile ? 34 : 40,
                    borderRadius: "var(--radius-md)",
                    background: (cat?.color || "#888") + "22",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isMobile ? 16 : 18,
                    flexShrink: 0,
                  }}
                >
                  {sub?.icon || cat?.icon}
                </div>

                {/* Descrição + badges */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: isMobile ? 13 : 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap" as const,
                    }}
                  >
                    {tx.description}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginTop: 4,
                      flexWrap: "wrap" as const,
                      alignItems: "center",
                    }}
                  >
                    <span style={S.pill(cat?.color || "#888")}>
                      {cat?.name}
                    </span>
                    {sub && !isMobile && (
                      <span style={S.pill("var(--text-muted)")}>
                        {sub.name}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {fmtDate(tx.date)}
                    </span>
                  </div>
                </div>

                {/* Valor */}
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: isMobile ? 13 : 15,
                    color:
                      tx.type === "income"
                        ? "var(--accent-green)"
                        : "var(--accent-red)",
                    flexShrink: 0,
                  }}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {fmt(tx.amount)}
                </span>

                {/* Editar */}
                <button
                  onClick={() => setEditingTx(tx)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    fontSize: 14,
                    padding: 4,
                    borderRadius: "var(--radius-sm)",
                    flexShrink: 0,
                  }}
                  title="Editar"
                >
                  ✏️
                </button>

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

        {!hasActiveFilters && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={onPageChange}
          />
        )}
      </div>

      {/* Modal de edição */}
      {editingTx && (
        <AddModal
          categories={categories}
          editingTransaction={editingTx}
          onAdd={(data) => {
            updateTransaction(editingTx.id, data);
            setEditingTx(null);
          }}
          onClose={() => setEditingTx(null)}
        />
      )}
    </div>
  );
}
