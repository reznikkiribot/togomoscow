# Recsys 2.0 — дизайн от Codex (16.07.2026)

Воронка: candidate retrieval → multi-objective ranker → contextual bandit → constrained reranking.


`candidate retrieval → multi-objective ranker → contextual bandit → constrained reranking`

Это повторяет практику YouTube и Instagram, но реализуемо в одном NestJS-сервисе и Postgres: YouTube разделяет генерацию кандидатов и ranking, Instagram — retrieval, несколько стадий ranking и финальный reranking. [YouTube paper](https://research.google.com/pubs/archive/45530.pdf), [Meta Engineering](https://engineering.fb.com/2023/08/09/ml-applications/scaling-instagram-explore-recommendations-system/)

## 1. Представление интересов пользователя

Хранить не только `categoryAffinity` и `venueAffinity`, а несколько независимых профилей:

```ts
interface UserTasteProfile {
  categories: Record<CategoryId, Affinity>;
  venues: Record<GroupKey, Affinity>;       // сеть — единая сущность
  items: Record<ItemId, Affinity>;
  creators: Record<UserId, Affinity>;
  tags: Record<Tag, Affinity>;              // spicy, wine, burger...
  priceBuckets: Record<string, Affinity>;
  geoCells: Record<string, Affinity>;

  longTermEmbedding: number[];              // устойчивый вкус
  shortTermEmbedding: number[];             // текущая сессия / последние дни
}
```

Каждая affinity:

```ts
interface Affinity {
  positive: number;
  negative: number;
  confidence: number;
  updatedAt: Date;
}
```

Не нормализовать значение навсегда в `[-1,1]`: это теряет уверенность. Рассчитывать:

\[
a_{u,x}=
\frac{P-N}{P+N+\lambda}
\cdot
\left(1-e^{-(P+N)/c}\right)
\]

Первая часть — направление интереса, вторая — confidence. Пользователь с одним лайком и пользователь с 50 лайками не должны выглядеть одинаково.

## 2. Обновление после каждого действия

Для события \(e\):

\[
\Delta(e)=w_e \cdot q_e \cdot d_e
\]

где:

- \(w_e\) — базовая сила сигнала;
- \(q_e\) — качество/интенсивность;
- \(d_e=\exp(-\ln 2\cdot age/halfLife_e)\) — decay.

Стартовые веса:

| Событие | Reward |
|---|---:|
| Оценка 5 | +4.0 |
| Оценка 4 | +2.2 |
| Оценка 3 | +0.2 |
| Оценка 2 | −2.5 |
| Оценка 1 | −5.0 |
| Избранное | +5.0 |
| «Не интересно» | −8.0 |
| Подписка на автора | +5.0 автору |
| Лайк/реакция | +2.0 |
| Комментарий | +3.5 |
| Открытие карточки | +0.5 |
| Просмотр >15 секунд | +1.2 |
| Фото/оценка после рекомендации | +6.0 |
| Быстрый выход <2 секунд | −0.3 |
| Пропуск видимого элемента | −0.05…−0.3 |

Слабый сигнал обновляет профиль только после реального impression: карточка была видна минимум на 50% не менее 700 мс. Скролл мимо не равен dislike.

Распределение reward по признакам:

```ts
category += reward * 1.0;
item     += reward * 1.0;
venue    += reward * 0.7;
tags     += reward * 0.5 / sqrt(tagCount);
creator  += reward * 0.8; // только для постов
price    += reward * 0.2;
geoCell  += reward * 0.15;
```

Для каждого затронутого affinity сначала применять decay:

\[
P \leftarrow P\cdot 2^{-\Delta t/H_P},\quad
N \leftarrow N\cdot 2^{-\Delta t/H_N}
\]

Рекомендуемые half-life:

- открытия/тапы: 14 дней;
- dwell/скролл: 21 день;
- лайки: 60 дней;
- оценки/избранное: 180 дней;
- «не интересно»: 90 дней;
- текущая сессия: 30–90 минут.

Short-term embedding:

\[
s_u \leftarrow normalize(0.75s_u+0.25\,r_e\,v_i)
\]

Long-term:

\[
l_u \leftarrow normalize(0.98l_u+0.02\,r_e\,v_i)
\]

Финальный контекстный вкус:

\[
v_u=normalize(0.65l_u+0.25s_u+0.10v_{collab})
\]

## 3. Collaborative filtering без ML-инфраструктуры

Раз в ночь NestJS cron строит implicit-feedback ALS/BPR или item-item cosine на sparse interaction matrix:

\[
r_{ui}=\sum_e reward(e)\cdot decay(e)
\]

Для текущего масштаба проще и надёжнее item-item similarity:

\[
sim(i,j)=
\frac{\sum_u r_{ui}r_{uj}}
{\sqrt{\sum_u r_{ui}^2}\sqrt{\sum_u r_{uj}^2}}
\]

Хранить для каждого item top-50 похожих позиций в таблице `item_neighbors`. Считать отдельно внутри совместимых типов: вино не смешивать с сортами винограда, retail исключать до retrieval.

Позже можно добавить 32–64-мерный BPR, реализованный на TypeScript с SGD.

## 4. Генерация кандидатов

Не делать один SQL с тысячей условий. Собрать независимые пулы, каждый до 100–300 кандидатов.

Для карточек блюд:

- 25% похожие на высоко оценённые;
- 15% collaborative `users-like-you`;
- 15% любимые категории/теги;
- 10% любимые заведения/сети;
- 10% nearby и реально доступные `servedAt`;
- 10% trending с Bayesian quality;
- 10% exploration;
- 5% свежие позиции.

Для ленты:

- новые посты друзей;
- посты авторов с высоким creator affinity;
- посты незнакомых людей со taste similarity;
- посты по любимым items/categories;
- локально популярные посты;
- rec-карточки блюд;
- exploration.

Жёсткие фильтры применяются до ranking:

- hidden / blocked / `notInterested`;
- несовместимая география;
- rec-карточка без `servedAt`;
- запрещённый retail;
- рекомендация без допустимого реального фото, кроме кофе;
- пост в wall без пользовательского фото;
- уже показанный пост.

Для постов «показан один раз» фиксировать impression только после фактической видимости, а не при генерации страницы.

## 5. Ranking: предсказывать несколько исходов

Вместо `quality × taste × freshness` считать вероятности:

\[
p_{open},p_{dwell},p_{like},p_{comment},p_{save},p_{rate},p_{hide},p_{exit}
\]

Итоговая utility карточки:

\[
U =
0.5p_{open}
+1.0p_{dwell}
+1.5p_{like}
+2.5p_{comment}
+4p_{save}
+6p_{rate}
-8p_{hide}
-3p_{exit}
\]

Для поста:

\[
U_{post} =
0.6p_{dwell}
+1.5p_{like}
+2.5p_{comment}
+3p_{profileFollow}
-8p_{hide}
\]

Вероятности сначала можно получать логистической регрессией:

\[
p_k=\sigma(b_k+w_k^\top x_{u,i,c})
\]

Признаки \(x\):

- category/venue/item/creator affinities;
- `dot(userEmbedding, itemEmbedding)`;
- collaborative similarity;
- расстояние;
- цена;
- рейтинг и число оценок;
- автор-друг / подписка;
- новизна;
- час, день недели;
- тип поверхности и позиция;
- последние 5–20 действий сессии;
- число предыдущих показов категории/автора;
- source retrieval-кандидата.

После каждого размеченного impression обновлять веса online SGD:

\[
w_k \leftarrow w_k+
\eta\cdot importanceWeight\cdot(y_k-p_k)x-\eta\lambda w_k
\]

Нужно логировать `requestId`, кандидатов, итоговую позицию, score, модель, exploration probability и propensity. Иначе нельзя корректно учитывать position bias и проводить offline evaluation.

## 6. Exploration/exploitation

Использовать Thompson Sampling не по каждому item, а по источникам и тематикам:

```text
arms:
friend_posts
followed_creators
similar_users
favorite_categories
nearby
trending
new_items
rec_cards
```

На `(userSegment, surface, arm)` хранить Beta-постериор:

```text
alpha = 1 + positiveReward
beta  = 1 + negativeOrNoReward
```

Для каждой сессии:

\[
\theta_a \sim Beta(\alpha_a,\beta_a)
\]

\[
score' = U + \epsilon_u\theta_a + noveltyBonus
\]

Exploration budget:

- cold user: 30%;
- 5–20 meaningful actions: 15%;
- зрелый профиль: 5–8%;
- после нескольких одинаковых сессий: временно увеличить до 12%.

Exploration-кандидаты всё равно должны проходить quality/safety-фильтры. Thompson Sampling — практичный способ исследовать неизвестные предпочтения через неопределённость. [PMLR](https://proceedings.mlr.press/v28/agrawal13.html)

## 7. Negative feedback

Разделить четыре случая:

1. `NOT_INTERESTED_ITEM` — исключить item, сильно понизить его теги.
2. `NOT_INTERESTED_CATEGORY` — понизить категорию, но не навсегда.
3. `NOT_INTERESTED_CREATOR` — исключить автора из незнакомых рекомендаций.
4. `ALREADY_TRIED / SEEN` — не считать негативным вкусом.

Негатив нельзя распространять слишком широко:

```ts
item     += reward * 1.0;
creator  += reward * 0.8;
category += reward * 0.35;
tags     += reward * 0.25;
venue    += reward * 0.15;
```

Три последовательных быстрых пропуска одной категории за сессию дают session-level penalty, но не долгосрочный dislike.

## 8. Смешивание единой ленты

Сначала rank каждого пула отдельно, затем constrained reranking.

Правило друзей:

- первые 1–2 доступных непросмотренных поста друзей всегда стоят первыми;
- далее друг гарантируется минимум раз в 5 позиций, пока есть достойные посты;
- внутри друзей ranking персональный, а не только chronological.

Пример квот на следующие 20 позиций:

```text
friends/following:  6–10
strangers:          5–8
rec cards:          3–5
exploration:        1–2
```

Финальный greedy reranker:

\[
FinalScore =
U_{bandit}
-0.35\,sameAuthorRecent
-0.25\,sameCategoryRecent
-0.20\,sameVenueRecent
+0.15\,sourceUnderQuota
+0.10\,freshness
\]

Ограничения:

- не более двух одинаковых content types подряд;
- один автор максимум два раза на 20 элементов;
- одна сеть максимум два раза;
- rec-карточки не подряд;
- минимум три категории на первые десять позиций;
- MMR diversity:

\[
MMR(i)=\lambda Score(i)-(1-\lambda)\max_{j\in feed}sim(i,j)
\]

Начать с \(\lambda=0.8\).

## 9. Cold start

Новый пользователь:

1. География и время суток.
2. Популярное с Bayesian average, не raw rating:

\[
Q_i=\frac{n}{n+m}\bar r_i+\frac{m}{n+m}\bar r_{global}
\]

3. Диверсифицированная подборка категорий.
4. Друзья/подписки имеют абсолютный приоритет.
5. После первых 3–5 действий резко включать short-term profile.
6. Exploration 30%, но не показывать мусор и позиции без заведений/фото.
7. Не заставлять проходить onboarding: первые реальные действия информативнее заявленных предпочтений.

Для нового item использовать content embedding, категорию, заведение, цену и quality prior. Для нового поста — affinity к автору/item плюс prior автора.

## 10. Таблицы Postgres

Минимальный набор:

```text
recsys_events
recsys_impressions
user_affinities
user_embeddings
item_neighbors
model_weights
bandit_state
feed_sessions
feed_session_items
item_quality_stats
creator_quality_stats
```

`feed_session_items` фиксирует готовый порядок хотя бы на 30–50 позиций: пагинация не должна перестраивать уже начатую ленту.

Обработчик события должен в одной транзакции:

```text
insert event
→ resolve reward
→ decay/update affinities
→ update short-term embedding
→ update relevant bandit arm after attribution window
→ enqueue/perform SGD update
```

## Практический порядок внедрения

1. Нормальные impressions и unified reward.
2. Multi-pool retrieval.
3. Confidence-aware affinities и short/long-term profile.
4. Multi-objective logistic ranker.
5. Constrained feed mixer с приоритетом друзей.
6. Thompson Sampling.
7. Item-item collaborative filtering.
8. Offline evaluation и A/B-тесты.

Главные метрики: не CTR, а `meaningful actions/session`, оценки или избранное после рекомендации, hide rate, session return D1/D7, category diversity и доля рекомендаций, реально приведших к открытию заведения. CTR оптимизировать отдельно опасно: он быстро превращает ленту в кликбейт.
