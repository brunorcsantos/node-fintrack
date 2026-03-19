// src/views/Auth.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function Auth() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) { setError("Preencha todos os campos obrigatórios."); return; }
    if (mode === "register" && !name) { setError("Informe seu nome."); return; }
    if (password.length < 6) { setError("A senha deve ter no mínimo 6 caracteres."); return; }

    setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "var(--radius-md)",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    color: "var(--text-primary)",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-base)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: isMobile ? 16 : 24,
      fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
    }}>

      <div style={{
        width: "100%",
        maxWidth: 420,
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64,
            borderRadius: "var(--radius-xl)",
            background: "var(--accent-blue)22",
            border: "2px solid var(--accent-blue)44",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, margin: "0 auto 16px",
          }}>
            💰
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em", margin: 0,
          }}>
            FinTrack
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 6 }}>
            Controle financeiro pessoal
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-subtle)",
          padding: isMobile ? 24 : 36,
          boxShadow: "var(--shadow-md)",
        }}>

          {/* Toggle Login / Registro */}
          <div style={{
            display: "flex",
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius-md)",
            padding: 4,
            marginBottom: 28,
          }}>
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1, padding: "9px",
                  borderRadius: "var(--radius-sm)",
                  border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 700,
                  background: mode === m ? "var(--bg-surface)" : "transparent",
                  color: mode === m ? "var(--text-primary)" : "var(--text-muted)",
                  boxShadow: mode === m ? "var(--shadow-sm)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          {/* Campos */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && (
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>
                  Nome completo *
                </div>
                <input
                  style={inputStyle}
                  placeholder="João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </div>
            )}

            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>
                E-mail *
              </div>
              <input
                style={inputStyle}
                type="email"
                placeholder="joao@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus={mode === "login"}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>
                Senha *
              </div>
              <input
                style={inputStyle}
                type="password"
                placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Erro */}
            {error && (
              <div style={{
                background: "var(--accent-red)15",
                border: "1px solid var(--accent-red)44",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                fontSize: 13,
                color: "var(--accent-red)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Botão */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "var(--radius-md)",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
                background: "var(--accent-blue)",
                color: "#ffffff",
                opacity: loading ? 0.7 : 1,
                transition: "all 0.15s",
                boxShadow: "var(--shadow-sm)",
                marginTop: 4,
              }}
            >
              {loading
                ? "Aguarde..."
                : mode === "login" ? "Entrar" : "Criar conta"
              }
            </button>
          </div>
        </div>

        {/* Rodapé */}
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 24 }}>
          {mode === "login"
            ? "Não tem uma conta? "
            : "Já tem uma conta? "
          }
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            style={{
              background: "none", border: "none",
              color: "var(--accent-blue)", cursor: "pointer",
              fontSize: 12, fontWeight: 700, padding: 0,
            }}
          >
            {mode === "login" ? "Criar conta" : "Entrar"}
          </button>
        </p>

      </div>
    </div>
  );
}