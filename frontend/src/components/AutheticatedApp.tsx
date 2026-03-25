// src/components/AuthenticatedApp.tsx
import { useState, useMemo, useCallback, useEffect } from "react";
import type { View, Transaction } from "../types";
import { S } from "../styles";
import { useCategories } from "../hooks/useCategories";
import { useTransactions } from "../hooks/useTransactions";
import { useSummary } from "../hooks/useSummary";
import { useRecurring } from "../hooks/useRecurring";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../hooks/useNotifications";
import { useCreditCards } from "../hooks/useCreditCards";
import { useIsMobile } from "../hooks/useIsMobile";
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

  // CORREÇÃO: useIsMobile centralizado — antes cada componente fazia
  // useState(window.innerWidth < 768) + addEventListener individualmente,
  // criando N listeners simultâneos e quebrando em SSR/testes.
  const isMobile = useIsMobile();

  const [view, setView] = useState<View>("dashboard");
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [filterCategory, setFilterCategory] = useState("all");

  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategoryLocal, setFilterCategoryLocal] = useState("all");
  const [filterSubcategory, setFilterSubcategory] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    setFilterType("all");
    setFilterCategoryLocal("all");
    setFilterSubcategory("all");
    setSearch("");
  }, [filterMonth, filterCategory]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    categories,
    loading: loadingCats,
    error: errorCats,
    refetch: refetchCategories,
  } = useCategories();

  const { summary, refetch: refetchSummary } = useSummary(filterMonth);

  // CORREÇÃO: useRecurring instanciado UMA única vez aqui no topo da árvore.
  // Antes estava duplicado: aqui E dentro de <Transactions>, causando:
  // - 2 chamadas GET /recurring e GET /recurring/pending por navegação
  // - estados dessincronizados entre Dashboard (alerts) e Transactions (lista)
  // - confirmRecurring no Dashboard não atualizava a lista em Transactions
  const recurringState = useRecurring();

  const {
    upcomingInvoices,
    payInvoice,
    cards,
    createTransaction: createCardTransaction,
    deleteTransaction: deleteCardTransaction,
  } = useCreditCards();

  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    deleteNotification,
    deleteReadNotifications,
  } = useNotifications();

  const hasActiveFilters =
    filterType !== "all" ||
    filterCategoryLocal !== "all" ||
    !!debouncedSearch.trim();

  const {
    transactions,
    total,
    page,
    totalPages,
    loading: loadingTx,
    error: errorTx,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    goToPage,
  } = useTransactions({
    month: filterMonth,
    categoryId:
      filterCategoryLocal !== "all"
        ? filterCategoryLocal
        : filterCategory === "all"
          ? undefined
          : filterCategory,
    type: filterType === "all" ? undefined : filterType,
    search: debouncedSearch.trim() || undefined,
    limit: hasActiveFilters ? 999 : 10,
    onMutate: refetchSummary,
  });

  const filteredTx = useMemo(
    () =>
      filterCategory === "all"
        ? transactions
        : transactions.filter((tx) => tx.categoryId === filterCategory),
    [transactions, filterCategory],
  );

  const totalIncome = useMemo(
    () =>
      Number(
        summary?.totals.find((t) => t.type === "income")?._sum.amount || 0,
      ),
    [summary],
  );

  const totalExpenses = useMemo(
    () =>
      Number(
        summary?.totals.find((t) => t.type === "expense")?._sum.amount || 0,
      ),
    [summary],
  );

  const expenseByCategory = useMemo(() => {
    if (!summary) return {};
    const map: Record<string, number> = {};
    summary.byCategory
      .filter((b) => b.type === "expense")
      .forEach((b) => {
        map[b.categoryId] = Number(b._sum.amount);
      });
    return map;
  }, [summary]);

  const handleAddTransaction = useCallback(
    async (
      tx: Omit<Transaction, "id" | "category" | "subcategory"> & {
        notes?: string;
      },
    ) => {
      await addTransaction(tx as Parameters<typeof addTransaction>[0]);
      setShowAddModal(false);
    },
    [addTransaction],
  );

  return (
    <div style={{ ...S.app, minWidth: 0, overflowX: "hidden" }}>
      <Header
        view={view}
        setView={setView}
        onLogout={logout}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
        onDeleteNotification={deleteNotification}
        onDeleteReadNotifications={deleteReadNotifications}
      />

      <Filters
        categories={categories}
        filterMonth={filterMonth}
        filterCategory={filterCategory}
        setFilterMonth={setFilterMonth}
        setFilterCategory={setFilterCategory}
      />

      <main
        style={{
          flex: 1,
          padding: isMobile ? "16px" : "28px 24px",
          width: "100%",
          boxSizing: "border-box" as const,
        }}
      >
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
                // Passa o estado de recurringState já instanciado — sem segunda chamada à API
                pending={recurringState.pending}
                confirmRecurring={recurringState.confirmRecurring}
                upcomingInvoices={upcomingInvoices}
                onPayInvoice={payInvoice}
              />
            )}
            {view === "transactions" && (
              <Transactions
                filteredTx={filteredTx}
                categories={categories}
                totalIncome={totalIncome}
                totalExpenses={totalExpenses}
                total={total}
                page={page}
                totalPages={totalPages}
                limit={hasActiveFilters ? 999 : 10}
                deleteTransaction={deleteTransaction}
                updateTransaction={updateTransaction}
                onPageChange={goToPage}
                filterType={filterType}
                setFilterType={setFilterType}
                filterCategoryLocal={filterCategoryLocal}
                setFilterCategoryLocal={setFilterCategoryLocal}
                filterSubcategory={filterSubcategory}
                setFilterSubcategory={setFilterSubcategory}
                search={search}
                setSearch={setSearch}
                cards={cards}
                onPayInvoice={payInvoice}
                onDeleteCardTransaction={deleteCardTransaction}
                onAddNew={() => setShowAddModal(true)}
                // Passa o estado compartilhado em vez de criar nova instância
                recurringState={recurringState}
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
              <Reports categories={categories} filterMonth={filterMonth} />
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
          cards={cards}
          onAdd={handleAddTransaction}
          onAddRecurring={async (data) => {
            await recurringState.createRecurring(data);
            setShowAddModal(false);
            refetchSummary();
          }}
          onAddCardTransaction={async (cardId, data) => {
            await createCardTransaction(cardId, data);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}