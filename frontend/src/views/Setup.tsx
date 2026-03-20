// src/views/Setup.tsx
import { useState } from "react";
import type { Category } from "../lib/api";
import { S } from "../styles";
import { api } from "../lib/api";
import EmojiPicker from "../components/EmojiPicker";
import ColorPicker from "../components/ColorPicker";
import Profile from "../components/Profile";
import { useAuth } from "../context/AuthContext";
import RecurringManager from "../components/RecurringManager";

interface SetupProps {
  categories: Category[];
  onCategoriesChange: () => void;
}

export default function Setup({ categories, onCategoriesChange }: SetupProps) {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "categories" | "profile" | "recurring"
  >("profile");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("📦");
  const [newCatColor, setNewCatColor] = useState("#5A8FE8");
  const [catError, setCatError] = useState("");
  const [catLoading, setCatLoading] = useState(false);

  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatIcon, setEditCatIcon] = useState("");
  const [editCatColor, setEditCatColor] = useState("");

  const [newSubCatId, setNewSubCatId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState("");
  const [newSubSlug, setNewSubSlug] = useState("");
  const [newSubIcon, setNewSubIcon] = useState("📌");
  const [subError, setSubError] = useState("");
  const [subLoading, setSubLoading] = useState(false);

  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubCatId, setEditingSubCatId] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState("");
  const [editSubIcon, setEditSubIcon] = useState("");

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

  const handleCreateCategory = async () => {
    setCatError("");
    if (!newCatName.trim()) {
      setCatError("Informe o nome da categoria.");
      return;
    }
    const slug = newCatSlug || slugify(newCatName);
    setCatLoading(true);
    try {
      await api.createCategory({
        slug,
        name: newCatName,
        icon: newCatIcon,
        color: newCatColor,
      });
      setNewCatName("");
      setNewCatSlug("");
      setNewCatIcon("📦");
      setNewCatColor("#5A8FE8");
      setShowNewCat(false);
      onCategoriesChange();
    } catch (err: any) {
      setCatError(err.message || "Erro ao criar categoria.");
    } finally {
      setCatLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCat) return;
    try {
      await api.updateCategory(editingCat.id, {
        name: editCatName,
        icon: editCatIcon,
        color: editCatColor,
      });
      setEditingCat(null);
      onCategoriesChange();
    } catch (err: any) {
      alert(err.message || "Erro ao editar categoria.");
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`Deletar a categoria "${cat.name}"?`)) return;
    try {
      await api.deleteCategory(cat.id);
      onCategoriesChange();
    } catch (err: any) {
      alert(err.message || "Erro ao deletar categoria.");
    }
  };

  const handleCreateSubcategory = async (categoryId: string) => {
    setSubError("");
    if (!newSubName.trim()) {
      setSubError("Informe o nome da subcategoria.");
      return;
    }
    const slug = newSubSlug || slugify(newSubName);
    setSubLoading(true);
    try {
      await api.createSubcategory(categoryId, {
        slug,
        name: newSubName,
        icon: newSubIcon,
      });
      setNewSubName("");
      setNewSubSlug("");
      setNewSubIcon("📌");
      setNewSubCatId(null);
      onCategoriesChange();
    } catch (err: any) {
      setSubError(err.message || "Erro ao criar subcategoria.");
    } finally {
      setSubLoading(false);
    }
  };

  const handleDeleteSubcategory = async (
    categoryId: string,
    subId: string,
    subName: string,
  ) => {
    if (!confirm(`Deletar a subcategoria "${subName}"?`)) return;
    try {
      await api.deleteSubcategory(categoryId, subId);
      onCategoriesChange();
    } catch (err: any) {
      alert(err.message || "Erro ao deletar subcategoria.");
    }
  };

  const handleEditSubcategory = async () => {
    if (!editingSubId || !editingSubCatId) return;
    try {
      await api.updateSubcategory(editingSubCatId, editingSubId, {
        name: editSubName,
        icon: editSubIcon,
      });
      setEditingSubId(null);
      setEditingSubCatId(null);
      onCategoriesChange();
    } catch (err: any) {
      alert(err.message || "Erro ao editar subcategoria.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Cabeçalho com tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ ...S.pageTitle }}>⚙️ Configurações</h2>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-md)",
          padding: 4,
          width: "fit-content",
        }}
      >
        {(
          [
            { key: "profile", label: "👤 Perfil" },
            { key: "categories", label: "🗂️ Categorias" },
            { key: "recurring", label: "🔄 Recorrentes" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              background:
                activeTab === tab.key ? "var(--bg-surface)" : "transparent",
              color:
                activeTab === tab.key
                  ? "var(--text-primary)"
                  : "var(--text-muted)",
              boxShadow: activeTab === tab.key ? "var(--shadow-sm)" : "none",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Perfil */}
      {activeTab === "profile" && user && (
        <Profile user={user} onUpdate={updateUser} />
      )}

      {/* Tab: Recorrentes */}
      {activeTab === "recurring" && (
          <RecurringManager categories={categories} />
      )}

      {/* Tab: Categorias */}
      {activeTab === "categories" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              style={S.btn("primary")}
              onClick={() => {
                setShowNewCat(true);
                setCatError("");
              }}
            >
              + Nova Categoria
            </button>
          </div>

          {/* Form nova categoria */}
          {showNewCat && (
            <div style={{ ...S.card, borderColor: "var(--accent-blue)" }}>
              <div style={S.sectionTitle}>Nova Categoria</div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div style={S.grid2}>
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginBottom: 6,
                      }}
                    >
                      Nome *
                    </div>
                    <input
                      style={S.input}
                      placeholder="Ex: Educação"
                      value={newCatName}
                      onChange={(e) => {
                        setNewCatName(e.target.value);
                        setNewCatSlug(slugify(e.target.value));
                      }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginBottom: 6,
                      }}
                    >
                      Slug (identificador)
                    </div>
                    <input
                      style={S.input}
                      placeholder="educacao"
                      value={newCatSlug}
                      onChange={(e) => setNewCatSlug(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginBottom: 6,
                    }}
                  >
                    Ícone
                  </div>
                  <EmojiPicker value={newCatIcon} onChange={setNewCatIcon} />
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginBottom: 6,
                    }}
                  >
                    Cor
                  </div>
                  <ColorPicker value={newCatColor} onChange={setNewCatColor} />
                </div>

                {catError && (
                  <div
                    style={{
                      background: "var(--accent-red)22",
                      border: "1px solid var(--accent-red)44",
                      borderRadius: "var(--radius-md)",
                      padding: "8px 12px",
                      fontSize: 13,
                      color: "var(--accent-red)",
                    }}
                  >
                    {catError}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{ ...S.btn("ghost"), flex: 1 }}
                    onClick={() => setShowNewCat(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    style={{ ...S.btn("primary"), flex: 2 }}
                    onClick={handleCreateCategory}
                    disabled={catLoading}
                  >
                    {catLoading ? "Salvando..." : "Criar Categoria"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de categorias */}
          {categories.map((cat) => (
            <div key={cat.id} style={S.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "var(--radius-md)",
                    background: cat.color + "22",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  {cat.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {cat.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {cat.subcategories.length} subcategorias
                  </div>
                </div>
                <div
                  style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}
                >
                  <button
                    style={{
                      ...S.btn("ghost"),
                      padding: "6px 12px",
                      fontSize: 12,
                    }}
                    onClick={() => {
                      setEditingCat(cat);
                      setEditCatName(cat.name);
                      setEditCatIcon(cat.icon);
                      setEditCatColor(cat.color);
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    style={{
                      ...S.btn("ghost"),
                      padding: "6px 12px",
                      fontSize: 12,
                    }}
                    onClick={() =>
                      setExpandedId(expandedId === cat.id ? null : cat.id)
                    }
                  >
                    {expandedId === cat.id ? "▲ Fechar" : "▼ Subcategorias"}
                  </button>
                  <button
                    style={{
                      ...S.btn("danger"),
                      padding: "6px 12px",
                      fontSize: 12,
                    }}
                    onClick={() => handleDeleteCategory(cat)}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Subcategorias */}
              {expandedId === cat.id && (
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {cat.subcategories.map((sub) => (
                      <div
                        key={sub.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 12px",
                          borderRadius: "var(--radius-md)",
                          background: "var(--bg-elevated)",
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{sub.icon}</span>
                        <div style={{ flex: 1 }}>
                          <span
                            style={{
                              fontSize: 13,
                              color: "var(--text-primary)",
                            }}
                          >
                            {sub.name}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setEditingSubId(sub.id);
                            setEditingSubCatId(cat.id);
                            setEditSubName(sub.name);
                            setEditSubIcon(sub.icon);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                            fontSize: 14,
                            padding: 4,
                          }}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteSubcategory(cat.id, sub.id, sub.name)
                          }
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                            fontSize: 14,
                            padding: 4,
                          }}
                          title="Remover"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}

                    {/* Form nova subcategoria */}
                    {newSubCatId === cat.id ? (
                      <div
                        style={{
                          padding: 12,
                          borderRadius: "var(--radius-md)",
                          background: "var(--bg-elevated)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <div style={S.grid2}>
                          <div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--text-muted)",
                                marginBottom: 4,
                              }}
                            >
                              Nome *
                            </div>
                            <input
                              style={S.input}
                              placeholder="Ex: Farmácia"
                              value={newSubName}
                              onChange={(e) => {
                                setNewSubName(e.target.value);
                                setNewSubSlug(slugify(e.target.value));
                              }}
                            />
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--text-muted)",
                                marginBottom: 4,
                              }}
                            >
                              Slug
                            </div>
                            <input
                              style={S.input}
                              placeholder="farmacia"
                              value={newSubSlug}
                              onChange={(e) => setNewSubSlug(e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--text-muted)",
                              marginBottom: 4,
                            }}
                          >
                            Ícone
                          </div>
                          <EmojiPicker
                            value={newSubIcon}
                            onChange={setNewSubIcon}
                          />
                        </div>

                        {subError && (
                          <div
                            style={{
                              background: "var(--accent-red)22",
                              border: "1px solid var(--accent-red)44",
                              borderRadius: "var(--radius-md)",
                              padding: "6px 10px",
                              fontSize: 12,
                              color: "var(--accent-red)",
                            }}
                          >
                            {subError}
                          </div>
                        )}

                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            style={{
                              ...S.btn("ghost"),
                              flex: 1,
                              padding: "8px",
                            }}
                            onClick={() => setNewSubCatId(null)}
                          >
                            Cancelar
                          </button>
                          <button
                            style={{
                              ...S.btn("primary"),
                              flex: 2,
                              padding: "8px",
                            }}
                            onClick={() => handleCreateSubcategory(cat.id)}
                            disabled={subLoading}
                          >
                            {subLoading ? "Salvando..." : "Criar Subcategoria"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        style={{
                          ...S.btn("ghost"),
                          fontSize: 12,
                          padding: "8px",
                        }}
                        onClick={() => {
                          setNewSubCatId(cat.id);
                          setSubError("");
                          setNewSubName("");
                          setNewSubSlug("");
                          setNewSubIcon("📌");
                        }}
                      >
                        + Nova Subcategoria
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Modal editar categoria */}
      {editingCat && (
        <div style={S.modal} onClick={() => setEditingCat(null)}>
          <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>
                Editar Categoria
              </h3>
              <button
                onClick={() => setEditingCat(null)}
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
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginBottom: 6,
                  }}
                >
                  Nome
                </div>
                <input
                  style={S.input}
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginBottom: 6,
                  }}
                >
                  Ícone
                </div>
                <EmojiPicker value={editCatIcon} onChange={setEditCatIcon} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginBottom: 6,
                  }}
                >
                  Cor
                </div>
                <ColorPicker value={editCatColor} onChange={setEditCatColor} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  style={{ ...S.btn("ghost"), flex: 1 }}
                  onClick={() => setEditingCat(null)}
                >
                  Cancelar
                </button>
                <button
                  style={{ ...S.btn("primary"), flex: 2 }}
                  onClick={handleEditCategory}
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar subcategoria */}
      {editingSubId && (
        <div style={S.modal} onClick={() => setEditingSubId(null)}>
          <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>
                Editar Subcategoria
              </h3>
              <button
                onClick={() => setEditingSubId(null)}
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
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginBottom: 6,
                  }}
                >
                  Nome
                </div>
                <input
                  style={S.input}
                  value={editSubName}
                  onChange={(e) => setEditSubName(e.target.value)}
                />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginBottom: 6,
                  }}
                >
                  Ícone
                </div>
                <EmojiPicker value={editSubIcon} onChange={setEditSubIcon} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  style={{ ...S.btn("ghost"), flex: 1 }}
                  onClick={() => setEditingSubId(null)}
                >
                  Cancelar
                </button>
                <button
                  style={{ ...S.btn("primary"), flex: 2 }}
                  onClick={handleEditSubcategory}
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Profile Section ──────────────────────────────────────────────────────────
