# Рекомендательная система (LightFM) — архитектура и план

Бесплатная, без OpenAI/Claude/платных сервисов и без LLM в принятии решений.
Стек: **Python + LightFM + PostgreSQL** поверх текущего NestJS/Prisma.

Цель: показывать «**Вероятность, что вам понравится**» (0–100%) и рекомендации,
чтобы росло число оценок/отзывов за счёт ощущения «приложение понимает мой вкус».

---

## 0. Фазовый план (без поломки приложения)

- **Фаза 1 — СЕЙЧАС (внедрено).** Таблица `interactions` (сбор сигналов) + логирование
  (RATE на сервере, OPEN/VIEW/SAVE с клиента) + **cold-start вероятность** в
  `RecsysService.likeProbability` (прозрачная, без модели). UX уже работает:
  бейдж «🎯 92% …» на карточках блюд/напитков. Ничего не ломает.
- **Фаза 2 — когда накопятся данные (≈ 1–2k оценок).** Офлайн-обучение LightFM по
  cron, результаты в `rec_cache`. `likeProbability`/`recommend` читают кэш, при
  отсутствии данных откатываются на cold-start из Фазы 1. Включается флагом
  `RECSYS_MODEL=on` — откат мгновенный.

Score модели **никогда** не отдаётся наружу — только калиброванная вероятность 0–100% и причина.

---

## 1. Архитектура

```
Клиент ──OPEN/VIEW/SAVE──▶ POST /recsys/event ──▶ interactions (Postgres)
Оценка ────────────────────────────────────────▶ interactions (вес 4/5)

CRON (ночью)  recsys/train.py:
  1) ETL: interactions (+reviews, favorites, follows, listings) ─▶ матрица user×item + признаки
  2) LightFM.fit (WARP loss) ─▶ user/item эмбеддинги
  3) предсказания top-N + калибровка score→вероятность (Platt/isotonic)
  4) запись в rec_cache (UPSERT)

Запрос  GET /recsys/probability/:id, /recsys/recommend
  ─▶ читать rec_cache; если нет ─▶ cold-start (RecsysService)  ─▶ кэш в Redis/память (TTL 1ч)
```

NestJS не зависит от Python: общая точка — таблицы `interactions` (вход) и `rec_cache` (выход).

---

## 2. Таблицы

### `interactions` (внедрено, Prisma)
| колонка | тип | назначение |
|---|---|---|
| id | uuid PK | |
| user_id | text FK→users | |
| listing_id | text FK→listings | |
| type | text | RATE_HIGH/RATE_GOOD/SAVE/VIEW/OPEN |
| weight | float | 5/4/3/2/1 |
| created_at | timestamptz | для time-decay |

### `rec_cache` (Фаза 2)
| колонка | тип | назначение |
|---|---|---|
| user_id | text | |
| listing_id | text | |
| probability | int (0–100) | калиброванная |
| score | float | сырой LightFM (внутренний, не отдаётся) |
| reason | text | объяснение |
| rank | int | позиция в top-N |
| model_version | text | для отката/A-B |
| updated_at | timestamptz | |
| PK (user_id, listing_id) | | |

```sql
CREATE TABLE rec_cache (
  user_id text NOT NULL, listing_id text NOT NULL,
  probability int NOT NULL, score double precision NOT NULL,
  reason text, rank int, model_version text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);
```

## 3. Индексы
- `interactions (user_id, created_at)` — ETL по пользователю + time-decay (внедрено).
- `interactions (listing_id)`, `interactions (type)` (внедрено).
- `rec_cache (user_id, rank)` — выдача top-N: `WHERE user_id=$1 ORDER BY rank LIMIT N`.
- частичный: `rec_cache (user_id) WHERE probability >= 70` — быстрые «точно зайдёт».

## 4. Миграции
- Фаза 1: модель `Interaction` уже в `schema.prisma`, применена через `prisma db push`
  (история миграций имеет дрейф — поэтому push, без reset; данные целы).
- Фаза 2: `rec_cache` создаётся SQL-миграцией выше (отдельно, не трогает прод-таблицы).

## 5. Признаки (features)
- **Item features:** type, category, cuisine, price_level, brand, бакеты avg_rating/review_count.
- **User features:** интересы и ценовой сегмент из онбординг-квиза (`users.preferences`),
  агрегаты по категориям, подписки (follows) как side-information.
- Веса действий (per spec): RATE 9–10 = 5, RATE 8 = 4, SAVE = 3, VIEW>15s = 2, OPEN = 1.
- Time-decay: `weight * exp(-Δдней / 60)` при сборке матрицы.

## 6. ETL-пайплайн (recsys/train.py)
1. Выгрузить `interactions` (+ reviews для рейтингов как явный сигнал).
2. Свернуть в `coo_matrix` user×item с весами (+ time-decay).
3. Построить item/user feature-матрицы (LightFM `Dataset.build_*`).
4. Train/val split по времени (последние 15% — валидация).

## 7. Обучение модели (LightFM)
- `LightFM(loss='warp', no_components=64, learning_rate=0.05)`; 30 эпох.
- Метрики: precision@10, AUC на валидации (лог в `recsys/metrics.log`).
- Калибровка: логистическая регрессия score→P(оценка≥8) на валидации → вероятность 0–100%.

## 8. Cron (переобучение)
- `cron: 0 4 * * *` (ночью) запускает `python recsys/train.py`.
- Окружение: отдельный venv (`recsys/requirements.txt`), не трогает Node.
- На Windows — Планировщик задач (как `togomoscow-dev`); в облаке — cron.

## 9. API
- `POST /recsys/event {listingId,type}` — лог OPEN/VIEW/SAVE (внедрено).
- `GET /recsys/probability/:id` → `{probability, reason}` (внедрено, cold-start).
- `GET /recsys/recommend?take=N` → ранжированные позиции + вероятность (внедрено, cold-start).
- Фаза 2: те же endpoints читают `rec_cache`, fallback на cold-start.

## 10. Кеширование
- Фаза 2: результаты модели материализованы в `rec_cache` (по сути персистентный кэш).
- Горячий слой: in-memory/Redis TTL 1ч на `probability/:id` и `recommend`.
- Инвалидация: после новой оценки — точечно пересчитать cold-start для пользователя
  (дёшево), полный пересчёт — ночным cron.

## Холодный старт
Если данных мало (внедрено в `RecsysService.likeProbability`/`recommend`):
- интересы и ценовой сегмент из квиза;
- аффинити пользователя к категории (среднее его оценок там);
- качество карточки у сообщества (avg_rating/review_count);
- популярные карточки как базлайн.

## Объяснимость
Каждая рекомендация — с причиной (внедрено для cold-start):
- «Вам нравится категория «Кофе»»; «Высокая оценка у других — 4.6★»;
- «Совпадает с вашими интересами из анкеты»; Фаза 2: «Пользователи с похожим вкусом
  поставили 9.2». Сырой score модели пользователю не показывается.

## Преобразование score → вероятность
LightFM score не интерпретируем напрямую. На валидации обучаем логистическую регрессию
`P(rating≥8 | score)` → проценты. Cold-start даёт честные 40–97% из эвристик выше.

## План внедрения без поломки
1. ✅ `interactions` + логирование + cold-start вероятность (Фаза 1, отдельный модуль `recsys`).
2. Дать данным накопиться (бейдж уже мотивирует оценивать).
3. Добавить `rec_cache` + `recsys/train.py` + cron (Python, изолирован).
4. Переключить чтение на кэш за флагом `RECSYS_MODEL`, fallback на cold-start. Откат — флаг.
