# togomoscow — контекст проекта для AI-агентов

Telegram Mini App «русский Yelp/Untappd»: оценка блюд и напитков в заведениях Москвы.
Бот: **@togomoscow_bot** · Прод: **https://app.togomoscow.ru** (Cloudflare named tunnel → localhost).
Владелец: Кирилл (@reznik_kir1ll), отвечает по-русски. Весь код пишет/запускает агент.

## Архитектура

- **frontend/** — React 18 + Vite + TypeScript. БЕЗ CSS-фреймворков: один `src/index.css`.
  Стиль: красно-чёрно-белый (акцент `--accent: #d32323`, Yelp-red). Referenced дизайны: Yelp (карточки заведений), Untappd (посты оценок), Instagram (фото-посты).
- **backend/** — NestJS + Prisma + PostgreSQL 16 (docker-compose: контейнер `yelp_postgres`, БД `yelp`). MinIO (S3-совместимое) для загруженных фото → отдаются через `GET /api/files/:key`.
- **Авторизация** — Telegram initData: заголовок `Authorization: tma <initData>`, HMAC-валидация в `backend/src/common/telegram-auth.guard.ts`. **maxAge = 0 (без срока)** — не возвращать ограничение по возрасту: мобильный Telegram кэширует initData надолго, окно свежести молча ломало авторизацию на телефонах.
- **AI-стек (всё локально, open-source, никаких облачных API):**
  - Ollama (`localhost:11434`): `moondream` (vision, fallback), `qwen2.5:3b` (текст), `nomic-embed-text` (текстовые эмбеддинги 768d).
  - CLIP `Xenova/clip-vit-base-patch32` через `@xenova/transformers` (ONNX) **в процессе бэкенда** — основное распознавание фото (image-to-image, ~250мс). Кэш моделей: `backend/.models-cache`.
  - Tesseract.js (WASM) — OCR для вина/меню.
  - Модуль: `backend/src/vision/` (OllamaService, ClipService, EmbeddingService, VectorSearchService, OCRService, VisionRecognitionService).

## Как запускать / деплоить

- Dev-серверы запускает Windows Scheduled Task **`togomoscow-dev`** (BE `npm run start:dev` watch на :3000, FE `vite build && vite preview` на :5173, cloudflared tunnel). Перезапуск: `Start-ScheduledTask -TaskName "togomoscow-dev"`.
- **Фронт отдаётся из `dist/` через `vite preview`** — после правок фронта ОБЯЗАТЕЛЬНО `npx vite build`, иначе пользователи видят старый бандл. `vite build` НЕ типчекает (esbuild) — гоняй `npx tsc --noEmit` вручную; в проекте есть старые pre-existing tsc-ошибки (ListingDetail и др.), они не блокируют.
- **Деплой-ритуал**: `node scripts/set-menu-button.mjs "https://app.togomoscow.ru/?v=NNN"` — bump N на 1 (cache-bust кнопки меню бота). Текущая версия видна в истории команд/git.
- Бэкенд в watch-режиме перекомпилируется сам; проверка: `curl localhost:3000/api/health` → 200. Проверяй, что правка попала в `backend/dist/...` (grep по dist).
- **Prisma на Windows**: `npx prisma generate` падает с EPERM, пока бэкенд запущен (лок DLL). Порядок: убить node-процессы → generate → `Start-ScheduledTask togomoscow-dev`. `npx prisma db push` работает без остановки.

## Правила продукта (НЕ нарушать)

1. **Сети заведений** = один общий меню-набор И единый рейтинг: отзыв на блюдо в любой точке сети засчитывается всей сети (`reviews.service.linkChain`, `listings.service.byId` агрегирует по `groupKey`).
2. **Вино** — только бренды/производители, НИКОГДА не сорта винограда как самостоятельные карточки.
3. **Никакого ретейла в каталоге**: кофе «в зёрнах/капсулах/дрип», «котлеты для бургеров», полуфабрикаты — вычищаются. После КАЖДОГО парсинга гонять скрипты гигиены: `backend/prisma/purge-retail-items.mjs`, `dedup-items.mjs` (слияние дублей — только внутри одной категории!), `dedup-coffee-names.mjs` («Раф кофе»→«Раф» только при наличии двойника).
4. **Уведомления бота пользователям ВЫКЛЮЧЕНЫ** («пока»): weekly-push (Sched. task `togomoscow-weekly-push` disabled + guard в скрипте), пуш о подписке удалён. Не включать. Сообщения админу/саппорту — можно.
5. **Лента (recsys wall)**: только отзывы с фото, загруженным пользователем (`photoUrls` непустой). Оценка без фото в ленту не попадает. Фото позиции из интернета — только на карточке позиции.
6. **Рекомендательная лента**: только позиции с реальными (легально спарсенными) фото + кофе всегда; стоковые (pexels/unsplash/wikimedia) исключаются (`REAL_PHOTO_OR_COFFEE` в recsys.service). Каждая рекомендация привязана к конкретному заведению (`servedAt` non-empty), сироты не показываются.
7. **Категорийные рейтинги** разблокируются после 5 отзывов пользователя в категории (categoryGate). Блоки «Где лучше всего» / «🤖 Похожие» скрыты, пока у юзера < `RECS_MIN_REVIEWS` (env, дефолт 15) оценок — пустых состояний не показывать.
8. Плитка «Кафе» включает фастфуд/шаурму/мороженое/фуд-корты; «Бары» включают пабы и пивные сады (regex в `listings.service.list`).

## Критические грабли (стоили часов дебага)

- **Postgres `\m` / `\M` НЕ работают с кириллицей** в этой БД (word-boundary читается как буквальные m/M). Использовать явный класс: `WORD_CH = 'a-zа-яё0-9'`, граница `[^a-zа-яё0-9]`. См. `wordRegexes` в listings.service.
- **pgvector НЕДОСТУПЕН** (образ postgres:16-alpine). Векторный поиск — in-memory косинус в `VectorSearchService` (5мс на ~1k позиций). Интерфейс задуман под drop-in замену на pgvector.
- **onnxruntime-node требует `vcruntime140_1.dll`** (VC++ Redistributable) — уже установлен на этой машине. Ошибка «The specified module could not be found» = отсутствует системная DLL, не путь.
- **Transformers.js v2 НЕ понимает data:-URI** — картинки передавать URL'ом или `RawImage.fromBlob(new Blob([new Uint8Array(buf)]))`.
- **`https://telegram.org/js/telegram-web-app.js` заблокирован/тормозит у части RU мобильных операторов** → скрипт самохостится: `frontend/public/telegram-web-app.js`. В `index.html` есть boot-watchdog (репортит ошибки в `POST /api/health/client-error`, авто-перезагрузка через 12с если React не смонтировался). НЕ возвращать внешний скрипт.
- **initData читать ЖИВЫМ** на каждый запрос (`window.Telegram?.WebApp?.initData`), не константой на módule-scope (гонка холодного старта) — см. `authHeaders` в `frontend/src/api.ts`.
- Профиль/избранное: мгновенный localStorage-кэш + ретраи с backoff + refetch на focus (см. MyRatings/Favorites). Не убирать — чинит холодный старт на мобильных.
- **Nominatim/Overpass**: основной API капризный; рабочее зеркало Overpass — maps.mail.ru. Nominatim — max 1 req/сек.
- Названия эмодзи-звёзд: рейтинг = красные квадраты `Stars`; «Нет оценок» = 5 серых звёзд + текст (везде единообразно).
- Метро: `backend/src/listings/metro-stations.json` (242 станции) + `nearestMetro()`; сети (branchCount>1) показывают город, одиночные — «м. Станция». nest-cli.json содержит `assets: ["**/*.json"]` — не удалять, иначе JSON не попадёт в dist.

## Данные

- ~3700 заведений Москвы (OSM + ручные), ~900 блюд/напитков, все с текстовыми эмбеддингами; 641 с CLIP-эмбеддингами фото. Backfill-скрипты: `backend/prisma/backfill-embeddings.mjs`, `backfill-clip.mjs`, `backfill-avatars.mjs` (аватары через Bot API, если Telegram не отдал photo_url).
- Меню сетей парсятся: `__NEXT_DATA__` inline JSON + Playwright network-capture (доказано: Додо, Zotman, Кофемания). Скрипты в `backend/prisma/` (menu-*.mjs, enrich-*.mjs).
- События заведений: t.me/s публичное превью + вежливый fetch сайтов (ban-safe, без MTProto).
- Два аккаунта владельца: @reznik_kir1ll (tg 1029738735, основной, 26+ отзывов) и @moscow_suppo (tg 8387548653, саппорт). Не путать при отладке «мои оценки».

## Распознавание фото (ключевая фича, FAB-камера)

Поток: FAB (красная кнопка камеры, все экраны) → фото → `POST /api/vision/recognize` → CLIP-эмбеддинг фото → косинус по `image_embedding` → Top-5 «Похоже, это…» (или авто-открытие при confidence ≥ `VISION_AUTO_OPEN`, дефолт 0.9) → выбор → **VenuePicker (где сфоткал)** → **ReviewForm с предзагруженным фото** (`initialPhotoUrls`). Фидбек пишется в `recognition_feedback` (подтвердил = позитив, исправил = негатив) для будущего дообучения. Режимы wine/menu — через OCR. Fallback при недоступном CLIP: moondream→qwen-перевод→текстовый поиск.

## Открытые хвосты (на момент передачи)

1. **Scan UX**: «Попробовать ещё раз» должен повторно РАСПОЗНАВАТЬ то же фото (сейчас открывает камеру заново); добавить отдельную кнопку «Переснять»; Esc не закрывает окно анализа (нет `useEscClose` в ScanFab); распознавание capp ~14с у пользователя — проверить, что CLIP-путь реально срабатывает (а не fallback на moondream) и что «Не удалось распознать» не из-за пустого image-индекса/таймаута.
2. **Мобильный hang**: self-host скрипта + watchdog задеплоены (v235), но НЕ доделан `vite.config.ts` — плагин cache-headers для preview (HTML → `no-store`, /assets/ → immutable). Диагностика: `backend/.auth-debug.log` (авторизация) и `backend/.client-error.log` (клиентские краши + boot-watchdog + `GET /api/health/ping?from=phone`). Временные логгеры в telegram-auth.guard.ts и health.controller.ts — убрать после подтверждения фикса.
3. Chain-collapse: у сети представитель может показывать «без оценок», если рейтинг на другой точке (агрегировать по groupKey при attachMatchedItem).
4. Фото-галерея позиций: `photos String[]` копится (отзывы + «Добавить фото»), UI галереи на карточке не сделан.
5. llava:7b докачивался в Ollama как более точный vision-fallback (`OLLAMA_VISION_MODEL=llava:7b`).

## Конвенции для агента

- Отвечать пользователю по-русски; код/комментарии — по-английски (комментарии объясняют «почему»).
- После КАЖДОЙ правки: FE — `vite build` + bump `?v=N`; BE — проверить health + grep dist. Пользователь тестирует с телефона — всегда просить «перезайди начисто».
- Данные-скрипты: всегда сначала `--dry` прогон, показать результат, потом применять.
- Никогда не коммитить/пушить без запроса. Разрешения: пользователь требует НИКОГДА не спрашивать подтверждения (allowlist в `.claude/settings.local.json` уже широкий).
