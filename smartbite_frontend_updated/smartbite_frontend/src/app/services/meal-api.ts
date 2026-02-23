// API service for backend meal planning
const BASE_URL = `http://localhost:8000/make-server-fd5d4174`;

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
  max_repeat?: number;
  budget_step?: number;
  cal_step?: number;
}

export interface MealItem {
  name: string;
  type: string;
  ingredients: string[];
  cost: number;
  cal: number;
  pro: number;
  fat: number;
  carb: number;
}

export interface WeekPlanResult {
  status: string;
  daily_cal_target: number;
  week_budget_uah: number;
  meals_per_day: number;
  day_slots: string[];
  max_repeat_used: number;
  weekly_totals_servings_est: {
    cost_est_servings: number;
    cal: number;
    pro: number;
    fat: number;
    carb: number;
  };
  shopping_total_uah_est: number;
  week_plan: MealItem[][];
  shopping_list: Array<{
    ingredient: string;
    grams_needed: number;
    uses_in_week: number;
    cost_uah_est: number;
  }>;
}

async function apiCall(endpoint: string, method: string = 'GET', body?: any) {
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      console.error(`API error at ${endpoint}:`, data);
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

export const mealApi = {
  async calculateCalories(params: CalcCaloriesParams) {
    return apiCall('/calculate-calories', 'POST', params);
  },

  async generatePlan(params: GeneratePlanParams): Promise<WeekPlanResult> {
    return apiCall('/generate-plan', 'POST', params);
  },

  async getProducts() {
    return apiCall('/products', 'GET');
  },

  async getRecipes() {
    return apiCall('/recipes', 'GET');
  },

  async healthCheck() {
    return apiCall('/health', 'GET');
  },
};
