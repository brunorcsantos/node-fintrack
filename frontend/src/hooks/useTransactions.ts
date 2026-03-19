// src/hooks/useTransactions.ts
import { useState, useEffect, useCallback } from "react";
import type { Transaction } from "../lib/api";
import { api } from "../lib/api";

interface UseTransactionsParams {
  month?: string;
  categoryId?: string;
}

export function useTransactions(params: UseTransactionsParams = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(() => {
    setLoading(true);
    api.getTransactions(params)
      .then((res) => setTransactions(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.month, params.categoryId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = useCallback(async (data: Omit<Transaction, "id" | "category" | "subcategory">) => {
    const tx = await api.createTransaction(data);
    fetchTransactions();
    return tx;
  }, [fetchTransactions]);

  const deleteTransaction = useCallback(async (id: string) => {
    await api.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { transactions, loading, error, addTransaction, deleteTransaction, refetch: fetchTransactions };
}