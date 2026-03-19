// src/types/index.ts

export type CategoryId = string;

export type View = "dashboard" | "transactions" | "budgets" | "reports" | "setup";

export interface Subcategory {
  id: string;
  name: string;
  icon: string;
  budget?: number;
}

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
  color: string;
  budget?: number;
  subcategories: Subcategory[];
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  categoryId: CategoryId;
  subcategoryId?: string;
  date: string;
  type: "expense" | "income";
  notes?: string;
}