# SmartBite — Python Backend

FastAPI-порт оригінального TypeScript/Deno бекенду.

## Структура

```
smartbite_python_backend/
├── main.py           # FastAPI сервер та роути
├── meal_engine.py    # DP-алгоритм планування їжі
├── products.json     # База продуктів (ATB, Silpo)
├── recipes.json      # База рецептів
└── requirements.txt  # Залежності
```

## Запуск

```bash
# Встановити залежності
pip install -r requirements.txt

# Запустити сервер (з hot-reload)
python main.py

# Або через uvicorn напряму
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Сервер запуститься на `http://localhost:8000`.

Інтерактивна документація API: `http://localhost:8000/docs`

## API Ендпоінти

Всі ендпоінти сумісні з оригінальним TypeScript бекендом — префікс і формати запитів/відповідей збережені.

### GET `/make-server-fd5d4174/health`
Перевірка стану сервера.

### POST `/make-server-fd5d4174/calculate-calories`
Розрахунок денної норми калорій.

```json
{
  "sex": "m",
  "age": 25,
  "height_cm": 180,
  "weight_kg": 75,
  "goal": "maintain"
}
```

### POST `/make-server-fd5d4174/generate-plan`
Генерація тижневого плану харчування.

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

### GET `/make-server-fd5d4174/products`
Список усіх продуктів.

### GET `/make-server-fd5d4174/recipes`
Список усіх рецептів.

## Фронтенд

Фронтенд не змінювався. Якщо запускаєш локально, переконайся, що `BASE_URL` у `/src/app/services/meal-api.ts` вказує на `http://localhost:8000`.
