// src/components/RecurringManager.tsx
import { useState, useMemo } from "react";
import type { Category, Recurring, RecurringInput } from "../lib/api";
import { S } from "../styles";
import { fmt } from "../helpers";

interface RecurringManagerProps {
  categories: Category[];
  recurring: Recurring[];
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, data: Partial<RecurringInput>) => Promise<Recurring>;
}

const EMPTY_FORM: RecurringInput = {
  description: "",
  amount: undefined,
  type: "expense",
  categoryId: "",
  subcategoryId: undefined,
  frequency: "monthly",
  dayOfMonth: 1,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: undefined,
  mode: "indefinite",
  installments: undefined,
};

export default function RecurringManager({ categories, recurring, onDelete, onUpdate }: RecurringManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RecurringInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const filteredCategories = useMemo(() =>
    categories.filter((c) => form.type === "income" ? c.slug === "receita" : c.slug !== "receita"),
    [categories, form.type]
  );

  const selectedCategory = useMemo(() =>
    categories.find((c) => c.id === form.categoryId),
    [categories, form.categoryId]
  );

  const openEdit = (r: Recurring) => {
    setForm({
      description: r.description,
      amount: r.amount,
      type: r.type,
      categoryId: r.categoryId,
      subcategoryId: r.subcategoryId,
      frequency: r.frequency,
      dayOfMonth: r.dayOfMonth,
      startDate: r.startDate.slice(0, 10),
      endDate: r.endDate?.slice(0, 10),
      mode: r.mode,
      installments: r.installments,
    });
    setEditingId(r.id);
    setFormError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!form.description.trim()) { setFormError("Informe a descrição."); return; }
    if (!form.categoryId) { setFormError("Selecione uma categoria."); return; }
    if (!form.startDate) { setFormError("Informe a data de início."); return; }

    setSaving(true);
    try {
      if (editingId) await onUpdate(editingId, form);
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, description: string) => {
    if (!confirm(`Desativar "${description}"?`)) return;
    await onDelete(id);
  };

  const frequencyLabel = (f: string) => f === "monthly" ? "Mensal" : "Anual";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Lista */}
      {recurring.length === 0 ? (
        <div style={{
          ...S.card, textAlign: "center", padding: 48,
          color: "var(--text-muted)", fontSize: 14,
        }}>
          Nenhum lançamento recorrente cadastrado.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recurring.map((r) => {
            const cat = categories.find((c) => c.id === r.categoryId);
            const sub = cat?.subcategories.find((s) => s.id === r.subcategoryId);
            return (
              <div key={r.id} style={{
                ...S.card,
                display: "flex", alignItems: "center", gap: 14,
              }}>
                {/* Ícone */}
                <div style={{
                  width: 42, height: 42, borderRadius: "var(--radius-md)",
                  background: (cat?.color || "#888") + "22",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                }}>
                  {sub?.icon || cat?.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                    {r.description}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" as const, alignItems: "center" }}>
                    <span style={S.pill(cat?.color || "#888")}>{cat?.name}</span>
                    {sub && <span style={S.pill("var(--text-muted)")}>{sub.name}</span>}
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {frequencyLabel(r.frequency)} — dia {r.dayOfMonth}
                    </span>
                    {r.endDate && (
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        até {new Date(r.endDate + "T12:00:00").toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Valor */}
                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 800,
                    color: r.type === "income" ? "var(--accent-green)" : "var(--accent-red)",
                  }}>
                    {r.amount ? (r.type === "income" ? "+" : "-") + fmt(r.amount) : "Valor variável"}
                  </div>
                </div>

                {/* Ações */}
                <button onClick={() => openEdit(r)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-muted)", fontSize: 14, padding: 4,
                  borderRadius: "var(--radius-sm)", flexShrink: 0,
                }} title="Editar">✏️</button>

                <button onClick={() => handleDelete(r.id, r.description)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-muted)", fontSize: 14, padding: 4,
                  borderRadius: "var(--radius-sm)", flexShrink: 0,
                }} title="Desativar">🗑️</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de formulário */}
      {showForm && (
        <div style={S.modal} onClick={() => setShowForm(false)}>
          <div style={{
            ...S.modalBox, maxHeight: "90vh", overflowY: "auto" as const, width: 480,
          }} onClick={(e) => e.stopPropagation()}>

            {/* Título */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                {editingId ? "Editar Recorrente" : "Novo Recorrente"}
              </h3>
              <button onClick={() => setShowForm(false)} style={{
                background: "none", border: "none", color: "var(--text-muted)",
                fontSize: 20, cursor: "pointer",
              }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Tipo */}
              <div style={{
                display: "flex", gap: 8, background: "var(--bg-elevated)",
                borderRadius: "var(--radius-md)", padding: 4,
              }}>
                {(["expense", "income"] as const).map((t) => (
                  <button key={t} onClick={() => setForm({ ...form, type: t, categoryId: "", subcategoryId: undefined })}
                    style={{
                      flex: 1, padding: "9px", borderRadius: "var(--radius-sm)", border: "none",
                      cursor: "pointer", fontSize: 13, fontWeight: 700,
                      background: form.type === t ? (t === "income" ? "var(--accent-green)" : "var(--accent-red)") : "transparent",
                      color: form.type === t ? "#ffffff" : "var(--text-muted)",
                      transition: "all 0.15s",
                    }}>
                    {t === "expense" ? "💸 Despesa" : "💰 Receita"}
                  </button>
                ))}
              </div>

              {/* Descrição */}
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>Descrição *</div>
                <input style={S.input} placeholder="Ex: Aluguel" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} autoFocus />
              </div>

              {/* Valor */}
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>
                  Valor (R$) — deixe vazio se variável
                </div>
                <input style={S.input} type="number" step="0.01" min="0" placeholder="0,00"
                  value={form.amount ?? ""}
                  onChange={(e) => setForm({ ...form, amount: e.target.value ? Number(e.target.value) : undefined })} />
              </div>

              {/* Frequência + Dia */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>Frequência *</div>
                  <select style={S.select} value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value as "monthly" | "yearly" })}>
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>Dia do mês *</div>
                  <input style={S.input} type="number" min="1" max="31" value={form.dayOfMonth}
                    onChange={(e) => setForm({ ...form, dayOfMonth: Number(e.target.value) })} />
                </div>
              </div>

              {/* Início + Fim */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>Data de início *</div>
                  <input style={S.input} type="date" value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>
                    Data de fim — opcional
                  </div>
                  <input style={S.input} type="date" value={form.endDate ?? ""}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value || undefined })} />
                </div>
              </div>

              {/* Categoria */}
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>Categoria *</div>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                  {filteredCategories.map((c) => (
                    <button key={c.id}
                      onClick={() => setForm({ ...form, categoryId: c.id, subcategoryId: undefined })}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 12px", borderRadius: "var(--radius-full)",
                        border: "2px solid",
                        borderColor: form.categoryId === c.id ? c.color : "var(--border-default)",
                        background: form.categoryId === c.id ? c.color + "22" : "transparent",
                        color: form.categoryId === c.id ? c.color : "var(--text-secondary)",
                        cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                      }}>
                      <span>{c.icon}</span><span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategoria */}
              {selectedCategory && selectedCategory.subcategories.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>Subcategoria</div>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                    <button onClick={() => setForm({ ...form, subcategoryId: undefined })}
                      style={{
                        padding: "5px 12px", borderRadius: "var(--radius-full)", border: "2px solid",
                        borderColor: !form.subcategoryId ? "var(--accent-blue)" : "var(--border-default)",
                        background: !form.subcategoryId ? "var(--accent-blue)22" : "transparent",
                        color: !form.subcategoryId ? "var(--accent-blue)" : "var(--text-muted)",
                        cursor: "pointer", fontSize: 12, fontWeight: 600,
                      }}>Todas</button>
                    {selectedCategory.subcategories.map((s) => (
                      <button key={s.id} onClick={() => setForm({ ...form, subcategoryId: s.id })}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "5px 12px", borderRadius: "var(--radius-full)", border: "2px solid",
                          borderColor: form.subcategoryId === s.id ? "var(--accent-blue)" : "var(--border-default)",
                          background: form.subcategoryId === s.id ? "var(--accent-blue)22" : "transparent",
                          color: form.subcategoryId === s.id ? "var(--accent-blue)" : "var(--text-secondary)",
                          cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.15s",
                        }}>
                        <span>{s.icon}</span><span>{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Erro */}
              {formError && (
                <div style={{
                  background: "var(--accent-red)15", border: "1px solid var(--accent-red)44",
                  borderRadius: "var(--radius-md)", padding: "10px 14px",
                  fontSize: 13, color: "var(--accent-red)", display: "flex", gap: 8,
                }}>
                  <span>⚠️</span><span>{formError}</span>
                </div>
              )}

              {/* Ações */}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button style={{ ...S.btn("ghost"), flex: 1 }} onClick={() => setShowForm(false)}>Cancelar</button>
                <button style={{ ...S.btn("primary"), flex: 2, opacity: saving ? 0.7 : 1 }}
                  onClick={handleSave} disabled={saving}>
                  {saving ? "Salvando..." : editingId ? "Salvar Alterações" : "Criar Recorrente"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}