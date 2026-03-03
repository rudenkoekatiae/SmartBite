# SmartBite Backend Architecture

This document describes the backend implementation for the SmartBite meal planning app.

## Overview

The backend is implemented as a Supabase Edge Function using Deno and Hono, with a sophisticated Dynamic Programming (DP) meal planning algorithm ported from Python.

## Architecture

```
Frontend (React/TypeScript)
    ↓
API Service Layer (/src/app/services/meal-api.ts)
    ↓
Supabase Edge Function (/supabase/functions/server/)
    ├── index.tsx (Hono server & routes)
    ├── meal_engine.tsx (DP solver & meal planning logic)
    ├── products.json (Ukrainian grocery data: ATB & Silpo)
    └── recipes.json (Recipe database with ingredients)
```

## API Endpoints

### 1. Health Check
**GET** `/make-server-fd5d4174/health`
- Returns: `{ status: "ok" }`

### 2. Calculate Daily Calories
**POST** `/make-server-fd5d4174/calculate-calories`

Request body:
```json
{
  "sex": "m" | "f",
  "age": 25,
  "height_cm": 180,
  "weight_kg": 75,
  "goal": "lose" | "maintain" | "gain"
}
```

Response:
```json
{
  "daily_calories": 2000,
  "sex": "m",
  "age": 25,
  "height_cm": 180,
  "weight_kg": 75,
  "goal": "maintain"
}
```

### 3. Generate Meal Plan
**POST** `/make-server-fd5d4174/generate-plan`

Request body:
```json
{
  "week_budget_uah": 1500,
  "daily_cal_target": 2000,
  "meals_per_day": 3,
  "skip_meal": null,
  "days": 7,
  "max_repeat": 2,
  "budget_step": 5,
  "cal_step": 50
}
```

Response:
```json
{
  "status": "ok",
  "daily_cal_target": 2000,
  "week_budget_uah": 1500,
  "meals_per_day": 3,
  "day_slots": ["breakfast", "lunch", "dinner"],
  "max_repeat_used": 2,
  "weekly_totals_servings_est": {
    "cost_est_servings": 1234.56,
    "cal": 14000,
    "pro": 490,
    "fat": 350,
    "carb": 1400
  },
  "shopping_total_uah_est": 1450.00,
  "week_plan": [
    [ /* Day 1 meals */ ],
    [ /* Day 2 meals */ ],
    // ... 7 days total
  ],
  "shopping_list": [
    {
      "ingredient": "chicken",
      "grams_needed": 1120.0,
      "uses_in_week": 7,
      "cost_uah_est": 190.29
    }
    // ... more ingredients
  ]
}
```

### 4. Get Products
**GET** `/make-server-fd5d4174/products`
- Returns: All available products from Ukrainian stores

### 5. Get Recipes
**GET** `/make-server-fd5d4174/recipes`
- Returns: All available recipes with ingredients

## Data Models

### Product
```typescript
{
  key: string;           // Ingredient key (e.g., "chicken")
  name: string;          // Product name with size
  price: number;         // Price in UAH
  maker: string;         // Brand name
  shop: "atb" | "silpo"; // Store name
  calories: number;      // per 100g
  proteins: number;      // per 100g
  fats: number;          // per 100g
  carbs: number;         // per 100g
  amount_g: number;      // Package size in grams
}
```

### Recipe
```typescript
{
  name: string;            // Recipe display name
  type: string;            // "breakfast" | "lunch" | "dinner" | "snack"
  ingredients: string[];   // Array of ingredient keys
}
```

### Meal Item (in plan)
```typescript
{
  name: string;
  type: string;
  ingredients: string[];
  cost: number;    // Estimated cost in UAH
  cal: number;     // Calories
  pro: number;     // Protein in grams
  fat: number;     // Fat in grams
  carb: number;    // Carbs in grams
}
```

## Algorithm: Dynamic Programming Meal Solver

The core of the backend is the DP algorithm that optimizes meal selection:

### Objective Function
Maximizes a score that prioritizes:
1. **Meeting calorie targets** (>= target) - Weight: 1,000,000
2. **Minimizing calorie deficit** - Weight: -12 per kcal under target
3. **Budget efficiency** - Weight: -0.03 per UAH spent
4. **Variety penalty** - Weight: -60 for repeat meals beyond first use

### Constraints
- Weekly budget (UAH)
- Daily calorie target
- Maximum 2 repeats per recipe per week
- Balanced meal types (breakfast, lunch, dinner, snack)

### Portion Sizes (Standard)
```typescript
{
  oats: 60g, milk: 250ml, chicken: 160g, rice: 80g,
  eggs: 100g (2 eggs), bread: 70g, vegetables: 100-150g,
  fruits: 150g, oil: 10ml
}
```

### Fallback Logic
If a meal type has insufficient recipes:
- dinner ↔ lunch (interchangeable)
- breakfast ↔ snack (interchangeable)
- Otherwise: use all available recipes

## Frontend Integration

The frontend uses the API service layer located at `/src/app/services/meal-api.ts`:

```typescript
import { mealApi } from './services/meal-api';

// Calculate calories
const result = await mealApi.calculateCalories({
  sex: 'm', age: 25, height_cm: 180, 
  weight_kg: 75, goal: 'maintain'
});

// Generate plan
const plan = await mealApi.generatePlan({
  week_budget_uah: 1500,
  daily_cal_target: 2000,
  meals_per_day: 3
});
```

## Notes

- All prices are in Ukrainian Hryvnia (UAH)
- Nutritional data is per 100g for raw ingredients
- The algorithm uses averaged prices across stores for optimization
- Shopping list provides estimated costs and quantities needed
