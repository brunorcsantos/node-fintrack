// src/hooks/useTransactions.ts
import { useState, useEffect, useCallback } from "react";
import type { Transaction } from "../lib/api";
import { api } from "../lib/api";

interface UseTransactionsParams {
  month?: string;
  categoryId?: string;
  type?: "income" | "expense";
  search?: string;
  limit?: number;
}

export function useTransactions(params: UseTransactionsParams = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = params.limit || 10;

  const fetchTransactions = useCallback(
    (targetPage = 1) => {
      setLoading(true);
      api
        .getTransactions({ ...params, page: targetPage, limit })
        .then((res) => {
          setTransactions(res.data);
          setTotal(res.total);
          setPage(targetPage);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    },
    [params.month, params.categoryId, params.type, params.search, limit],
  );

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const goToPage = useCallback(
    (p: number) => {
      fetchTransactions(p);
    },
    [fetchTransactions],
  );

  const addTransaction = useCallback(
    async (data: Omit<Transaction, "id" | "category" | "subcategory">) => {
      const tx = await api.createTransaction(data);
      fetchTransactions(1);
      return tx;
    },
    [fetchTransactions],
  );

  const updateTransaction = useCallback(
    async (
      id: string,
      data: Omit<Transaction, "id" | "category" | "subcategory">,
    ) => {
      const tx = await api.updateTransaction(id, data);
      fetchTransactions(page);
      return tx;
    },
    [fetchTransactions, page],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      await api.deleteTransaction(id);
      // Se deletou o último item da página, volta para a anterior
      const newTotal = total - 1;
      const maxPage = Math.ceil(newTotal / limit);
      fetchTransactions(page > maxPage ? Math.max(1, maxPage) : page);
    },
    [fetchTransactions, page, total, limit],
  );

  const totalPages = Math.ceil(total / limit);

  return {
    transactions,
    total,
    page,
    totalPages,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    goToPage,
    refetch: () => fetchTransactions(page),
  };
}
