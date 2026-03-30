// src/hooks/useRecurring.ts
import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import type { Recurring, RecurringInput } from "../lib/api";

export function useRecurring() {
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [pending, setPending] = useState<Recurring[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [all, pend] = await Promise.all([
        api.getRecurring(),
        api.getPendingRecurring(),
      ]);
      setRecurring(all);
      setPending(pend);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createRecurring = useCallback(
    async (data: RecurringInput) => {
      const r = await api.createRecurring(data);
      await fetchAll();
      return r;
    },
    [fetchAll],
  );

  const processCardRecurring = useCallback(async () => {
    try {
      const result = await api.processCardRecurring();
      if (result.processed > 0) {
        await fetchAll(); // Recarrega para refletir lastCreatedAt atualizado
      }
      return result;
    } catch (err: any) {
      console.error("Erro ao processar recorrentes do cartão:", err);
    }
  }, [fetchAll]);

  const updateRecurring = useCallback(
    async (id: string, data: Partial<RecurringInput>) => {
      const r = await api.updateRecurring(id, data);
      await fetchAll();
      return r;
    },
    [fetchAll],
  );

  const deleteRecurring = useCallback(async (id: string) => {
    await api.deleteRecurring(id);
    setRecurring((prev) => prev.filter((r) => r.id !== id));
    setPending((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const confirmRecurring = useCallback(
    async (id: string, data?: { amount?: number; date?: string }) => {
      const tx = await api.confirmRecurring(id, data);
      await fetchAll();
      return tx;
    },
    [fetchAll],
  );

  return {
    recurring,
    pending,
    loading,
    error,
    refetch: fetchAll,
    createRecurring,
    updateRecurring,
    deleteRecurring,
    confirmRecurring,
    processCardRecurring
  };
}
