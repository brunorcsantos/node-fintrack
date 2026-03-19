// src/constants/categories.ts
import type { Category } from "../types";

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: "moradia",
    name: "Moradia",
    icon: "🏠",
    color: "#E8845A",
    budget: 3000,
    subcategories: [
      { id: "aluguel", name: "Aluguel", icon: "🔑", budget: 2000 },
      { id: "energia", name: "Energia", icon: "⚡", budget: 200 },
      { id: "agua", name: "Água", icon: "💧", budget: 100 },
      { id: "internet", name: "Internet/TV", icon: "📡", budget: 200 },
      { id: "condominio", name: "Condomínio", icon: "🏢", budget: 500 },
    ],
  },
  {
    id: "alimentacao",
    name: "Alimentação",
    icon: "🍽️",
    color: "#5AB88A",
    budget: 1500,
    subcategories: [
      { id: "supermercado", name: "Supermercado", icon: "🛒", budget: 800 },
      { id: "restaurante", name: "Restaurante", icon: "🍜", budget: 400 },
      { id: "ifood", name: "Delivery", icon: "🛵", budget: 200 },
      { id: "padaria", name: "Padaria/Café", icon: "☕", budget: 100 },
    ],
  },
  {
    id: "transporte",
    name: "Transporte",
    icon: "🚗",
    color: "#5A8FE8",
    budget: 800,
    subcategories: [
      { id: "combustivel", name: "Combustível", icon: "⛽", budget: 300 },
      { id: "uber", name: "Uber/99", icon: "🚕", budget: 200 },
      { id: "manutencao", name: "Manutenção", icon: "🔧", budget: 150 },
      { id: "transporte_pub", name: "Transporte Público", icon: "🚌", budget: 150 },
    ],
  },
  {
    id: "saude",
    name: "Saúde",
    icon: "❤️",
    color: "#E85A7A",
    budget: 600,
    subcategories: [
      { id: "plano_saude", name: "Plano de Saúde", icon: "🏥", budget: 300 },
      { id: "medicamentos", name: "Medicamentos", icon: "💊", budget: 100 },
      { id: "consultas", name: "Consultas", icon: "👨‍⚕️", budget: 150 },
      { id: "academia", name: "Academia/Esportes", icon: "💪", budget: 100 },
    ],
  },
  {
    id: "lazer",
    name: "Lazer & Entretenimento",
    icon: "🎭",
    color: "#A85AE8",
    budget: 500,
    subcategories: [
      { id: "streaming", name: "Streaming", icon: "📺", budget: 100 },
      { id: "cinema", name: "Cinema/Shows", icon: "🎬", budget: 150 },
      { id: "viagem", name: "Viagens", icon: "✈️", budget: 150 },
      { id: "hobbies", name: "Hobbies", icon: "🎮", budget: 100 },
    ],
  },
  {
    id: "cartao",
    name: "Cartão de Crédito",
    icon: "💳",
    color: "#E8C45A",
    budget: 2000,
    subcategories: [
      { id: "fatura", name: "Fatura Mensal", icon: "📄", budget: 1500 },
      { id: "parcelas", name: "Parcelas", icon: "🔄", budget: 500 },
    ],
  },
  {
    id: "receita",
    name: "Receita",
    icon: "💰",
    color: "#4CAF50",
    subcategories: [
      { id: "salario", name: "Salário", icon: "💼" },
      { id: "freelance", name: "Freelance", icon: "💻" },
      { id: "investimentos", name: "Investimentos", icon: "📈" },
      { id: "outros_rec", name: "Outros", icon: "➕" },
    ],
  },
];