import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { solveWeek, calcDailyCalories } from "./meal_engine.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-fd5d4174/health", (c) => {
  return c.json({ status: "ok" });
});

// Calculate daily calorie target
app.post("/make-server-fd5d4174/calculate-calories", async (c) => {
  try {
    const body = await c.req.json();
    const { sex, age, height_cm, weight_kg, goal } = body;

    if (!sex || !age || !height_cm || !weight_kg || !goal) {
      return c.json(
        { error: "Missing required parameters: sex, age, height_cm, weight_kg, goal" },
        400
      );
    }

    const dailyCalories = calcDailyCalories(sex, age, height_cm, weight_kg, goal);

    return c.json({
      daily_calories: dailyCalories,
      sex,
      age,
      height_cm,
      weight_kg,
      goal,
    });
  } catch (error) {
    console.log("Error calculating calories:", error);
    return c.json({ error: `Failed to calculate calories: ${error.message}` }, 500);
  }
});

// Generate weekly meal plan
app.post("/make-server-fd5d4174/generate-plan", async (c) => {
  try {
    const body = await c.req.json();
    const {
      week_budget_uah,
      daily_cal_target,
      meals_per_day = 3,
      skip_meal = null,
      days = 7,
      max_repeat = 2,
      budget_step = 5,
      cal_step = 50,
    } = body;

    if (!week_budget_uah || !daily_cal_target) {
      return c.json(
        { error: "Missing required parameters: week_budget_uah, daily_cal_target" },
        400
      );
    }

    const result = solveWeek({
      weekBudgetUah: week_budget_uah,
      dailyCalTarget: daily_cal_target,
      mealsPerDay: meals_per_day,
      skipMeal: skip_meal,
      days,
      maxRepeat: max_repeat,
      budgetStep: budget_step,
      calStep: cal_step,
    });

    if (result.status !== "ok") {
      return c.json({ error: result.reason }, 400);
    }

    return c.json(result);
  } catch (error) {
    console.log("Error generating meal plan:", error);
    return c.json({ error: `Failed to generate meal plan: ${error.message}` }, 500);
  }
});

// Get all available products
app.get("/make-server-fd5d4174/products", async (c) => {
  try {
    const productsData = await import("./products.json", { with: { type: "json" } });
    return c.json({ products: productsData.default });
  } catch (error) {
    console.log("Error fetching products:", error);
    return c.json({ error: `Failed to fetch products: ${error.message}` }, 500);
  }
});

// Get all available recipes
app.get("/make-server-fd5d4174/recipes", async (c) => {
  try {
    const recipesData = await import("./recipes.json", { with: { type: "json" } });
    return c.json({ recipes: recipesData.default });
  } catch (error) {
    console.log("Error fetching recipes:", error);
    return c.json({ error: `Failed to fetch recipes: ${error.message}` }, 500);
  }
});

Deno.serve(app.fetch);