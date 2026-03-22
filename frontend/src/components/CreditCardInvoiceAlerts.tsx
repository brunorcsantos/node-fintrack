// src/components/CreditCardInvoiceAlerts.tsx
import { useState } from "react";
import type { CreditCardInvoice, Category } from "../lib/api";
import { S } from "../styles";

interface CreditCardInvoiceAlertsProps {
  invoices: CreditCardInvoice[];
  categories: Category[];
  onPay: (invoiceId: string, data: { categoryId: string; subcategoryId?: string; date?: string }) => Promise<any>;
}

export default function CreditCardInvoiceAlerts({ invoices, categories, onPay }: CreditCardInvoiceAlertsProps) {
  const [payingId, setPayingId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  if (invoices.length === 0) return null;

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const cardCategories = categories.filter((c) => c.slug === "cartao" || c.slug === "cartão-de-crédito" || c.name.toLowerCase().includes("cartão") || c.name.toLowerCase().includes("cartao"));

  const daysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const dueDateLabel = (dueDate: string) => {
    const days = daysUntilDue(dueDate);
    if (days < 0) return { text: `Vencida há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? "s" : ""}`, color: "var(--accent-red)" };
    if (days === 0) return { text: "Vence hoje!", color: "var(--accent-red)" };
    if (days === 1) return { text: "Vence amanhã", color: "var(--accent-orange, #E8C45A)" };
    return { text: `Vence em ${days} dias`, color: "var(--accent-blue)" };
  };

  const handlePay = async (invoiceId: string) => {
    if (!categoryId) return;
    setLoading(true);
    try {
      await onPay(invoiceId, {
        categoryId,
        subcategoryId: subcategoryId || undefined,
        date: payDate,
      });
      setPayingId(null);
      setCategoryId("");
      setSubcategoryId("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: "var(--accent-blue)11",
      border: "1px solid var(--accent-blue)44",
      borderRadius: "var(--radius-xl)",
      padding: "16px 20px",
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>💳</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
            Faturas pendentes
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {invoices.length} fatura{invoices.length !== 1 ? "s" : ""} aguardando pagamento
          </div>
        </div>
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {invoices.map((invoice) => {
          const label = dueDateLabel(invoice.dueDate);
          const isPaying = payingId === invoice.id;

          return (
            <div key={invoice.id} style={{
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              padding: "12px 14px",
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              {/* Info da fatura */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "var(--radius-md)",
                  background: invoice.card.color + "22",
                  border: `1px solid ${invoice.card.color}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0,
                }}>
                  {invoice.card.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                    {invoice.card.name}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" as const, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Fatura {invoice.month}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: label.color }}>
                      {label.text}
                    </span>
                  </div>
                </div>

                <div style={{
                  fontSize: 16, fontWeight: 800, color: "var(--accent-red)", flexShrink: 0,
                }}>
                  R$ {Number(invoice.totalAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Formulário de pagamento */}
              {isPaying ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
                  {/* Categoria */}
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>
                      Categoria do lançamento *
                    </div>
                    <select style={S.select} value={categoryId}
                      onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId(""); }}>
                      <option value="">Selecione...</option>
                      {categories
                        .filter((c) => c.slug !== "receita")
                        .map((c) => (
                          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                    </select>
                  </div>

                  {/* Subcategoria */}
                  {selectedCategory && selectedCategory.subcategories.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>
                        Subcategoria
                      </div>
                      <select style={S.select} value={subcategoryId}
                        onChange={(e) => setSubcategoryId(e.target.value)}>
                        <option value="">Nenhuma</option>
                        {selectedCategory.subcategories.map((s) => (
                          <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Data */}
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>
                      Data do pagamento
                    </div>
                    <input style={{ ...S.input, fontSize: 13 }} type="date"
                      value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ ...S.btn("ghost"), flex: 1, padding: "8px", fontSize: 12 }}
                      onClick={() => setPayingId(null)}>
                      Cancelar
                    </button>
                    <button
                      style={{ ...S.btn("primary"), flex: 2, padding: "8px", fontSize: 12, opacity: loading || !categoryId ? 0.7 : 1 }}
                      onClick={() => handlePay(invoice.id)}
                      disabled={loading || !categoryId}
                    >
                      {loading ? "Pagando..." : `✅ Confirmar pagamento`}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  style={{ ...S.btn("primary"), padding: "8px", fontSize: 12 }}
                  onClick={() => {
                    setPayingId(invoice.id);
                    setPayDate(new Date().toISOString().slice(0, 10));
                    // Pré-seleciona categoria de cartão se existir
                    if (cardCategories.length > 0) {
                      setCategoryId(cardCategories[0].id);
                    }
                  }}
                >
                  💳 Pagar fatura
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
