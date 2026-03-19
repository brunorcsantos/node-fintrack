import { useState, useMemo, useCallback } from "react";
import type { View, Transaction } from "./types";
import { useCategories } from "./hooks/useCategories";
import { useTransactions } from "./hooks/useTransactions";
import { fmt, fmtDate, getMonthKey } from "./helpers";
import { S } from "./styles";
import Header from "./components/Header";
import Filters from "./components/Filters";
import AddModal from "./components/AddModal";
import Dashboard from "./views/Dashboard";
import Transactions from "./views/Transactions";
import Budgets from "./views/Budgets";
import Reports from "./views/Reports";
import Setup from "./views/Setup";
import { useAuth } from "./context/AuthContext";
import Auth from "./views/Auth";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorMessage from "./components/ErrorMessage";


export default function FinanceApp() {
  const { user, loading, logout } = useAuth();

  // ── 1. Filtros primeiro ─────────────────────────────
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [filterCategory, setFilterCategory] = useState("all");

  // ── 2. Hooks de dados (usam os filtros acima) ───────
  const { categories, loading: loadingCats, error: errorCats, refetch: refetchCategories } = useCategories();
  const { transactions, loading: loadingTx, error: errorTx, addTransaction, deleteTransaction } = useTransactions({
    month: filterMonth,
    categoryId: filterCategory === "all" ? undefined : filterCategory,
  });

  // ── 3. Demais estados ───────────────────────────────
  const [view, setView] = useState<View>("dashboard");
  const [showAddModal, setShowAddModal] = useState(false);

  // ── 4. Dados derivados (useMemo) ────────────────────
  const filteredTx = useMemo(
    () =>
      filterCategory === "all"
        ? transactions
        : transactions.filter((tx) => tx.categoryId === filterCategory),
    [transactions, filterCategory],
  );

  const totalExpenses = useMemo(
    () =>
      filteredTx
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0),
    [filteredTx],
  );

  const totalIncome = useMemo(
    () =>
      filteredTx
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0),
    [filteredTx],
  );

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTx
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      });
    return map;
  }, [filteredTx]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0d0d1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: "#666", fontFamily: "DM Sans, sans-serif" }}>
          Carregando...
        </span>
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <div style={S.app}>
      <style>{`/* fonts e reset */`}</style>
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
      <main style={S.main}>
        {loadingCats || loadingTx ? (
          <LoadingSpinner />
        ) : errorCats || errorTx ? (
          <ErrorMessage
            message={errorCats || errorTx || "Erro ao carregar dados."}
            onRetry={() => {
              refetchCategories();
            }}
          />
        ) : (
          <>
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
                transactions={transactions}
                categories={categories}
                filteredTx={filteredTx}
                totalExpenses={totalExpenses}
                filterMonth={filterMonth}
                expenseByCategory={expenseByCategory}
              />
            )}
            {view === "setup" && (
              <Setup
                categories={categories}
                onCategoriesChange={refetchCategories}
              />
            )}
          </>
        )}
      </main>
      {showAddModal && (
        <AddModal
          categories={categories}
          onAdd={addTransaction}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
