// src/components/CreditCardStatement.tsx
import { useState, useEffect, useCallback } from "react";
import type {
  CreditCard,
  CreditCardTransaction,
  CreditCardInvoice,
  Category,
} from "../lib/api";
import { api } from "../lib/api";
import { S } from "../styles";
import { fmt } from "../helpers";

interface CreditCardStatementProps {
  cards: CreditCard[];
  categories: Category[];
  onPayInvoice: (
    invoiceId: string,
    data: { categoryId: string; subcategoryId?: string; date?: string },
  ) => Promise<any>;
  onDeleteTransaction: (cardId: string, txId: string) => Promise<void>;
}



export default function CreditCardStatement({
  cards,
  categories,
  onPayInvoice,
  onDeleteTransaction,
}: CreditCardStatementProps) {
  const [selectedCardId, setSelectedCardId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  if (!cards || !categories) return null;
  const [transactions, setTransactions] = useState<CreditCardTransaction[]>([]);
  const [invoice, setInvoice] = useState<CreditCardInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(false);
  const [payCategory, setPayCategory] = useState("");
  const [paySubcategory, setPaySubcategory] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (cards.length > 0 && !selectedCardId) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards]);

  const selectedCard = cards?.find((c) => c.id === selectedCardId);
  const selectedCategory = categories.find((c) => c.id === payCategory);

  const fetchData = useCallback(async () => {
    if (!selectedCardId) return;
    setLoading(true);
    try {
      const [txs, invoices] = await Promise.all([
        api.getCreditCardTransactions(selectedCardId, selectedMonth),
        api.getCreditCardInvoices(selectedMonth, false),
      ]);
      setTransactions(txs);
      const inv = invoices.find(
        (i) => i.cardId === selectedCardId && i.month === selectedMonth,
      );
      setInvoice(inv || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedCardId, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePayInvoice = async () => {
    if (!invoice || !payCategory) return;
    setPayingInvoice(false);
    await onPayInvoice(invoice.id, {
      categoryId: payCategory,
      subcategoryId: paySubcategory || undefined,
      date: payDate,
    });
    await fetchData();
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!confirm("Remover esta compra?")) return;
    await onDeleteTransaction(selectedCardId, txId);
    await fetchData();
  };

  const daysUntilDue = invoice
    ? Math.ceil(
        (new Date(invoice.dueDate).getTime() -
          new Date().setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  if (cards.length === 0) {
    return (
      <div
        style={{
          ...S.card,
          textAlign: "center",
          padding: 48,
          color: "var(--text-muted)",
          fontSize: 14,
        }}
      >
        Nenhum cartão cadastrado.
        <br />
        <span style={{ fontSize: 12 }}>
          Adicione um cartão em Configurações → 💳 Cartões.
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Seleção de cartão e mês */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
        {/* Cartões */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flex: 1,
            flexWrap: "wrap" as const,
          }}
        >
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: "var(--radius-md)",
                border: "2px solid",
                borderColor:
                  selectedCardId === card.id
                    ? card.color
                    : "var(--border-default)",
                background:
                  selectedCardId === card.id
                    ? card.color + "22"
                    : "transparent",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 18 }}>{card.icon}</span>
              <span
                style={{
                  color:
                    selectedCardId === card.id
                      ? card.color
                      : "var(--text-secondary)",
                }}
              >
                {card.name}
              </span>
            </button>
          ))}
        </div>

        {/* Mês */}
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{
            ...S.input,
            width: "auto",
            padding: "8px 12px",
            fontSize: 13,
          }}
        />
      </div>

      {/* Card da fatura */}
      {selectedCard && (
        <div
          style={{
            ...S.card,
            background: selectedCard.color + "11",
            border: `1px solid ${selectedCard.color}44`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap" as const,
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-md)",
                  background: selectedCard.color + "22",
                  border: `2px solid ${selectedCard.color}44`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                }}
              >
                {selectedCard.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {selectedCard.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  Fecha dia {selectedCard.closingDay} · Vence dia{" "}
                  {selectedCard.dueDay}
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right" as const }}>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: invoice?.paid
                    ? "var(--accent-green)"
                    : "var(--accent-red)",
                }}
              >
                {fmt(
                  invoice
                    ? Number(invoice.totalAmount)
                    : transactions.reduce((s, t) => s + Number(t.amount), 0),
                )}
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                {invoice?.paid ? (
                  <span
                    style={{ color: "var(--accent-green)", fontWeight: 700 }}
                  >
                    ✅ Fatura paga
                  </span>
                ) : daysUntilDue !== null ? (
                  <span
                    style={{
                      color:
                        daysUntilDue <= 3
                          ? "var(--accent-red)"
                          : "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    {daysUntilDue < 0
                      ? `Vencida há ${Math.abs(daysUntilDue)} dias`
                      : daysUntilDue === 0
                        ? "Vence hoje!"
                        : `Vence em ${daysUntilDue} dia${daysUntilDue !== 1 ? "s" : ""}`}
                  </span>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>
                    Sem vencimento
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botão pagar fatura */}
          {invoice && !invoice.paid && (
            <div style={{ marginTop: 16 }}>
              {payingInvoice ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginBottom: 4,
                          fontWeight: 600,
                        }}
                      >
                        Categoria *
                      </div>
                      <select
                        style={S.select}
                        value={payCategory}
                        onChange={(e) => {
                          setPayCategory(e.target.value);
                          setPaySubcategory("");
                        }}
                      >
                        <option value="">Selecione...</option>
                        {categories
                          .filter((c) => c.slug !== "receita")
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.icon} {c.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginBottom: 4,
                          fontWeight: 600,
                        }}
                      >
                        Data
                      </div>
                      <input
                        style={{ ...S.input, fontSize: 13 }}
                        type="date"
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                      />
                    </div>
                  </div>
                  {selectedCategory &&
                    selectedCategory.subcategories.length > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            marginBottom: 4,
                            fontWeight: 600,
                          }}
                        >
                          Subcategoria
                        </div>
                        <select
                          style={S.select}
                          value={paySubcategory}
                          onChange={(e) => setPaySubcategory(e.target.value)}
                        >
                          <option value="">Nenhuma</option>
                          {selectedCategory.subcategories.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.icon} {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={{ ...S.btn("ghost"), flex: 1, padding: "8px" }}
                      onClick={() => setPayingInvoice(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      style={{
                        ...S.btn("primary"),
                        flex: 2,
                        padding: "8px",
                        opacity: !payCategory ? 0.7 : 1,
                      }}
                      onClick={handlePayInvoice}
                      disabled={!payCategory}
                    >
                      ✅ Confirmar pagamento de{" "}
                      {fmt(Number(invoice.totalAmount))}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  style={{ ...S.btn("primary"), width: "100%" }}
                  onClick={() => {
                    setPayingInvoice(true);
                    setPayDate(new Date().toISOString().slice(0, 10));
                    const cartaoCategory = categories.find(
                      (c) =>
                        c.name.toLowerCase().includes("cartão") ||
                        c.name.toLowerCase().includes("cartao"),
                    );
                    if (cartaoCategory) setPayCategory(cartaoCategory.id);
                  }}
                >
                  💳 Pagar fatura de {fmt(Number(invoice.totalAmount))}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lista de compras */}
      <div style={S.card}>
        <div style={{ ...S.sectionTitle, marginBottom: 16 }}>
          Compras — {selectedMonth}
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-muted)",
              marginLeft: 8,
            }}
          >
            {transactions.length} compra{transactions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              padding: 40,
              fontSize: 14,
            }}
          >
            Carregando...
          </div>
        ) : transactions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              padding: 40,
              fontSize: 14,
            }}
          >
            Nenhuma compra neste mês.
          </div>
        ) : (
          transactions.map((tx) => {
            const cat = categories.find((c) => c.id === tx.categoryId);
            const sub = cat?.subcategories.find(
              (s) => s.id === tx.subcategoryId,
            );
            return (
              <div key={tx.id} style={{ ...S.txRow }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "var(--radius-md)",
                    background: (cat?.color || "#888") + "22",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {sub?.icon || cat?.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap" as const,
                    }}
                  >
                    {tx.description}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginTop: 3,
                      flexWrap: "wrap" as const,
                      alignItems: "center",
                    }}
                  >
                    <span style={S.pill(cat?.color || "#888")}>
                      {cat?.name}
                    </span>
                    {sub && (
                      <span style={S.pill("var(--text-muted)")}>
                        {sub.name}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {new Date(tx.date + "").toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 15,
                    color: "var(--accent-red)",
                    flexShrink: 0,
                  }}
                >
                  -{fmt(Number(tx.amount))}
                </span>
                {!invoice?.paid && (
                  <button
                    onClick={() => handleDeleteTransaction(tx.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      fontSize: 14,
                      padding: 4,
                      borderRadius: "var(--radius-sm)",
                      flexShrink: 0,
                    }}
                    title="Remover"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
