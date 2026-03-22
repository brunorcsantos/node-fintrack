// src/views/Dashboard.tsx
import { useState, useEffect } from "react";
import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";
import type {
  Category,
  Transaction,
  Recurring,
  CreditCardInvoice,
} from "../lib/api";
import type { View } from "../types";
import { S } from "../styles";
import { fmt, fmtDate } from "../helpers";
import ProgressBar from "../components/ProgressBar";
import RecurringAlerts from "../components/RecurringAlerts";
import CreditCardInvoiceAlerts from "../components/CreditCardInvoiceAlerts";

interface DashboardProps {
  filteredTx: Transaction[];
  categories: Category[];
  totalIncome: number;
  totalExpenses: number;
  expenseByCategory: Record<string, number>;
  setView: (view: View) => void;
  pending: Recurring[];
  confirmRecurring: (
    id: string,
    data?: { amount?: number; date?: string },
  ) => Promise<any>;
  upcomingInvoices: CreditCardInvoice[];
  onPayInvoice: (
    invoiceId: string,
    data: { categoryId: string; subcategoryId?: string; date?: string },
  ) => Promise<any>;
}

export default function Dashboard({
  filteredTx,
  categories,
  totalIncome,
  totalExpenses,
  expenseByCategory,
  setView,
  pending,
  confirmRecurring,
  upcomingInvoices,
  onPayInvoice,
}: DashboardProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visiblePending = pending.filter((r) => !dismissed.includes(r.id));

  const handleDismiss = (id: string) => setDismissed((prev) => [...prev, id]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const balance = totalIncome - totalExpenses;

  const pieData = categories
    .filter((c) => c.slug !== "receita" && expenseByCategory[c.id])
    .map((c) => ({
      name: c.name,
      value: expenseByCategory[c.id],
      color: c.color,
      fill: c.color,
    }));

  const tooltipStyle = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-md)",
    color: "var(--text-primary)",
    fontSize: 13,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 12 : 20,
      }}
    >
      {/* Alertas de recorrentes */}
      {visiblePending.length > 0 && (
        <RecurringAlerts
          pending={visiblePending}
          categories={categories}
          onConfirm={confirmRecurring}
          onDismiss={handleDismiss}
        />
      )}

      {/* Alertas de faturas */}
      {upcomingInvoices.length > 0 && (
        <CreditCardInvoiceAlerts
          invoices={upcomingInvoices}
          categories={categories}
          onPay={onPayInvoice}
        />
      )}

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr",
          gap: isMobile ? 10 : 16,
        }}
      >
        <div style={S.statCard("#5AB88A")}>
          <div style={S.label}>Receitas</div>
          <div
            style={{
              ...S.value,
              color: "var(--accent-green)",
              fontSize: isMobile ? 18 : 28,
            }}
          >
            {fmt(totalIncome)}
          </div>
        </div>
        <div style={S.statCard("#E85A7A")}>
          <div style={S.label}>Despesas</div>
          <div
            style={{
              ...S.value,
              color: "var(--accent-red)",
              fontSize: isMobile ? 18 : 28,
            }}
          >
            {fmt(totalExpenses)}
          </div>
        </div>
        <div
          style={{
            ...S.statCard(balance >= 0 ? "#5A8FE8" : "#E8845A"),
            gridColumn: isMobile ? "1 / -1" : "auto",
          }}
        >
          <div style={S.label}>Saldo do Mês</div>
          <div
            style={{
              ...S.value,
              color:
                balance >= 0 ? "var(--accent-blue)" : "var(--accent-orange)",
              fontSize: isMobile ? 18 : 28,
            }}
          >
            {fmt(balance)}
          </div>
        </div>
      </div>

      {/* Gráfico + Resumo */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 12 : 16,
        }}
      >
        {/* Pie chart */}
        <div style={isMobile ? S.cardMobile : S.card}>
          <div style={S.sectionTitle}>Gastos por Categoria</div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 45 : 55}
                    outerRadius={isMobile ? 75 : 90}
                    paddingAngle={3}
                    dataKey="value"
                  />
                  <Tooltip
                    formatter={(v: number | undefined) =>
                      v !== undefined ? fmt(v) : ""
                    }
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap" as const,
                  gap: 8,
                  marginTop: 12,
                }}
              >
                {pieData.map((p) => (
                  <div
                    key={p.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 12,
                      color: "var(--text-secondary)",
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: p.color,
                        flexShrink: 0,
                      }}
                    />
                    {p.name}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div
              style={{
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "40px 0",
                fontSize: 14,
              }}
            >
              Nenhum gasto registrado
            </div>
          )}
        </div>

        {/* Resumo por categoria */}
        <div style={isMobile ? S.cardMobile : S.card}>
          <div style={S.sectionTitle}>Resumo por Categoria</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {categories
              .filter((c) => c.slug !== "receita" && expenseByCategory[c.id])
              .map((cat) => {
                const spent = expenseByCategory[cat.id] || 0;
                return (
                  <div key={cat.id}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          color: "var(--text-primary)",
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap" as const,
                        }}
                      >
                        {cat.icon} {cat.name}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: cat.color,
                          flexShrink: 0,
                        }}
                      >
                        {fmt(spent)}
                      </span>
                    </div>
                    <ProgressBar
                      value={spent}
                      max={totalExpenses || 1}
                      color={cat.color}
                    />
                  </div>
                );
              })}
            {categories.filter(
              (c) => c.slug !== "receita" && expenseByCategory[c.id],
            ).length === 0 && (
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 14,
                  textAlign: "center",
                  padding: "20px 0",
                }}
              >
                Nenhum gasto registrado
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Últimos lançamentos */}
      <div style={isMobile ? S.cardMobile : S.card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div style={S.sectionTitle}>Últimos Lançamentos</div>
          <button
            style={{
              ...S.btn("ghost"),
              padding: "6px 12px",
              fontSize: 12,
            }}
            onClick={() => setView("transactions")}
          >
            Ver todos →
          </button>
        </div>

        {filteredTx.length === 0 ? (
          <div
            style={{
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "24px 0",
              fontSize: 14,
            }}
          >
            Nenhum lançamento no período
          </div>
        ) : (
          filteredTx.slice(0, 6).map((tx) => {
            const cat = categories.find((c) => c.id === tx.categoryId);
            const sub = cat?.subcategories.find(
              (s) => s.id === tx.subcategoryId,
            );
            return (
              <div key={tx.id} style={S.txRow}>
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
                      fontSize: 13,
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
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 2,
                    }}
                  >
                    {fmtDate(tx.date)} · {cat?.name}
                    {sub ? ` › ${sub.name}` : ""}
                  </div>
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: isMobile ? 13 : 15,
                    color:
                      tx.type === "income"
                        ? "var(--accent-green)"
                        : "var(--accent-red)",
                    flexShrink: 0,
                  }}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {fmt(tx.amount)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
