// src/components/Profile.tsx
import { useState } from "react";
import { api } from "../lib/api";
import type { User } from "../lib/api";
import { S } from "../styles";
import { useAuth } from "../context/AuthContext";

interface ProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

export default function Profile({ user, onUpdate }: ProfileProps) {
  const { logout } = useAuth();

  // Gera cor consistente baseada no nome do usuário
  const avatarColor = () => {
    const colors = [
      "#F28B82", "#FBBC04", "#FFF475", "#CCFF90",
      "#A8C7FA", "#D7AEFB", "#FDCFE8", "#E6C9A8",
      "#4CAF50", "#2196F3", "#9C27B0", "#FF9800",
      "#00BCD4", "#E91E63", "#8BC34A", "#FF5722",
    ];
    let hash = 0;
    for (let i = 0; i < user.name.length; i++) {
      hash = user.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const bgColor = avatarColor();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // ── Senha ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleUpdateProfile = async () => {
    setProfileError(""); setProfileSuccess("");
    if (!name.trim()) { setProfileError("Informe o nome."); return; }
    if (!email.trim()) { setProfileError("Informe o e-mail."); return; }

    setProfileLoading(true);
    try {
      const updated = await api.updateProfile({ name, email });
      onUpdate(updated);
      setProfileSuccess("Perfil atualizado com sucesso!");
      setTimeout(() => setProfileSuccess(""), 3000);
    } catch (err: any) {
      setProfileError(err.message || "Erro ao atualizar perfil.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordError(""); setPasswordSuccess("");
    if (!currentPassword) { setPasswordError("Informe a senha atual."); return; }
    if (!newPassword) { setPasswordError("Informe a nova senha."); return; }
    if (newPassword.length < 6) { setPasswordError("A nova senha deve ter no mínimo 6 caracteres."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("As senhas não coincidem."); return; }

    setPasswordLoading(true);
    try {
      await api.updatePassword({ currentPassword, newPassword });
      setPasswordSuccess("Senha alterada com sucesso!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch (err: any) {
      setPasswordError(err.message || "Erro ao alterar senha.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const feedbackStyle = (type: "success" | "error") => ({
    borderRadius: "var(--radius-md)",
    padding: "10px 14px",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: type === "success" ? "var(--accent-green)15" : "var(--accent-red)15",
    border: `1px solid ${type === "success" ? "var(--accent-green)44" : "var(--accent-red)44"}`,
    color: type === "success" ? "var(--accent-green)" : "var(--accent-red)",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Avatar + info */}
      <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 56, height: 56,
          borderRadius: "var(--radius-full)",
          background: bgColor,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 700,
          color: "#000000",
          flexShrink: 0,
          userSelect: "none" as const,
        }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{user.name}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{user.email}</div>
        </div>
        <button
          onClick={logout}
          style={{ ...S.btn("danger"), marginLeft: "auto", padding: "8px 14px", fontSize: 12 }}
        >
          🚪 Sair
        </button>
      </div>

      {/* Dados pessoais */}
      <div style={S.card}>
        <div style={S.sectionTitle}>Dados Pessoais</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>Nome</div>
            <input
              style={S.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>E-mail</div>
            <input
              style={S.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>

          {profileError && <div style={feedbackStyle("error")}><span>⚠️</span><span>{profileError}</span></div>}
          {profileSuccess && <div style={feedbackStyle("success")}><span>✅</span><span>{profileSuccess}</span></div>}

          <button
            style={{ ...S.btn("primary"), alignSelf: "flex-end" as const }}
            onClick={handleUpdateProfile}
            disabled={profileLoading}
          >
            {profileLoading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>

      {/* Alterar senha */}
      <div style={S.card}>
        <div style={S.sectionTitle}>Alterar Senha</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>Senha atual</div>
            <input
              style={S.input}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite sua senha atual"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>Nova senha</div>
            <input
              style={S.input}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>Confirmar nova senha</div>
            <input
              style={S.input}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              onKeyDown={(e) => { if (e.key === "Enter") handleUpdatePassword(); }}
            />
          </div>

          {passwordError && <div style={feedbackStyle("error")}><span>⚠️</span><span>{passwordError}</span></div>}
          {passwordSuccess && <div style={feedbackStyle("success")}><span>✅</span><span>{passwordSuccess}</span></div>}

          <button
            style={{ ...S.btn("primary"), alignSelf: "flex-end" as const }}
            onClick={handleUpdatePassword}
            disabled={passwordLoading}
          >
            {passwordLoading ? "Alterando..." : "Alterar Senha"}
          </button>
        </div>
      </div>

    </div>
  );
}