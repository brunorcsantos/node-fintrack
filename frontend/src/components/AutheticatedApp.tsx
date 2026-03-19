// src/components/AuthenticatedApp.tsx
import { useState, useMemo, useCallback, useEffect } from "react";
import type { Transaction } from "../types";
import type { View} from "../types";
import { S } from "../styles";
import { getMonthKey } from "../helpers";
import { useCategories } from "../hooks/useCategories";
import { useTransactions } from "../hooks/useTransactions";
import { useAuth } from "../context/AuthContext";
import Header from "./Header";
import Filters from "./Filters";
import AddModal from "./AddModal";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import Dashboard from "../views/Dashboard";
import Transactions from "../views/Transactions";
import Budgets from "../views/Budgets";
import Reports from "../views/Reports";
import Setup from "../views/Setup";

export default function AuthenticatedApp() {
  const { logout } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [view, setView] = useState<View>("dashboard");
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [filterCategory, setFilterCategory] = useState("all");

  // ── Hooks de dados ──────────────────────────────────────────────────────────
  const {
    categories,
    loading: loadingCats,
    error: errorCats,
    refetch: refetchCategories,
  } = useCategories();

  const {
    transactions,
    loading: loadingTx,
    error: errorTx,
    addTransaction,
    deleteTransaction,
  } = useTransactions({
    month: filterMonth,
    categoryId: filterCategory === "all" ? undefined : filterCategory,
  });

  // ── Dados derivados ─────────────────────────────────────────────────────────
  const filteredTx = useMemo(
    () =>
      filterCategory === "all"
        ? transactions
        : transactions.filter((tx) => tx.categoryId === filterCategory),
    [transactions, filterCategory]
  );

  const totalExpenses = useMemo(
    () => filteredTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [filteredTx]
  );

  const totalIncome = useMemo(
    () => filteredTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [filteredTx]
  );

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTx
      .filter((t) => t.type === "expense")
      .forEach((t) => { map[t.categoryId] = (map[t.categoryId] || 0) + t.amount; });
    return map;
  }, [filteredTx]);

  const handleAddTransaction = useCallback(
    async (tx: Omit<Transaction, "id" | "category" | "subcategory"> & { notes?: string }) => {
      await addTransaction(tx as any);
      setShowAddModal(false);
    },
    [addTransaction]
  );

  return (
    <div style={{ ...S.app, minWidth: 0, overflowX: "hidden" }}>
      <Header
        view={view}
        setView={setView}
        setShowAddModal={setShowAddModal}
        onLogout={logout}
      />

      <Filters
        categories={categories}
        filterMonth={filterMonth}
        filterCategory={filterCategory}
        setFilterMonth={setFilterMonth}
        setFilterCategory={setFilterCategory}
      />

      <main style={{
        flex: 1,
        padding: isMobile ? "16px" : "28px 24px",
        width: "100%",
        boxSizing: "border-box" as const,
      }}>
        {loadingCats || loadingTx ? (
          <LoadingSpinner />
        ) : errorCats || errorTx ? (
          <ErrorMessage
            message={errorCats || errorTx || "Erro ao carregar dados."}
            onRetry={refetchCategories}
          />
        ) : (
          <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
            {view === "dashboard" && (
              <Dashboard
                filteredTx={filteredTx}
                categories={categories}
                totalIncome={totalIncome}
                totalExpenses={totalExpenses}
                expenseByCategory={expenseByCategory}
                setView={setView}
              />
            )}
            {view === "transactions" && (
              <Transactions
                filteredTx={filteredTx}
                categories={categories}
                totalIncome={totalIncome}
                totalExpenses={totalExpenses}
                deleteTransaction={deleteTransaction}
              />
            )}
            {view === "budgets" && (
              <Budgets
                categories={categories}
                filteredTx={filteredTx}
                expenseByCategory={expenseByCategory}
                filterMonth={filterMonth}
              />
            )}
            {view === "reports" && (
              <Reports
                categories={categories}
                filterMonth={filterMonth}
              />
            )}
            {view === "setup" && (
              <Setup
                categories={categories}
                onCategoriesChange={refetchCategories}
              />
            )}
          </div>
        )}
      </main>

      {showAddModal && (
        <AddModal
          categories={categories}
          onAdd={handleAddTransaction}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}