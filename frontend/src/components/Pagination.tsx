// src/components/Pagination.tsx

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Gera lista de páginas com reticências
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  const btnStyle = (active: boolean, disabled?: boolean) => ({
    minWidth: 36, height: 36,
    borderRadius: "var(--radius-md)",
    border: "1px solid",
    borderColor: active ? "var(--accent-blue)" : "var(--border-default)",
    background: active ? "var(--accent-blue)" : "transparent",
    color: active ? "#ffffff" : disabled ? "var(--text-muted)" : "var(--text-secondary)",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 13, fontWeight: 600,
    opacity: disabled ? 0.4 : 1,
    transition: "all 0.15s",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "0 10px",
  });

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap" as const,
      gap: 12,
      marginTop: 16,
      paddingTop: 16,
      borderTop: "1px solid var(--border-subtle)",
    }}>

      {/* Info */}
      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
        Mostrando <strong style={{ color: "var(--text-primary)" }}>{from}–{to}</strong> de <strong style={{ color: "var(--text-primary)" }}>{total}</strong> registros
      </span>

      {/* Botões */}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {/* Anterior */}
        <button
          style={btnStyle(false, page === 1)}
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          title="Página anterior"
        >
          ‹
        </button>

        {/* Páginas */}
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} style={{ color: "var(--text-muted)", padding: "0 4px", fontSize: 13 }}>
              ···
            </span>
          ) : (
            <button
              key={p}
              style={btnStyle(p === page)}
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </button>
          )
        )}

        {/* Próxima */}
        <button
          style={btnStyle(false, page === totalPages)}
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          title="Próxima página"
        >
          ›
        </button>
      </div>

    </div>
  );
}