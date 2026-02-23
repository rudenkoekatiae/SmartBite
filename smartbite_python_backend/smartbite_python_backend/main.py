from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json
from pathlib import Path

from meal_engine import calc_daily_calories, solve_week, PRODUCTS, RECIPES

app = FastAPI(title="SmartBite API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/make-server-fd5d4174"


# --- Schemas ---

class CaloriesRequest(BaseModel):
    sex: str
    age: int
    height_cm: float
    weight_kg: float
    goal: str


class PlanRequest(BaseModel):
    week_budget_uah: float
    daily_cal_target: float
    meals_per_day: int = 3
    skip_meal: Optional[str] = None
    days: int = 7
    max_repeat: int = 2
    budget_step: float = 5
    cal_step: float = 50


# --- Routes ---

@app.get(f"{PREFIX}/health")
def health():
    return {"status": "ok"}


@app.post(f"{PREFIX}/calculate-calories")
def calculate_calories(body: CaloriesRequest):
    daily_calories = calc_daily_calories(
        body.sex, body.age, body.height_cm, body.weight_kg, body.goal
    )
    return {
        "daily_calories": daily_calories,
        "sex": body.sex,
        "age": body.age,
        "height_cm": body.height_cm,
        "weight_kg": body.weight_kg,
        "goal": body.goal,
    }


@app.post(f"{PREFIX}/generate-plan")
def generate_plan(body: PlanRequest):
    result = solve_week(
        week_budget_uah=body.week_budget_uah,
        daily_cal_target=body.daily_cal_target,
        meals_per_day=body.meals_per_day,
        skip_meal=body.skip_meal,
        days=body.days,
        max_repeat=body.max_repeat,
        budget_step=body.budget_step,
        cal_step=body.cal_step,
    )

    if result.get("status") != "ok":
        raise HTTPException(status_code=400, detail=result.get("reason", "Unknown error"))

    return result


@app.get(f"{PREFIX}/products")
def get_products():
    return {"products": PRODUCTS}


@app.get(f"{PREFIX}/recipes")
def get_recipes():
    return {"recipes": RECIPES}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
