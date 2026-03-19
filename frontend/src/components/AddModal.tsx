// src/components/AddModal.tsx
import { useState, useEffect } from "react";
import type { Transaction, Category } from "../lib/api";
import { S } from "../styles";
import EmojiPicker from "./EmojiPicker";

interface AddModalProps {
  categories: Category[];
  onAdd: (tx: Omit<Transaction, "id" | "category" | "subcategory">) => void;
  onClose: () => void;
}

export default function AddModal({ categories, onAdd, onClose }: AddModalProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [type, setType] = useState<"expense" | "income">("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredCategories = categories.filter((c) =>
    type === "income" ? c.slug === "receita" : c.slug !== "receita"
  );

  const effectiveCategoryId = categoryId || filteredCategories[0]?.id || "";
  const cat = categories.find((c) => c.id === effectiveCategoryId);

  const handleTypeChange = (t: "expense" | "income") => {
    setType(t);
    setCategoryId("");
    setSubcategoryId("");
  };

  const handleSubmit = () => {
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

  return (
    <div style={S.modal} onClick={onClose}>
      <div style={{
        ...S.modalBox,
        maxHeight: "90vh",
        overflowY: "auto" as const,
        width: isMobile ? "100%" : 480,
        margin: isMobile ? "auto 0 0 0" : "auto",
        borderRadius: isMobile ? "var(--radius-xl) var(--radius-xl) 0 0" : "var(--radius-xl)",
      }} onClick={(e) => e.stopPropagation()}>

        {/* Título */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
            Novo Lançamento
          </h3>
          <button onClick={onClose} style={{
            background: "none", border: "none",
            color: "var(--text-muted)", fontSize: 20, cursor: "pointer",
            width: 32, height: 32, borderRadius: "var(--radius-md)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Toggle Despesa / Receita */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 24,
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-md)", padding: 4,
        }}>
          {(["expense", "income"] as const).map((t) => (
            <button key={t} onClick={() => handleTypeChange(t)} style={{
              flex: 1, padding: "9px", borderRadius: "var(--radius-sm)",
              border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700,
              background: type === t
                ? (t === "income" ? "var(--accent-green)" : "var(--accent-red)")
                : "transparent",
              color: type === t ? "#ffffff" : "var(--text-muted)",
              transition: "all 0.15s",
            }}>
              {t === "expense" ? "💸 Despesa" : "💰 Receita"}
            </button>
          ))}
        </div>

        {/* Campos */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Descrição */}
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>
              Descrição *
            </div>
            <input
              style={S.input}
              placeholder="Ex: Supermercado Extra"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
            />
          </div>

          {/* Valor + Data */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>
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
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>
                Data *
              </div>
              <input
                style={S.input}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>
              Categoria
            </div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
              {filteredCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setCategoryId(c.id); setSubcategoryId(""); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 12px",
                    borderRadius: "var(--radius-full)",
                    border: "2px solid",
                    borderColor: effectiveCategoryId === c.id ? c.color : "var(--border-default)",
                    background: effectiveCategoryId === c.id ? c.color + "22" : "transparent",
                    color: effectiveCategoryId === c.id ? c.color : "var(--text-secondary)",
                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                    transition: "all 0.15s",
                  }}
                >
                  <span>{c.icon}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subcategoria */}
          {cat && cat.subcategories.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>
                Subcategoria
              </div>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                <button
                  onClick={() => setSubcategoryId("")}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "var(--radius-full)",
                    border: "2px solid",
                    borderColor: !subcategoryId ? "var(--accent-blue)" : "var(--border-default)",
                    background: !subcategoryId ? "var(--accent-blue)22" : "transparent",
                    color: !subcategoryId ? "var(--accent-blue)" : "var(--text-muted)",
                    cursor: "pointer", fontSize: 12, fontWeight: 600,
                  }}
                >
                  Todas
                </button>
                {cat.subcategories.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSubcategoryId(s.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "5px 12px",
                      borderRadius: "var(--radius-full)",
                      border: "2px solid",
                      borderColor: subcategoryId === s.id ? "var(--accent-blue)" : "var(--border-default)",
                      background: subcategoryId === s.id ? "var(--accent-blue)22" : "transparent",
                      color: subcategoryId === s.id ? "var(--accent-blue)" : "var(--text-secondary)",
                      cursor: "pointer", fontSize: 12, fontWeight: 600,
                      transition: "all 0.15s",
                    }}
                  >
                    <span>{s.icon}</span>
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>
              Observações
            </div>
            <input
              style={S.input}
              placeholder="Opcional..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            />
          </div>
        </div>

        {/* Ações */}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button style={{ ...S.btn("ghost"), flex: 1 }} onClick={onClose}>
            Cancelar
          </button>
          <button
            style={{
              ...S.btn("primary"), flex: 2,
              opacity: (!description.trim() || !amount || !date) ? 0.5 : 1,
            }}
            onClick={handleSubmit}
            disabled={!description.trim() || !amount || !date}
          >
            Salvar Lançamento
          </button>
        </div>

      </div>
    </div>
  );
}