// src/lib/api.ts

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Subcategory {
  id: string;
  slug: string;
  name: string;
  icon: string;
  categoryId: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
  subcategories: Subcategory[];
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  notes?: string;
  categoryId: string;
  subcategoryId?: string;
  category: Category;
  subcategory?: Subcategory;
}

export interface Budget {
  id: string;
  amount: number;
  month: string;
  categoryId?: string;
  subcategoryId?: string;
  category?: Category;
  subcategory?: Subcategory;
}

export interface Recurring {
  id: string;
  description: string;
  amount?: number;
  type: "income" | "expense";
  frequency: "monthly" | "yearly";
  dayOfMonth: number;
  startDate: string;
  endDate?: string;
  active: boolean;
  lastCreatedAt?: string;
  mode: "indefinite" | "installments";
  installments?: number;
  categoryId: string;
  subcategoryId?: string;
  category: Category;
  subcategory?: Subcategory;
}

export type RecurringInput = {
  description: string;
  amount?: number;
  type: "income" | "expense";
  categoryId: string;
  subcategoryId?: string;
  frequency: "monthly" | "yearly";
  dayOfMonth: number;
  startDate: string;
  endDate?: string;
  mode: "indefinite" | "installments";
  installments?: number;
};

export interface TransactionList {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export interface Summary {
  byCategory: { categoryId: string; type: string; _sum: { amount: number } }[];
  totals: { type: string; _sum: { amount: number } }[];
  monthly: { month: string; type: string; total: number }[];
}

// ── HTTP client ───────────────────────────────────────────────────────────────
class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem("fintrack_token", token);
    else localStorage.removeItem("fintrack_token");
  }

  loadToken() {
    this.token = localStorage.getItem("fintrack_token");
    return this.token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (res.status === 401) {
      this.setToken(null);
      // Só redireciona para login se não for a verificação inicial do token
      if (path !== "/auth/me") {
        window.dispatchEvent(new Event("auth:logout"));
      }
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json();
  }

  // Auth
  async register(data: { name: string; email: string; password: string }) {
    return this.request<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async me() {
    return this.request<User>("/auth/me");
  }

  // Profile
  async updateProfile(data: Partial<{ name: string; email: string }>) {
    return this.request<User>("/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updatePassword(data: { currentPassword: string; newPassword: string }) {
    return this.request<{ message: string }>("/profile/password", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Categories
  async getCategories() {
    return this.request<Category[]>("/categories");
  }

  async createCategory(data: {
    slug: string;
    name: string;
    icon: string;
    color: string;
  }) {
    return this.request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCategory(
    id: string,
    data: Partial<{ name: string; icon: string; color: string }>,
  ) {
    return this.request<Category>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string) {
    return this.request<void>(`/categories/${id}`, { method: "DELETE" });
  }

  async createSubcategory(
    categoryId: string,
    data: { slug: string; name: string; icon: string },
  ) {
    return this.request<Subcategory>(
      `/categories/${categoryId}/subcategories`,
      { method: "POST", body: JSON.stringify(data) },
    );
  }

  async updateSubcategory(
    categoryId: string,
    subId: string,
    data: Partial<{ name: string; icon: string }>,
  ) {
    return this.request<Subcategory>(
      `/categories/${categoryId}/subcategories/${subId}`,
      { method: "PUT", body: JSON.stringify(data) },
    );
  }

  async deleteSubcategory(categoryId: string, subId: string) {
    return this.request<void>(
      `/categories/${categoryId}/subcategories/${subId}`,
      { method: "DELETE" },
    );
  }

  // Transactions
  async getTransactions(params: {
    month?: string;
    categoryId?: string;
    type?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v)
        .map(([k, v]) => [k, String(v)]),
    );
    const res = await this.request<TransactionList>(`/transactions?${qs}`);
    res.data = res.data.map((tx) => ({
      ...tx,
      date: (tx.date as string).slice(0, 10),
    }));
    return res;
  }

  async createTransaction(
    data: Omit<Transaction, "id" | "category" | "subcategory">,
  ) {
    const tx = await this.request<Transaction>("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return {
      ...tx,
      date: (tx.date as string).slice(0, 10),
    };
  }

  async updateTransaction(
    id: string,
    data: Partial<Omit<Transaction, "id" | "category" | "subcategory">>,
  ) {
    return this.request<Transaction>(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id: string) {
    return this.request<void>(`/transactions/${id}`, { method: "DELETE" });
  }

  async getSummary(month?: string) {
    const qs = month ? `?month=${month}` : "";
    return this.request<Summary>(`/transactions/summary${qs}`);
  }

  // Budgets
  async getBudgets(month?: string) {
    const qs = month ? `?month=${month}` : "";
    return this.request<Budget[]>(`/budgets${qs}`);
  }

  async upsertBudget(data: {
    amount: number;
    month: string;
    categoryId?: string;
    subcategoryId?: string;
  }) {
    return this.request<Budget>("/budgets", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteBudget(id: string) {
    return this.request<void>(`/budgets/${id}`, { method: "DELETE" });
  }

  // Recurring
  async getRecurring() {
    return this.request<Recurring[]>("/recurring");
  }

  async getPendingRecurring() {
    return this.request<Recurring[]>("/recurring/pending");
  }

  async createRecurring(data: RecurringInput) {
    return this.request<Recurring>("/recurring", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateRecurring(id: string, data: Partial<RecurringInput>) {
    return this.request<Recurring>(`/recurring/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteRecurring(id: string) {
    return this.request<void>(`/recurring/${id}`, { method: "DELETE" });
  }

  async confirmRecurring(
    id: string,
    data?: { amount?: number; date?: string },
  ) {
    return this.request<Transaction>(`/recurring/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    });
  }
}

export const api = new ApiClient();
