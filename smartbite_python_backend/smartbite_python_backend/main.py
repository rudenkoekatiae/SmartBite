"""
SmartBite API v2
FastAPI backend із валідацією вхідних даних.
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator, model_validator
from typing import Optional

from meal_engine import calc_daily_calories, solve_week, INGREDIENT_GRAPH


PREFIX = os.getenv("API_PREFIX", "/make-server-fd5d4174")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app = FastAPI(title="SmartBite API v2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CaloriesRequest(BaseModel):
    sex: str
    age: int
    height_cm: float
    weight_kg: float
    goal: str

    @field_validator("sex")
    @classmethod
    def validate_sex(cls, v: str) -> str:
        if v.lower() not in ("m", "f"):
            raise ValueError("sex must be 'm' or 'f'")
        return v.lower()

    @field_validator("age")
    @classmethod
    def validate_age(cls, v: int) -> int:
        if not (10 <= v <= 120):
            raise ValueError("age must be between 10 and 120")
        return v

    @field_validator("height_cm")
    @classmethod
    def validate_height(cls, v: float) -> float:
        if not (100.0 <= v <= 250.0):
            raise ValueError("height_cm must be between 100 and 250")
        return v

    @field_validator("weight_kg")
    @classmethod
    def validate_weight(cls, v: float) -> float:
        if not (30.0 <= v <= 300.0):
            raise ValueError("weight_kg must be between 30 and 300")
        return v

    @field_validator("goal")
    @classmethod
    def validate_goal(cls, v: str) -> str:
        allowed = ("cut", "bulk", "maintain", "схуднення", "масонабір", "підтримка", "lose", "gain", "loss")
        if v.lower().strip() not in allowed:
            raise ValueError(f"goal must be one of: {allowed}")
        return v


class PlanRequest(BaseModel):
    week_budget_uah: float
    daily_cal_target: float
    meals_per_day: int = 3
    skip_meal: Optional[str] = None
    days: int = 7
    cal_tolerance: float = 150.0
    seed: Optional[int] = None

    @field_validator("week_budget_uah")
    @classmethod
    def validate_budget(cls, v: float) -> float:
        if v < 50:
            raise ValueError("week_budget_uah must be at least 50 UAH")
        if v > 50_000:
            raise ValueError("week_budget_uah seems unrealistically high (max 50000)")
        return v

    @field_validator("daily_cal_target")
    @classmethod
    def validate_calories(cls, v: float) -> float:
        if not (500 <= v <= 8000):
            raise ValueError("daily_cal_target must be between 500 and 8000 kcal")
        return v

    @field_validator("meals_per_day")
    @classmethod
    def validate_meals(cls, v: int) -> int:
        if v not in (2, 3, 4, 5):
            raise ValueError("meals_per_day must be 2, 3, 4 or 5")
        return v

    @field_validator("days")
    @classmethod
    def validate_days(cls, v: int) -> int:
        if not (1 <= v <= 14):
            raise ValueError("days must be between 1 and 14")
        return v

    @field_validator("skip_meal")
    @classmethod
    def validate_skip_meal(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ("breakfast", "lunch", "dinner"):
            raise ValueError("skip_meal must be 'breakfast', 'lunch' or 'dinner'")
        return v




@app.get(f"{PREFIX}/health")
def health():
    return {"status": "ok", "version": "2.0"}


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
        cal_tolerance=body.cal_tolerance,
        seed=body.seed,
    )

    if result.get("status") != "ok":
        raise HTTPException(status_code=400, detail=result.get("reason", "Unknown error"))

    return result


@app.get(f"{PREFIX}/ingredients")
def get_ingredients():
    """Повертає граф продуктів (замість recipes + products окремо)."""
    return {"ingredients": INGREDIENT_GRAPH}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)