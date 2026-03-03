// API service for SmartBite Python backend
// BASE_URL читається з .env (VITE_API_URL) або fallback на localhost
const BASE_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8000/make-server-fd5d4174';

interface CalcCaloriesParams {
  sex: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  goal: string;
}

interface GeneratePlanParams {
  week_budget_uah: number;
  daily_cal_target: number;
  meals_per_day?: number;
  skip_meal?: string | null;
  days?: number;
  cal_tolerance?: number;
  seed?: number | null;
  diet?: string;
}

export interface MealItem {
  name: string;
  type: string;
  slot: string;
  day: number;
  ingredients: string[];
  compat_score: number;
  cal: number;
  pro: number;
  fat: number;
  carb: number;
  cost: number;
}

export interface DayPlan {
  day: number;
  meals: MealItem[];
  day_cal: number;
  day_cost: number;
  cal_ok: boolean;
}

export interface ShoppingItem {
  ingredient: string;
  name_ua: string;
  grams_needed: number;
  uses_in_week: number;
  cost_uah_est: number;
}

export interface WeekPlanResult {
  status: string;
  daily_cal_target: number;
  cal_tolerance: number;
  week_budget_uah: number;
  meals_per_day: number;
  day_slots: string[];
  days: number;
  weekly_totals: {
    cost_est: number;
    cal: number;
    pro: number;
    fat: number;
    carb: number;
  };
  shopping_total_uah_est: number;
  week_plan: DayPlan[];
  shopping_list: ShoppingItem[];
  warning?: string;
}

async function apiCall(endpoint: string, method: string = 'GET', body?: unknown) {
  const url = `${BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail ?? data.error ?? `HTTP ${response.status}`);
  }
  return data;
}

export const mealApi = {
  async calculateCalories(params: CalcCaloriesParams) {
    return apiCall('/calculate-calories', 'POST', params);
  },

  async generatePlan(params: GeneratePlanParams): Promise<WeekPlanResult> {
    return apiCall('/generate-plan', 'POST', params);
  },

  async getIngredients() {
    return apiCall('/ingredients', 'GET');
  },

  async healthCheck() {
    return apiCall('/health', 'GET');
  },
};
