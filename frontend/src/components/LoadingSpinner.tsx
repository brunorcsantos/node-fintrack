// src/components/LoadingSpinner.tsx
interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = "Carregando..." }: LoadingSpinnerProps) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 80,
      gap: 16,
    }}>
      <div style={{
        width: 36,
        height: 36,
        border: "3px solid #ffffff14",
        borderTop: "3px solid #5A8FE8",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <span style={{ color: "#666", fontSize: 13 }}>{message}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}