// src/views/Transactions.tsx
import { useState, useMemo, useRef } from "react";
import type { Category, Transaction, CreditCard } from "../lib/api";
import type { useRecurring } from "../hooks/useRecurring";
import { S } from "../styles";
import { fmt } from "../helpers";
import { useIsMobile } from "../hooks/useIsMobile";
import Badge from "../components/Badge";
import AddModal from "../components/AddModal";
import TransactionList from "../components/TransactionList";
import RecurringManager from "../components/RecurringManager";
import CreditCardStatement from "../components/CreditCardStatement";

// Tipo derivado do hook para garantir consistência sem duplicar a definição
type RecurringState = ReturnType<typeof useRecurring>;

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
  cards: CreditCard[];
  onAddNew: () => void;
  onPayInvoice: (
    invoiceId: string,
    data: { categoryId: string; subcategoryId?: string; date?: string },
  ) => Promise<unknown>;
  onDeleteCardTransaction: (cardId: string, txId: string) => Promise<void>;
  // CORREÇÃO: recebe o estado já instanciado em vez de criar useRecurring() aqui.
  // Antes: `const { recurring, ... } = useRecurring()` dentro deste componente
  // gerava uma segunda instância paralela à do AuthenticatedApp, resultando em
  // 2x chamadas à API e estados dessincronizados.
  recurringState: RecurringState;
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
  cards,
  onPayInvoice,
  onDeleteCardTransaction,
  onAddNew,
  recurringState,
}: TransactionsProps) {
  // CORREÇÃO: useIsMobile centralizado — elimina o useState + listener local
  const isMobile = useIsMobile();

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState<"transactions" | "recurring" | "cards">("transactions");
  const searchRef = useRef<HTMLInputElement>(null);

  // Desestrutura do estado compartilhado passado por prop
  const { recurring, deleteRecurring, updateRecurring } = recurringState;

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === filterCategoryLocal),
    [categories, filterCategoryLocal],
  );

  const availableCategories = useMemo(() => {
    if (filterType === "all") return [];
    const catIds = new Set(
      filteredTx
        .filter((tx) => tx.type === filterType)
        .map((tx) => tx.categoryId),
    );
    return categories.filter((c) => catIds.has(c.id));
  }, [filteredTx, filterType, categories]);

  const availableSubcategories = useMemo(() => {
    if (!selectedCategory) return [];
    return selectedCategory.subcategories;
  }, [selectedCategory]);

  const handleTypeChange = (t: "all" | "income" | "expense") => {
    setFilterType(t);
    setFilterCategoryLocal("all");
    setFilterSubcategory("all");
  };

  const handleCategoryChange = (catId: string) => {
    setFilterCategoryLocal(catId);
    setFilterSubcategory("all");
  };

  const hasActiveFilters =
    filterType !== "all" ||
    filterCategoryLocal !== "all" ||
    filterSubcategory !== "all" ||
    !!search.trim();

  const pillActive = (active: boolean, color?: string) => ({
    padding: "6px 14px",
    borderRadius: "var(--radius-full)",
    border: "1px solid",
    borderColor: active ? color || "var(--accent-blue)" : "var(--border-default)",
    background: active
      ? color ? color + "22" : "var(--accent-blue)22"
      : "transparent",
    color: active ? color || "var(--accent-blue)" : "var(--text-muted)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    transition: "all 0.15s",
    whiteSpace: "nowrap" as const,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16 }}>
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
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)", marginLeft: 8 }}>
            {activeTab === "transactions"
              ? `${total} registros`
              : `${recurring.length} recorrente${recurring.length !== 1 ? "s" : ""}`}
          </span>
        </h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          <Badge>{fmt(totalIncome)} receitas</Badge>
          <Badge color="var(--accent-red)">{fmt(totalExpenses)} despesas</Badge>
        </div>
      </div>

      {/* Tabs + Botão */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap" as const,
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 4,
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius-md)",
            padding: 4,
            width: "fit-content",
          }}
        >
          {(
            [
              { key: "transactions", label: "📋 Lançamentos" },
              { key: "recurring", label: "🔄 Recorrentes" },
              { key: "cards", label: "💳 Cartões" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                background: activeTab === tab.key ? "var(--bg-surface)" : "transparent",
                color: activeTab === tab.key ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: activeTab === tab.key ? "var(--shadow-sm)" : "none",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          style={{ ...S.btn("primary"), display: "flex", alignItems: "center", gap: 6 }}
          onClick={onAddNew}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
          {!isMobile && "Novo Lançamento"}
        </button>
      </div>

      {/* Tab: Recorrentes */}
      {activeTab === "recurring" && (
        <RecurringManager
          categories={categories}
          recurring={recurring}
          onDelete={deleteRecurring}
          onUpdate={updateRecurring}
        />
      )}

      {/* Tab: Cartões */}
      {activeTab === "cards" && (
        <CreditCardStatement
          cards={cards}
          categories={categories}
          onPayInvoice={onPayInvoice}
          onDeleteTransaction={onDeleteCardTransaction}
        />
      )}

      {/* Tab: Lançamentos */}
      {activeTab === "transactions" && (
        <>
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginRight: 4 }}>
                Tipo:
              </span>
              {(
                [
                  { key: "all", label: "Todos" },
                  { key: "income", label: "💰 Receitas" },
                  { key: "expense", label: "💸 Despesas" },
                ] as const
              ).map((t) => (
                <button key={t.key} style={pillActive(filterType === t.key)} onClick={() => handleTypeChange(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Categoria */}
            {filterType !== "all" && availableCategories.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginRight: 4 }}>
                  Categoria:
                </span>
                <button style={pillActive(filterCategoryLocal === "all")} onClick={() => handleCategoryChange("all")}>
                  Todas
                </button>
                {availableCategories.map((cat) => (
                  <button key={cat.id} style={pillActive(filterCategoryLocal === cat.id, cat.color)} onClick={() => handleCategoryChange(cat.id)}>
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Subcategoria */}
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
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginRight: 4 }}>
                  Subcategoria:
                </span>
                <button style={pillActive(filterSubcategory === "all")} onClick={() => setFilterSubcategory("all")}>
                  Todas
                </button>
                {availableSubcategories.map((sub) => (
                  <button key={sub.id} style={pillActive(filterSubcategory === sub.id, selectedCategory?.color)} onClick={() => setFilterSubcategory(sub.id)}>
                    {sub.icon} {sub.name}
                  </button>
                ))}
              </div>
            )}

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setFilterType("all");
                  setFilterCategoryLocal("all");
                  setFilterSubcategory("all");
                  setSearch("");
                }}
                style={{ ...S.btn("danger"), padding: "5px 12px", fontSize: 12, alignSelf: "flex-start" as const }}
              >
                ✕ Limpar filtros
              </button>
            )}
          </div>

          {/* Lista + Busca */}
          <div style={isMobile ? S.cardMobile : S.card}>
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border-subtle)" }}>
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
                <span style={{ color: "var(--text-muted)", fontSize: 14, flexShrink: 0, lineHeight: 1 }}>🔍</span>
                <input
                  ref={searchRef}
                  autoFocus
                  type="text"
                  placeholder="Buscar por descrição ou observação..."
                  value={search}
                  onChange={(e) => {
                    const len = e.target.value.length;
                    setSearch(e.target.value);
                    requestAnimationFrame(() => {
                      searchRef.current?.setSelectionRange(len, len);
                    });
                  }}
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
                    onClick={() => setSearch("")}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, padding: 2, flexShrink: 0, lineHeight: 1 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <TransactionList
              filteredTx={filteredTx}
              categories={categories}
              filterSubcategory={filterSubcategory}
              total={total}
              page={page}
              totalPages={totalPages}
              limit={limit}
              hasActiveFilters={hasActiveFilters}
              onEdit={setEditingTx}
              onDelete={deleteTransaction}
              onPageChange={onPageChange}
              isMobile={isMobile}
            />
          </div>
        </>
      )}

      {/* Modal de edição */}
      {editingTx && (
        <AddModal
          categories={categories}
          cards={[]}
          onAddCardTransaction={async () => {}}
          editingTransaction={editingTx}
          onAdd={(data) => {
            updateTransaction(editingTx.id, data);
            setEditingTx(null);
          }}
          onAddRecurring={async () => {}}
          onClose={() => setEditingTx(null)}
        />
      )}
    </div>
  );
}