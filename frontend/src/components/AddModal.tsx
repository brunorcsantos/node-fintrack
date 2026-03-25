// src/components/AddModal.tsx
import { useState, useEffect, useMemo } from "react";
import type {
  Transaction,
  Category,
  RecurringInput,
  CreditCard,
  CreditCardTransactionInput,
} from "../lib/api";
import { S } from "../styles";

interface AddModalProps {
  categories: Category[];
  cards: CreditCard[];
  onAdd: (tx: Omit<Transaction, "id" | "category" | "subcategory">) => void;
  onAddRecurring: (data: RecurringInput) => Promise<void>;
  onAddCardTransaction: (
    cardId: string,
    data: CreditCardTransactionInput,
  ) => Promise<void>;
  onClose: () => void;
  editingTransaction?: Transaction | null;
}

const EMPTY_RECURRING: RecurringInput = {
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

export default function AddModal({
  categories,
  onAdd,
  cards,
  onAddCardTransaction,
  onAddRecurring,
  onClose,
  editingTransaction,
}: AddModalProps) {
  const isEditing = !!editingTransaction;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [modalMode, setModalMode] = useState<"single" | "recurring" | "card">(
    "single",
  );
  const [selectedCardId, setSelectedCardId] = useState("");

  // Lançamento único
  const [type, setType] = useState<"expense" | "income">(
    editingTransaction?.type || "expense",
  );
  const [description, setDescription] = useState(
    editingTransaction?.description || "",
  );
  const [amount, setAmount] = useState(
    editingTransaction?.amount ? String(editingTransaction.amount) : "",
  );
  const [categoryId, setCategoryId] = useState(
    editingTransaction?.categoryId || "",
  );
  const [subcategoryId, setSubcategoryId] = useState(
    editingTransaction?.subcategoryId || "",
  );
  const [date, setDate] = useState(
    editingTransaction?.date || new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState(editingTransaction?.notes || "");

  // Recorrente
  const [recurring, setRecurring] = useState<RecurringInput>(EMPTY_RECURRING);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredCategories = (t: "expense" | "income") =>
    categories.filter((c) =>
      t === "income" ? c.slug === "receita" : c.slug !== "receita",
    );

  const effectiveCategoryId =
    categoryId || filteredCategories(type)[0]?.id || "";
  const cat = categories.find((c) => c.id === effectiveCategoryId);

  const recurringCat = useMemo(
    () => categories.find((c) => c.id === recurring.categoryId),
    [categories, recurring.categoryId],
  );

  const recurringFilteredCats = useMemo(
    () =>
      categories.filter((c) =>
        recurring.type === "income"
          ? c.slug === "receita"
          : c.slug !== "receita",
      ),
    [categories, recurring.type],
  );

  const handleTypeChange = (t: "expense" | "income") => {
    setType(t);
    setCategoryId("");
    setSubcategoryId("");
  };

  const handleSubmitSingle = () => {
    if (!description.trim() || !amount || !date || !effectiveCategoryId) return;
    onAdd({
      description,
      amount: parseFloat(amount),
      categoryId: effectiveCategoryId,
      subcategoryId: subcategoryId || undefined,
      date,
      type,
      notes,
    });
  };

  // CORREÇÃO: handleSubmitRecurring agora chama onAddRecurring (estava chamando
  // onAddCardTransaction por engano, fazendo o modo recorrente nunca funcionar).
  const handleSubmitRecurring = async () => {
    setError("");
    if (!recurring.description.trim()) {
      setError("Informe a descrição.");
      return;
    }
    if (!recurring.categoryId) {
      setError("Selecione uma categoria.");
      return;
    }
    if (recurring.mode === "installments") {
      if (!recurring.amount) {
        setError("Informe o valor da parcela.");
        return;
      }
      if (!recurring.installments || recurring.installments < 2) {
        setError("Informe o número de parcelas (mínimo 2).");
        return;
      }
    }

    setSaving(true);
    try {
      await onAddRecurring(recurring); // ← CORRIGIDO: era onAddCardTransaction
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitCard = async () => {
    setError("");
    if (!selectedCardId) {
      setError("Selecione um cartão.");
      return;
    }
    if (!description.trim()) {
      setError("Informe a descrição.");
      return;
    }
    if (!amount) {
      setError("Informe o valor.");
      return;
    }
    if (!date) {
      setError("Informe a data.");
      return;
    }
    if (!effectiveCategoryId) {
      setError("Selecione uma categoria.");
      return;
    }

    setSaving(true);
    try {
      await onAddCardTransaction(selectedCardId, {
        description,
        amount: parseFloat(amount),
        date,
        categoryId: effectiveCategoryId,
        subcategoryId: subcategoryId || undefined,
        notes,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = S.input;

  const pillStyle = (active: boolean, color?: string) => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 12px",
    borderRadius: "var(--radius-full)",
    border: "2px solid",
    borderColor: active
      ? color || "var(--accent-blue)"
      : "var(--border-default)",
    background: active ? (color || "var(--accent-blue)") + "22" : "transparent",
    color: active ? color || "var(--accent-blue)" : "var(--text-secondary)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    transition: "all 0.15s",
    whiteSpace: "nowrap" as const,
  });

  return (
    <div style={S.modal} onClick={onClose}>
      <div
        style={{
          ...S.modalBox,
          maxHeight: "90vh",
          overflowY: "auto" as const,
          width: isMobile ? "100%" : 500,
          margin: isMobile ? "auto 0 0 0" : "auto",
          borderRadius: isMobile
            ? "var(--radius-xl) var(--radius-xl) 0 0"
            : "var(--radius-xl)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Título */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {isEditing ? "Editar Lançamento" : "Novo Lançamento"}
          </h3>
          <button
            onClick={onClose}
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

        {/* Toggle Modo — só para novos lançamentos */}
        {!isEditing && (
          <div
            style={{
              display: "flex",
              gap: 8,
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-md)",
              padding: 4,
              marginBottom: 20,
            }}
          >
            {(
              [
                { key: "single", label: "📋 Único" },
                { key: "recurring", label: "🔄 Recorrente" },
                { key: "card", label: "💳 Cartão" },
              ] as const
            ).map((m) => (
              <button
                key={m.key}
                onClick={() => {
                  setModalMode(m.key);
                  setError("");
                }}
                style={{
                  flex: 1,
                  padding: "9px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "all 0.15s",
                  background:
                    modalMode === m.key ? "var(--bg-surface)" : "transparent",
                  color:
                    modalMode === m.key
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  boxShadow: modalMode === m.key ? "var(--shadow-sm)" : "none",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* ── MODO ÚNICO ──────────────────────────────────────────────────── */}
        {(modalMode === "single" || isEditing) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Tipo */}
            <div
              style={{
                display: "flex",
                gap: 8,
                background: "var(--bg-elevated)",
                borderRadius: "var(--radius-md)",
                padding: 4,
              }}
            >
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  style={{
                    flex: 1,
                    padding: "9px",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    background:
                      type === t
                        ? t === "income"
                          ? "var(--accent-green)"
                          : "var(--accent-red)"
                        : "transparent",
                    color: type === t ? "#ffffff" : "var(--text-muted)",
                    transition: "all 0.15s",
                  }}
                >
                  {t === "expense" ? "💸 Despesa" : "💰 Receita"}
                </button>
              ))}
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
                Descrição *
              </div>
              <input
                style={inputStyle}
                placeholder="Ex: Supermercado"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
              />
            </div>

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
                  Valor (R$) *
                </div>
                <input
                  style={inputStyle}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
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
                  Data *
                </div>
                <input
                  style={inputStyle}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
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
                Categoria
              </div>
              <div
                style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}
              >
                {filteredCategories(type).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCategoryId(c.id);
                      setSubcategoryId("");
                    }}
                    style={pillStyle(effectiveCategoryId === c.id, c.color)}
                  >
                    <span>{c.icon}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {cat && cat.subcategories.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Subcategoria
                </div>
                <div
                  style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}
                >
                  <button
                    onClick={() => setSubcategoryId("")}
                    style={pillStyle(!subcategoryId)}
                  >
                    Todas
                  </button>
                  {cat.subcategories.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSubcategoryId(s.id)}
                      style={pillStyle(subcategoryId === s.id)}
                    >
                      <span>{s.icon}</span>
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                Observações
              </div>
              <input
                style={inputStyle}
                placeholder="Opcional..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitSingle();
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button style={{ ...S.btn("ghost"), flex: 1 }} onClick={onClose}>
                Cancelar
              </button>
              <button
                style={{
                  ...S.btn("primary"),
                  flex: 2,
                  opacity: !description.trim() || !amount || !date ? 0.5 : 1,
                }}
                onClick={handleSubmitSingle}
                disabled={!description.trim() || !amount || !date}
              >
                {isEditing ? "Salvar Alterações" : "Salvar Lançamento"}
              </button>
            </div>
          </div>
        )}

        {/* ── MODO RECORRENTE ──────────────────────────────────────────────── */}
        {modalMode === "recurring" && !isEditing && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Modo: Indeterminado / Parcelas */}
            <div
              style={{
                display: "flex",
                gap: 8,
                background: "var(--bg-elevated)",
                borderRadius: "var(--radius-md)",
                padding: 4,
              }}
            >
              {(
                [
                  { key: "indefinite", label: "♾️ Indeterminado" },
                  { key: "installments", label: "🔢 Parcelas" },
                ] as const
              ).map((m) => (
                <button
                  key={m.key}
                  onClick={() =>
                    setRecurring({
                      ...recurring,
                      mode: m.key,
                      installments: undefined,
                      endDate: undefined,
                    })
                  }
                  style={{
                    flex: 1,
                    padding: "9px",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    transition: "all 0.15s",
                    background:
                      recurring.mode === m.key
                        ? "var(--bg-surface)"
                        : "transparent",
                    color:
                      recurring.mode === m.key
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                    boxShadow:
                      recurring.mode === m.key ? "var(--shadow-sm)" : "none",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Tipo */}
            <div
              style={{
                display: "flex",
                gap: 8,
                background: "var(--bg-elevated)",
                borderRadius: "var(--radius-md)",
                padding: 4,
              }}
            >
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    setRecurring({
                      ...recurring,
                      type: t,
                      categoryId: "",
                      subcategoryId: undefined,
                    })
                  }
                  style={{
                    flex: 1,
                    padding: "9px",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    background:
                      recurring.type === t
                        ? t === "income"
                          ? "var(--accent-green)"
                          : "var(--accent-red)"
                        : "transparent",
                    color:
                      recurring.type === t ? "#ffffff" : "var(--text-muted)",
                    transition: "all 0.15s",
                  }}
                >
                  {t === "expense" ? "💸 Despesa" : "💰 Receita"}
                </button>
              ))}
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
                Descrição *
              </div>
              <input
                style={inputStyle}
                placeholder={
                  recurring.mode === "installments"
                    ? "Ex: iPhone 16 Pro"
                    : "Ex: Conta de Luz"
                }
                value={recurring.description}
                onChange={(e) =>
                  setRecurring({ ...recurring, description: e.target.value })
                }
                autoFocus
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
                Valor (R$){" "}
                {recurring.mode === "installments"
                  ? "por parcela *"
                  : "— deixe vazio se variável"}
              </div>
              <input
                style={inputStyle}
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={recurring.amount ?? ""}
                onChange={(e) =>
                  setRecurring({
                    ...recurring,
                    amount: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>

            {recurring.mode === "installments" && (
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Número de parcelas *
                </div>
                <input
                  style={inputStyle}
                  type="number"
                  min="2"
                  placeholder="Ex: 12"
                  value={recurring.installments ?? ""}
                  onChange={(e) =>
                    setRecurring({
                      ...recurring,
                      installments: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
                {recurring.amount && recurring.installments && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginTop: 6,
                    }}
                  >
                    Total:{" "}
                    <strong style={{ color: "var(--text-primary)" }}>
                      R${" "}
                      {(
                        recurring.amount * recurring.installments
                      ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                )}
              </div>
            )}

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
                  Frequência *
                </div>
                <select
                  style={S.select}
                  value={recurring.frequency}
                  onChange={(e) =>
                    setRecurring({
                      ...recurring,
                      frequency: e.target.value as "monthly" | "yearly",
                    })
                  }
                >
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                </select>
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
                  Dia do mês *
                </div>
                <input
                  style={inputStyle}
                  type="number"
                  min="1"
                  max="31"
                  value={recurring.dayOfMonth}
                  onChange={(e) =>
                    setRecurring({
                      ...recurring,
                      dayOfMonth: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

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
                  Data de início *
                </div>
                <input
                  style={inputStyle}
                  type="date"
                  value={recurring.startDate}
                  onChange={(e) =>
                    setRecurring({ ...recurring, startDate: e.target.value })
                  }
                />
              </div>
              {recurring.mode === "indefinite" && (
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    Data de fim — opcional
                  </div>
                  <input
                    style={inputStyle}
                    type="date"
                    value={recurring.endDate ?? ""}
                    onChange={(e) =>
                      setRecurring({
                        ...recurring,
                        endDate: e.target.value || undefined,
                      })
                    }
                  />
                </div>
              )}
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
                Categoria *
              </div>
              <div
                style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}
              >
                {recurringFilteredCats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() =>
                      setRecurring({
                        ...recurring,
                        categoryId: c.id,
                        subcategoryId: undefined,
                      })
                    }
                    style={pillStyle(recurring.categoryId === c.id, c.color)}
                  >
                    <span>{c.icon}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {recurringCat && recurringCat.subcategories.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Subcategoria
                </div>
                <div
                  style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}
                >
                  <button
                    onClick={() =>
                      setRecurring({ ...recurring, subcategoryId: undefined })
                    }
                    style={pillStyle(!recurring.subcategoryId)}
                  >
                    Todas
                  </button>
                  {recurringCat.subcategories.map((s) => (
                    <button
                      key={s.id}
                      onClick={() =>
                        setRecurring({ ...recurring, subcategoryId: s.id })
                      }
                      style={pillStyle(recurring.subcategoryId === s.id)}
                    >
                      <span>{s.icon}</span>
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
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
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button style={{ ...S.btn("ghost"), flex: 1 }} onClick={onClose}>
                Cancelar
              </button>
              <button
                style={{
                  ...S.btn("primary"),
                  flex: 2,
                  opacity: saving ? 0.7 : 1,
                }}
                onClick={handleSubmitRecurring}
                disabled={saving}
              >
                {saving
                  ? "Salvando..."
                  : recurring.mode === "installments"
                    ? `Criar ${recurring.installments || ""}x Parcelas`
                    : "Criar Recorrente"}
              </button>
            </div>
          </div>
        )}

        {/* ── MODO CARTÃO ──────────────────────────────────────────────── */}
        {modalMode === "card" && !isEditing && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                Cartão *
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cards.length === 0 ? (
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      padding: "12px",
                      background: "var(--bg-elevated)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    Nenhum cartão cadastrado. Adicione um em Configurações → 💳
                    Cartões.
                  </div>
                ) : (
                  cards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCardId(card.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        borderRadius: "var(--radius-md)",
                        border: "2px solid",
                        borderColor:
                          selectedCardId === card.id
                            ? card.color
                            : "var(--border-default)",
                        background:
                          selectedCardId === card.id
                            ? card.color + "11"
                            : "transparent",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        textAlign: "left" as const,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{card.icon}</span>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                          }}
                        >
                          {card.name}
                        </div>
                        <div
                          style={{ fontSize: 11, color: "var(--text-muted)" }}
                        >
                          Fecha dia {card.closingDay} · Vence dia {card.dueDay}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
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
                Descrição *
              </div>
              <input
                style={S.input}
                placeholder="Ex: Compras no Mercado Livre"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

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
                  Valor (R$) *
                </div>
                <input
                  style={S.input}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
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
                  Data da compra *
                </div>
                <input
                  style={S.input}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
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
                Categoria
              </div>
              <div
                style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}
              >
                {categories
                  .filter((c) => c.slug !== "receita")
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCategoryId(c.id);
                        setSubcategoryId("");
                      }}
                      style={pillStyle(effectiveCategoryId === c.id, c.color)}
                    >
                      <span>{c.icon}</span>
                      <span>{c.name}</span>
                    </button>
                  ))}
              </div>
            </div>

            {cat && cat.subcategories.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Subcategoria
                </div>
                <div
                  style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}
                >
                  <button
                    onClick={() => setSubcategoryId("")}
                    style={pillStyle(!subcategoryId)}
                  >
                    Todas
                  </button>
                  {cat.subcategories.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSubcategoryId(s.id)}
                      style={pillStyle(subcategoryId === s.id)}
                    >
                      <span>{s.icon}</span>
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
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
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button style={{ ...S.btn("ghost"), flex: 1 }} onClick={onClose}>
                Cancelar
              </button>
              <button
                style={{
                  ...S.btn("primary"),
                  flex: 2,
                  opacity: saving ? 0.7 : 1,
                }}
                onClick={handleSubmitCard}
                disabled={saving || cards.length === 0}
              >
                {saving ? "Salvando..." : "💳 Lançar no Cartão"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}