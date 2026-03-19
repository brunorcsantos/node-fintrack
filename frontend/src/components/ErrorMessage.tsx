// src/components/ErrorMessage.tsx
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 80,
      gap: 16,
    }}>
      <span style={{ fontSize: 32 }}>⚠️</span>
      <span style={{ color: "#E85A7A", fontSize: 14, textAlign: "center" as const }}>
        {message}
      </span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: "1px solid #ffffff14",
            background: "#ffffff11",
            color: "#ccc",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}