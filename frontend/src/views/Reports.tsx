// src/views/Reports.tsx
import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";
import type { Category } from "../lib/api";
import { S } from "../styles";
import { fmt } from "../helpers";
import ProgressBar from "../components/ProgressBar";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { useSummary } from "../hooks/useSummary";

interface ReportsProps {
  categories: Category[];
  filterMonth: string;
}

export default function Reports({ categories, filterMonth }: ReportsProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { summary, loading, error, refetch } = useSummary(filterMonth);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) return <LoadingSpinner message="Carregando relatórios..." />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  if (!summary) return null;

  // ── Dados ───────────────────────────────────────────────────────────────────
  const monthlyMap: Record<string, { income: number; expense: number }> = {};
  summary.monthly.forEach(({ month, type, total }) => {
    if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expense: 0 };
    if (type === "income") monthlyMap[month].income = total;
    else monthlyMap[month].expense = total;
  });

  const monthlyData = Object.entries(monthlyMap)
    .sort()
    .map(([month, v]) => ({
      month: new Date(month + "-01").toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      }),
      ...v,
    }));

  const totalIncome = summary.totals.find((t) => t.type === "income")?._sum.amount || 0;
  const totalExpenses = summary.totals.find((t) => t.type === "expense")?._sum.amount || 0;
  const balance = totalIncome - totalExpenses;

  const categoryData = summary.byCategory
    .filter((b) => b.type === "expense")
    .map((b) => {
      const cat = categories.find((c) => c.id === b.categoryId);
      return {
        name: cat?.name || "Desconhecida",
        icon: cat?.icon || "📦",
        color: cat?.color || "#888",
        value: Number(b._sum.amount),
      };
    })
    .sort((a, b) => b.value - a.value);

  const tooltipStyle = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-md)",
    color: "var(--text-primary)",
    fontSize: 12,
  };
  const tooltipFormatter = (v: number | undefined) => v !== undefined ? fmt(v) : "";
  const axisProps = { stroke: "var(--text-muted)", tick: { fontSize: 11, fill: "var(--text-muted)" } };

  const emptyState = (
    <div style={{ color: "var(--text-muted)", textAlign: "center" as const, padding: "40px 0", fontSize: 14 }}>
      Sem dados disponíveis
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 20 }}>

      <h2 style={{ ...S.pageTitle, fontSize: isMobile ? 18 : 22 }}>Relatórios</h2>

      {/* Cards de totais */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr",
        gap: isMobile ? 10 : 16,
      }}>
        <div style={S.statCard("var(--accent-green)")}>
          <div style={S.label}>Receitas</div>
          <div style={{ ...S.value, color: "var(--accent-green)", fontSize: isMobile ? 16 : 26 }}>
            {fmt(totalIncome)}
          </div>
        </div>
        <div style={S.statCard("var(--accent-red)")}>
          <div style={S.label}>Despesas</div>
          <div style={{ ...S.value, color: "var(--accent-red)", fontSize: isMobile ? 16 : 26 }}>
            {fmt(totalExpenses)}
          </div>
        </div>
        <div style={{
          ...S.statCard(balance >= 0 ? "var(--accent-blue)" : "var(--accent-orange)"),
          gridColumn: isMobile ? "1 / -1" : "auto",
        }}>
          <div style={S.label}>Saldo</div>
          <div style={{
            ...S.value,
            color: balance >= 0 ? "var(--accent-blue)" : "var(--accent-orange)",
            fontSize: isMobile ? 16 : 26,
          }}>
            {fmt(balance)}
          </div>
        </div>
      </div>

      {/* Receitas vs Despesas */}
      <div style={isMobile ? S.cardMobile : S.card}>
        <div style={S.sectionTitle}>Receitas vs Despesas por Mês</div>
        {monthlyData.length === 0 ? emptyState : (
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 280}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} />
              <Bar dataKey="income" name="Receitas" fill="var(--accent-green)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Despesas" fill="var(--accent-red)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Evolução */}
      <div style={isMobile ? S.cardMobile : S.card}>
        <div style={S.sectionTitle}>Evolução do Saldo</div>
        {monthlyData.length === 0 ? emptyState : (
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="income" name="Receita" stroke="var(--accent-green)" strokeWidth={2} dot={{ fill: "var(--accent-green)", r: 3 }} />
              <Line type="monotone" dataKey="expense" name="Despesa" stroke="var(--accent-red)" strokeWidth={2} dot={{ fill: "var(--accent-red)", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Distribuição por categoria */}
      <div style={isMobile ? S.cardMobile : S.card}>
        <div style={S.sectionTitle}>Distribuição por Categoria — {filterMonth}</div>
        {categoryData.length === 0 ? (
          <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0", fontSize: 14 }}>
            Nenhum gasto registrado
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {categoryData.map((p) => (
              <div key={p.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, gap: 8 }}>
                  <span style={{
                    fontSize: 13, fontWeight: 500, color: "var(--text-primary)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                  }}>
                    {p.icon} {p.name}
                  </span>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: p.color }}>
                      {fmt(p.value)}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", width: 40, textAlign: "right" as const }}>
                      {totalExpenses ? ((p.value / totalExpenses) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
                <ProgressBar value={p.value} max={totalExpenses} color={p.color} />
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}