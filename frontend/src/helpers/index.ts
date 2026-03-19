// src/helpers/index.ts

export const fmt = (v: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export const fmtDate = (d: string | Date): string => {
  const date = typeof d === "string" ? new Date(d + (d.length === 10 ? "T12:00:00" : "")) : d;
  return date.toLocaleDateString("pt-BR");
};

export const genId = (): string =>
  Math.random().toString(36).slice(2);

export const getMonthKey = (date: string): string =>
  date.slice(0, 7);