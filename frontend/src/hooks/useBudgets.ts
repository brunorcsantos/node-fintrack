// src/hooks/useBudgets.ts
import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import type { Budget } from "../lib/api";

export function useBudgets(month: string) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(() => {
    setLoading(true);
    api
      .getBudgets(month)
      .then(setBudgets)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [month]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const upsertBudget = useCallback(
    async (amount: number, categoryId?: string, subcategoryId?: string) => {
      const budget = await api.upsertBudget({
        amount,
        month,
        categoryId,
        subcategoryId,
      });
      setBudgets((prev) => {
        const exists = prev.find((b) => b.id === budget.id);
        return exists
          ? prev.map((b) => (b.id === budget.id ? budget : b))
          : [...prev, budget];
      });
      return budget;
    },
    [month],
  );

  const deleteBudget = useCallback(async (id: string) => {
    await api.deleteBudget(id);
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return {
    budgets,
    loading,
    error,
    upsertBudget,
    deleteBudget,
    refetch: fetchBudgets,
  };
}
