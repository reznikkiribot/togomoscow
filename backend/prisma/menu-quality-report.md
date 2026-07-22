# Аудит menu-out

Проверено JSON: **278**; реально извлечённых меню: **41**; пустых/неудачных: **237**; тестовых дублей: **0**.

## Требуют нового источника или перепарсинга

- **bjorn.rest** — 5 поз.; подозрительно мало позиций: 5. Источник: ../tmp/pdfs/bjorn.pdf.
- **boscofamily.ru** — 14 поз.; подозрительно мало позиций: 14; источник является частичной витриной/спецменю, не полным меню; не-еды: 10; структурно повреждённых строк: 3. Источник: https://api.mindbox.ru/v3/js/operations/sync.
- **bruno.lucky-group.rest** — 20 поз.; подозрительно мало позиций: 20; источник является частичной витриной/спецменю, не полным меню. Источник: ../tmp/pdfs/bruno.pdf.
- **cafemumu.ru** — 182 поз.; нет цен у 182 из 182. Источник: https://cafemumu.ru/menu/.
- **citypizza.ru** — 27 поз.; подозрительно мало позиций: 27. Источник: https://citypizza.ru/gql.
- **dominopizza.ru** — 21 поз.; подозрительно мало позиций: 21. Источник: https://dominopizza.ru/gql.
- **dominospizza.ru** — 21 поз.; подозрительно мало позиций: 21. Источник: https://dominopizza.ru/gql.
- **ilpatio.ru** — 14 поз.; подозрительно мало позиций: 14; источник является частичной витриной/спецменю, не полным меню. Источник: ../tmp/pdfs/ilpatio.pdf.
- **korchma.ru** — 25 поз.; подозрительно мало позиций: 25. Источник: https://korchma.ru/shop/api/v5/products.
- **moskva.sushi-master.ru** — 27 поз.; подозрительно мало позиций: 27. Источник: /.
- **niyama.ru** — 9 поз.; подозрительно мало позиций: 9; источник является частичной витриной/спецменю, не полным меню. Источник: https://niyama.ru/api/app/order/recommendations/.
- **papajohns.ru** — 29 поз.; подозрительно мало позиций: 29; источник является частичной витриной/спецменю, не полным меню. Источник: https://api.papajohns.ru/sailplay/gifts.
- **ramen.moscow** — 8 поз.; подозрительно мало позиций: 8; источник является частичной витриной/спецменю, не полным меню; не-еды: 8. Источник: https://miniapp.lb.group/miniapp/restaurants/ramen_land%3Aserpukhovskaya-classes/events.
- **steakiteasy.ru** — 170 поз.; источник является частичной витриной/спецменю, не полным меню. Источник: https://menu.steakiteasy.ru/_next/data/mfbxVlFG08gG1Jlm2ptpr/ru/menu/steak-it-easy/barnoe-menu.json.
- **uryk.ru** — 10 поз.; подозрительно мало позиций: 10; источник является частичной витриной/спецменю, не полным меню. Источник: https://uryk.ru/api/user/recommendations.
- **wolkonsky.com** — 24 поз.; подозрительно мало позиций: 24; источник является частичной витриной/спецменю, не полным меню; нет цен у 24 из 24. Источник: https://wolkonsky.com/catalog/*.

## Достаточно фильтрации/нормализации без перепарсинга

- **atlanticabistro.ru** — грязных названий: 17; ценовых выбросов для ручной проверки: 1.
- **boscofamily.ru** — мусорных строк: 10.
- **bruno.lucky-group.rest** — мусорных строк: 2.
- **bubasushi.ru** — мусорных строк: 23; грязных названий: 4; ценовых выбросов для ручной проверки: 13.
- **cafemumu.ru** — мусорных строк: 28; грязных названий: 8.
- **chaihona.ru** — мусорных строк: 25; грязных названий: 2; ценовых выбросов для ручной проверки: 11.
- **chiho.ru** — мусорных строк: 7; грязных названий: 16; ценовых выбросов для ручной проверки: 2.
- **citypizza.ru** — мусорных строк: 4; грязных названий: 16; ценовых выбросов для ручной проверки: 1.
- **coffeemania.ru** — мусорных строк: 30; грязных названий: 94; ценовых выбросов для ручной проверки: 5.
- **daglavka.com** — мусорных строк: 35; грязных названий: 68; ценовых выбросов для ручной проверки: 9.
- **delikateska.ru** — грязных названий: 37; ценовых выбросов для ручной проверки: 3.
- **dodopizza.ru** — мусорных строк: 49; грязных названий: 3; ценовых выбросов для ручной проверки: 7.
- **dominopizza.ru** — грязных названий: 16.
- **dominospizza.ru** — грязных названий: 16.
- **franklins.ru** — мусорных строк: 39; грязных названий: 18.
- **karavaevi.ru** — мусорных строк: 15; грязных названий: 7; ценовых выбросов для ручной проверки: 4.
- **korchma.ru** — мусорных строк: 1; грязных названий: 8.
- **lcpizza.ru** — мусорных строк: 26; грязных названий: 62.
- **mezhdubulok.ru** — мусорных строк: 21; грязных названий: 16.
- **mnogolososya.ru** — мусорных строк: 27; грязных названий: 1; ценовых выбросов для ручной проверки: 7.
- **moskva.sushi-master.ru** — мусорных строк: 7; грязных названий: 1.
- **msk.stolle.ru** — мусорных строк: 16; грязных названий: 6; ценовых выбросов для ручной проверки: 3.
- **niyama.ru** — мусорных строк: 3.
- **papajohns.ru** — мусорных строк: 11.
- **pilsner.ru** — мусорных строк: 12; грязных названий: 4; ценовых выбросов для ручной проверки: 20.
- **pizzahut.ru** — мусорных строк: 16; грязных названий: 10.
- **pizzapaolo.ru** — мусорных строк: 8; грязных названий: 5.
- **ramen.moscow** — мусорных строк: 8; грязных названий: 5.
- **skuratovcoffee.ru** — грязных названий: 26.
- **steakiteasy.ru** — мусорных строк: 28; грязных названий: 2; ценовых выбросов для ручной проверки: 3.
- **syrovarnya.com** — мусорных строк: 18; грязных названий: 1; ценовых выбросов для ручной проверки: 1.
- **thebull.ru** — мусорных строк: 16.
- **vaffel.ru** — мусорных строк: 25; грязных названий: 114; ценовых выбросов для ручной проверки: 3.
- **vkusnoitochka.ru** — мусорных строк: 63; грязных названий: 17; ценовых выбросов для ручной проверки: 2.
- **wolkonsky.com** — грязных названий: 2.
- **yakitoriya.ru** — мусорных строк: 20; грязных названий: 6; ценовых выбросов для ручной проверки: 9.
- **yanprimus.ru** — мусорных строк: 7; грязных названий: 6.
- **zotmanpizza.ru** — мусорных строк: 50; грязных названий: 80; ценовых выбросов для ручной проверки: 4.

## Пустые или не найденные меню

Всего: **237**. Полный список со статусом и источником находится в `emptyOrFailedDomains` JSON-отчёта.

## Сводка всех извлечённых меню

| Домен | Позиций | С ценой | Медиана | Авто-флаги |
|---|---:|---:|---:|---|
| atlanticabistro.ru | 66 | 66 | 850 | needs-normalization: 17, metadata-in-name: 10, description-like: 2, high-price-outlier: 1 |
| bjorn.rest | 5 | 5 | 1120 | — |
| boscofamily.ru | 14 | 14 | 2381 | junk: 10, non-food: 10, description-like: 3 |
| bruno.lucky-group.rest | 20 | 20 | 1400 | junk: 2 |
| bubasushi.ru | 140 | 140 | 890 | junk: 23, high-price-outlier: 13, needs-normalization: 4, metadata-in-name: 3, non-food: 3 |
| cafemumu.ru | 182 | 0 | — | needs-normalization: 8, junk: 28, metadata-in-name: 1 |
| chaihona.ru | 252 | 252 | 650 | junk: 25, high-price-outlier: 11, needs-normalization: 2 |
| chiho.ru | 75 | 75 | 450 | needs-normalization: 16, metadata-in-name: 1, junk: 7, non-food: 1, high-price-outlier: 1, low-price-outlier: 1 |
| citypizza.ru | 27 | 27 | 885 | needs-normalization: 16, metadata-in-name: 2, junk: 4, high-price-outlier: 1 |
| coffeemania.ru | 359 | 359 | 950 | needs-normalization: 94, metadata-in-name: 73, junk: 30, high-price-outlier: 5 |
| daglavka.com | 147 | 147 | 520 | needs-normalization: 68, junk: 35, metadata-in-name: 15, high-price-outlier: 8, low-price-outlier: 1 |
| delikateska.ru | 38 | 38 | 390 | needs-normalization: 37, metadata-in-name: 37, high-price-outlier: 3 |
| dodopizza.ru | 182 | 182 | 295 | junk: 49, needs-normalization: 3, metadata-in-name: 1, low-price-outlier: 4, high-price-outlier: 3 |
| dominopizza.ru | 21 | 21 | 789 | needs-normalization: 16, metadata-in-name: 1 |
| dominospizza.ru | 21 | 21 | 789 | needs-normalization: 16, metadata-in-name: 1 |
| franklins.ru | 103 | 103 | 209 | junk: 39, needs-normalization: 18, metadata-in-name: 12 |
| ilpatio.ru | 14 | 14 | 1290 | — |
| karavaevi.ru | 106 | 106 | 365 | junk: 15, needs-normalization: 7, metadata-in-name: 7, high-price-outlier: 4 |
| korchma.ru | 25 | 25 | 410 | needs-normalization: 8, metadata-in-name: 8, junk: 1, description-like: 1 |
| lcpizza.ru | 154 | 154 | 484 | junk: 26, needs-normalization: 62, metadata-in-name: 17 |
| mezhdubulok.ru | 38 | 38 | 60 | needs-normalization: 16, junk: 21, metadata-in-name: 8 |
| mnogolososya.ru | 105 | 105 | 595 | junk: 27, high-price-outlier: 7, needs-normalization: 1 |
| moskva.sushi-master.ru | 27 | 27 | 469 | junk: 7, needs-normalization: 1, metadata-in-name: 1 |
| msk.stolle.ru | 123 | 123 | 390 | junk: 16, high-price-outlier: 3, metadata-in-name: 5, needs-normalization: 6 |
| niyama.ru | 9 | 9 | 839 | junk: 3 |
| papajohns.ru | 29 | 29 | 270 | junk: 11 |
| pilsner.ru | 223 | 223 | 580 | junk: 12, high-price-outlier: 20, metadata-in-name: 1, needs-normalization: 4 |
| pizzahut.ru | 103 | 103 | 119 | junk: 16, needs-normalization: 10, metadata-in-name: 4 |
| pizzapaolo.ru | 52 | 52 | 349 | junk: 8, needs-normalization: 5 |
| ramen.moscow | 8 | 8 | 2000 | junk: 8, non-food: 8, needs-normalization: 5, metadata-in-name: 5 |
| skuratovcoffee.ru | 26 | 26 | 350 | needs-normalization: 26, metadata-in-name: 1 |
| steakiteasy.ru | 170 | 170 | 930 | junk: 28, needs-normalization: 2, high-price-outlier: 3, metadata-in-name: 2 |
| syrovarnya.com | 132 | 132 | 890 | needs-normalization: 1, high-price-outlier: 1, junk: 18 |
| thebull.ru | 157 | 71 | 390 | junk: 16 |
| uryk.ru | 10 | 10 | 590 | — |
| vaffel.ru | 158 | 158 | 330 | needs-normalization: 114, metadata-in-name: 82, junk: 25, low-price-outlier: 3 |
| vkusnoitochka.ru | 113 | 113 | 219 | needs-normalization: 17, junk: 63, metadata-in-name: 3, low-price-outlier: 1, high-price-outlier: 1 |
| wolkonsky.com | 24 | 0 | — | needs-normalization: 2, metadata-in-name: 2 |
| yakitoriya.ru | 193 | 193 | 655 | junk: 20, high-price-outlier: 9, needs-normalization: 6, metadata-in-name: 6 |
| yanprimus.ru | 64 | 64 | 995 | needs-normalization: 6, metadata-in-name: 2, junk: 7 |
| zotmanpizza.ru | 204 | 204 | 549 | needs-normalization: 80, metadata-in-name: 5, junk: 50, high-price-outlier: 4 |

> Авто-флаги — консервативная диагностика, а не разрешение менять цену. Цены в отчёте не исправляются и не выводятся из соседних строк.
