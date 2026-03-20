// src/components/RecurringAlerts.tsx
import { useState } from "react";
import type { Recurring, Category } from "../lib/api";
import { S } from "../styles";
import { fmt } from "../helpers";

interface RecurringAlertsProps {
  pending: Recurring[];
  categories: Category[];
  onConfirm: (id: string, data?: { amount?: number; date?: string }) => Promise<any>;
  onDismiss: (id: string) => void;
}

export default function RecurringAlerts({ pending, categories, onConfirm, onDismiss }: RecurringAlertsProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmAmount, setConfirmAmount] = useState("");
  const [confirmDate, setConfirmDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  if (pending.length === 0) return null;

  const openConfirm = (r: Recurring) => {
    setConfirmingId(r.id);
    setConfirmAmount(r.amount ? String(r.amount) : "");
    setConfirmDate(new Date().toISOString().slice(0, 10));
  };

  const handleConfirm = async (id: string) => {
    setLoading(true);
    try {
      await onConfirm(id, {
        amount: confirmAmount ? Number(confirmAmount) : undefined,
        date: confirmDate,
      });
      setConfirmingId(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: "var(--accent-orange, #E8C45A)11",
      border: "1px solid var(--accent-orange, #E8C45A)44",
      borderRadius: "var(--radius-xl)",
      padding: "16px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>🔔</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
            Lançamentos recorrentes pendentes
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {pending.length} lançamento{pending.length !== 1 ? "s" : ""} aguardando confirmação
          </div>
        </div>
      </div>

      {/* Lista de pendentes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {pending.map((r) => {
          const cat = categories.find((c) => c.id === r.categoryId);
          const sub = cat?.subcategories.find((s) => s.id === r.subcategoryId);
          const isConfirming = confirmingId === r.id;

          return (
            <div key={r.id} style={{
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}>
              {/* Info do recorrente */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 38, height: 38,
                  borderRadius: "var(--radius-md)",
                  background: (cat?.color || "#888") + "22",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0,
                }}>
                  {sub?.icon || cat?.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                    {r.description}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" as const, alignItems: "center" }}>
                    <span style={S.pill(cat?.color || "#888")}>{cat?.name}</span>
                    {sub && <span style={S.pill("var(--text-muted)")}>{sub.name}</span>}
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {r.frequency === "monthly" ? "Mensal" : "Anual"} — dia {r.dayOfMonth}
                    </span>
                  </div>
                </div>

                <div style={{
                  fontSize: 15, fontWeight: 800, flexShrink: 0,
                  color: r.type === "income" ? "var(--accent-green)" : "var(--accent-red)",
                }}>
                  {r.amount ? (r.type === "income" ? "+" : "-") + fmt(r.amount) : "Valor variável"}
                </div>
              </div>

              {/* Formulário de confirmação */}
              {isConfirming ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, fontWeight: 600 }}>
                        Valor (R$) {!r.amount && "*"}
                      </div>
                      <input
                        style={{ ...S.input, fontSize: 13 }}
                        type="number" step="0.01" min="0"
                        placeholder={r.amount ? String(r.amount) : "Informe o valor"}
                        value={confirmAmount}
                        onChange={(e) => setConfirmAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, fontWeight: 600 }}>Data</div>
                      <input
                        style={{ ...S.input, fontSize: 13 }}
                        type="date"
                        value={confirmDate}
                        onChange={(e) => setConfirmDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={{ ...S.btn("ghost"), flex: 1, padding: "8px", fontSize: 12 }}
                      onClick={() => setConfirmingId(null)}
                    >
                      Cancelar
                    </button>
                    <button
                      style={{ ...S.btn("primary"), flex: 2, padding: "8px", fontSize: 12, opacity: loading ? 0.7 : 1 }}
                      onClick={() => handleConfirm(r.id)}
                      disabled={loading || (!confirmAmount && !r.amount)}
                    >
                      {loading ? "Confirmando..." : "✅ Confirmar lançamento"}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{ ...S.btn("ghost"), flex: 1, padding: "7px 12px", fontSize: 12 }}
                    onClick={() => onDismiss(r.id)}
                  >
                    Ignorar
                  </button>
                  <button
                    style={{ ...S.btn("primary"), flex: 2, padding: "7px 12px", fontSize: 12 }}
                    onClick={() => openConfirm(r)}
                  >
                    Confirmar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
