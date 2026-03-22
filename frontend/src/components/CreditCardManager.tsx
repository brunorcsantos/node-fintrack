// src/components/CreditCardManager.tsx
import { useState } from "react";
import type { CreditCard, CreditCardInput } from "../lib/api";
import { S } from "../styles";
import ColorPicker from "./ColorPicker";

interface CreditCardManagerProps {
  cards: CreditCard[];
  onCreate: (data: CreditCardInput) => Promise<CreditCard>;
  onUpdate: (id: string, data: Partial<CreditCardInput>) => Promise<CreditCard>;
  onDelete: (id: string) => Promise<void>;
}

const EMPTY_FORM: CreditCardInput = {
  name: "",
  icon: "💳",
  color: "#5A8FE8",
  closingDay: 1,
  dueDay: 10,
  limit: undefined,
  notifyDaysBefore: 3,
};

const CARD_ICONS = ["💳", "🏦", "💰", "🔵", "🟣", "🟡", "🔴", "⚫"];

export default function CreditCardManager({
  cards,
  onCreate,
  onUpdate,
  onDelete,
}: CreditCardManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreditCardInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (card: CreditCard) => {
    setForm({
      name: card.name,
      icon: card.icon,
      color: card.color,
      closingDay: card.closingDay,
      dueDay: card.dueDay,
      limit: card.limit,
      notifyDaysBefore: card.notifyDaysBefore,
    });
    setEditingId(card.id);
    setFormError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!form.name.trim()) {
      setFormError("Informe o nome do cartão.");
      return;
    }
    if (!form.closingDay || form.closingDay < 1 || form.closingDay > 31) {
      setFormError("Dia de fechamento inválido (1-31).");
      return;
    }
    if (!form.dueDay || form.dueDay < 1 || form.dueDay > 31) {
      setFormError("Dia de vencimento inválido (1-31).");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await onUpdate(editingId, form);
      } else {
        await onCreate(form);
      }
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Desativar o cartão "${name}"?`)) return;
    await onDelete(id);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
          {cards.length} cartão{cards.length !== 1 ? "s" : ""} cadastrado
          {cards.length !== 1 ? "s" : ""}
        </div>
        <button style={S.btn("primary")} onClick={openCreate}>
          + Novo Cartão
        </button>
      </div>

      {/* Lista de cartões */}
      {cards.length === 0 ? (
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
            Adicione um cartão para registrar compras e gerenciar faturas.
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {cards.map((card) => (
            <div
              key={card.id}
              style={{
                ...S.card,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              {/* Ícone com cor */}
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "var(--radius-md)",
                  background: card.color + "22",
                  border: `2px solid ${card.color}44`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                {card.icon}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {card.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 4,
                    flexWrap: "wrap" as const,
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    ✂️ Fecha dia <strong>{card.closingDay}</strong>
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    📅 Vence dia <strong>{card.dueDay}</strong>
                  </span>
                  {card.limit && (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      💰 Limite R${" "}
                      {Number(card.limit).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    🔔 Notificar {card.notifyDaysBefore} dia
                    {card.notifyDaysBefore !== 1 ? "s" : ""} antes
                  </span>
                </div>
              </div>

              {/* Ações */}
              <button
                onClick={() => openEdit(card)}
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
                title="Editar"
              >
                ✏️
              </button>

              <button
                onClick={() => handleDelete(card.id, card.name)}
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
                title="Desativar"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de formulário */}
      {showForm && (
        <div style={S.modal} onClick={() => setShowForm(false)}>
          <div
            style={{
              ...S.modalBox,
              maxHeight: "90vh",
              overflowY: "auto" as const,
              width: 480,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Título */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {editingId ? "Editar Cartão" : "Novo Cartão"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: 20,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Nome */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Nome do cartão *
                </div>
                <input
                  style={S.input}
                  placeholder="Ex: Nubank, Itaú Platinum"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, limit: e.target.value ? Number(e.target.value) : undefined })}
                  autoFocus
                />
              </div>

              {/* Ícone */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Ícone
                </div>
                <div
                  style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}
                >
                  {CARD_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setForm({ ...form, icon })}
                      style={{
                        width: 40,
                        height: 40,
                        fontSize: 20,
                        borderRadius: "var(--radius-md)",
                        border: "2px solid",
                        borderColor:
                          form.icon === icon
                            ? "var(--accent-blue)"
                            : "var(--border-default)",
                        background:
                          form.icon === icon
                            ? "var(--accent-blue)22"
                            : "transparent",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cor */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Cor
                </div>
                <ColorPicker
                  value={form.color || "#5A8FE8"}
                  onChange={(color) => setForm({ ...form, color })}
                />
              </div>

              {/* Fechamento + Vencimento */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    Dia de fechamento *
                  </div>
                  <input
                    style={S.input}
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ex: 7"
                    value={form.closingDay || ""}
                    onChange={(e) =>
                      setForm({ ...form, closingDay: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    Dia de vencimento *
                  </div>
                  <input
                    style={S.input}
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ex: 15"
                    value={form.dueDay || ""}
                    onChange={(e) =>
                      setForm({ ...form, dueDay: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              {/* Limite */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Limite (R$) — opcional
                </div>
                <input
                  style={S.input}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 5000,00"
                  value={form.limit ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      limit: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>

              {/* Notificar X dias antes */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Notificar quantos dias antes do vencimento?
                </div>
                <input
                  style={S.input}
                  type="number"
                  min="0"
                  max="30"
                  value={form.notifyDaysBefore ?? 3}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notifyDaysBefore: Number(e.target.value),
                    })
                  }
                />
              </div>

              {/* Preview */}
              <div
                style={{
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "var(--radius-md)",
                    background: (form.color || "#5A8FE8") + "22",
                    border: `2px solid ${form.color || "#5A8FE8"}44`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {form.icon || "💳"}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {form.name || "Nome do cartão"}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginTop: 2,
                    }}
                  >
                    Fecha dia {form.closingDay || "?"} · Vence dia{" "}
                    {form.dueDay || "?"}
                  </div>
                </div>
              </div>

              {/* Erro */}
              {formError && (
                <div
                  style={{
                    background: "var(--accent-red)15",
                    border: "1px solid var(--accent-red)44",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "var(--accent-red)",
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <span>⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              {/* Ações */}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  style={{ ...S.btn("ghost"), flex: 1 }}
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </button>
                <button
                  style={{
                    ...S.btn("primary"),
                    flex: 2,
                    opacity: saving ? 0.7 : 1,
                  }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? "Salvando..."
                    : editingId
                      ? "Salvar Alterações"
                      : "Criar Cartão"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
