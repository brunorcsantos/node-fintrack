// src/constants/transactions.ts
import type { Transaction } from "../types";

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  // Março 2026
  { id: "1",  description: "Aluguel Março",           amount: 2000, categoryId: "moradia",     subcategoryId: "aluguel",       date: "2026-03-01", type: "expense" },
  { id: "2",  description: "Conta de Energia",         amount: 185,  categoryId: "moradia",     subcategoryId: "energia",       date: "2026-03-05", type: "expense" },
  { id: "3",  description: "Supermercado Pão de Açúcar", amount: 420, categoryId: "alimentacao", subcategoryId: "supermercado",  date: "2026-03-03", type: "expense" },
  { id: "4",  description: "iFood - Jantar",           amount: 87,   categoryId: "alimentacao", subcategoryId: "ifood",         date: "2026-03-04", type: "expense" },
  { id: "5",  description: "Combustível Shell",        amount: 280,  categoryId: "transporte",  subcategoryId: "combustivel",   date: "2026-03-02", type: "expense" },
  { id: "6",  description: "Plano de Saúde",           amount: 290,  categoryId: "saude",       subcategoryId: "plano_saude",   date: "2026-03-01", type: "expense" },
  { id: "7",  description: "Netflix + Spotify",        amount: 75,   categoryId: "lazer",       subcategoryId: "streaming",     date: "2026-03-01", type: "expense" },
  { id: "8",  description: "Fatura Nubank",            amount: 1200, categoryId: "cartao",      subcategoryId: "fatura",        date: "2026-03-10", type: "expense" },
  { id: "9",  description: "Salário",                  amount: 8500, categoryId: "receita",     subcategoryId: "salario",       date: "2026-03-05", type: "income"  },
  { id: "10", description: "Restaurante Dom",          amount: 180,  categoryId: "alimentacao", subcategoryId: "restaurante",   date: "2026-03-07", type: "expense" },
  { id: "11", description: "Academia",                 amount: 90,   categoryId: "saude",       subcategoryId: "academia",      date: "2026-03-01", type: "expense" },
  { id: "12", description: "Uber - trabalho",          amount: 45,   categoryId: "transporte",  subcategoryId: "uber",          date: "2026-03-06", type: "expense" },
  { id: "13", description: "Cinema com a família",     amount: 120,  categoryId: "lazer",       subcategoryId: "cinema",        date: "2026-03-08", type: "expense" },
  { id: "14", description: "Freelance design",         amount: 1200, categoryId: "receita",     subcategoryId: "freelance",     date: "2026-03-10", type: "income"  },
  { id: "15", description: "Padaria do bairro",        amount: 55,   categoryId: "alimentacao", subcategoryId: "padaria",       date: "2026-03-09", type: "expense" },
  // Fevereiro 2026
  { id: "16", description: "Aluguel Fevereiro",        amount: 2000, categoryId: "moradia",     subcategoryId: "aluguel",       date: "2026-02-01", type: "expense" },
  { id: "17", description: "Salário Fevereiro",        amount: 8500, categoryId: "receita",     subcategoryId: "salario",       date: "2026-02-05", type: "income"  },
  { id: "18", description: "Supermercado",             amount: 510,  categoryId: "alimentacao", subcategoryId: "supermercado",  date: "2026-02-10", type: "expense" },
  { id: "19", description: "Combustível",              amount: 310,  categoryId: "transporte",  subcategoryId: "combustivel",   date: "2026-02-15", type: "expense" },
  { id: "20", description: "Conta energia",            amount: 210,  categoryId: "moradia",     subcategoryId: "energia",       date: "2026-02-05", type: "expense" },
];