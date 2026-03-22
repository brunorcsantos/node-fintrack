// src/hooks/useCreditCards.ts
import { useState, useEffect, useCallback } from "react";
import type {
  CreditCard,
  CreditCardInput,
  CreditCardTransactionInput,
  CreditCardInvoice,
} from "../lib/api";

import { api } from "../lib/api";

export function useCreditCards() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [invoices, setInvoices] = useState<CreditCardInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedCards, fetchedInvoices] = await Promise.all([
        api.getCreditCards(),
        api.getCreditCardInvoices(undefined, false),
      ]);
      setCards(fetchedCards);
      setInvoices(fetchedInvoices);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createCard = useCallback(
    async (data: CreditCardInput) => {
      const card = await api.createCreditCard(data);
      await fetchAll();
      return card;
    },
    [fetchAll],
  );

  const updateCard = useCallback(
    async (id: string, data: Partial<CreditCardInput>) => {
      const card = await api.updateCreditCard(id, data);
      await fetchAll();
      return card;
    },
    [fetchAll],
  );

  const deleteCard = useCallback(async (id: string) => {
    await api.deleteCreditCard(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const createTransaction = useCallback(
    async (cardId: string, data: CreditCardTransactionInput) => {
      const tx = await api.createCreditCardTransaction(cardId, data);
      await fetchAll();
      return tx;
    },
    [fetchAll],
  );

  const deleteTransaction = useCallback(
    async (cardId: string, txId: string) => {
      await api.deleteCreditCardTransaction(cardId, txId);
      await fetchAll();
    },
    [fetchAll],
  );

  const payInvoice = useCallback(
    async (
      invoiceId: string,
      data: { categoryId: string; subcategoryId?: string; date?: string },
    ) => {
      const tx = await api.payCreditCardInvoice(invoiceId, data);
      await fetchAll();
      return tx;
    },
    [fetchAll],
  );

  // Faturas não pagas
  const unpaidInvoices = invoices.filter((i) => !i.paid);

  // Faturas próximas do vencimento (nos próximos 7 dias)
  const upcomingInvoices = unpaidInvoices.filter((i) => {
    const due = new Date(i.dueDate);
    const today = new Date();
    const diffDays = Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays >= 0 && diffDays <= 7;
  });

  return {
    cards,
    invoices,
    unpaidInvoices,
    upcomingInvoices,
    loading,
    error,
    refetch: fetchAll,
    createCard,
    updateCard,
    deleteCard,
    createTransaction,
    deleteTransaction,
    payInvoice,
  };
}
