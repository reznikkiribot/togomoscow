# Пробелы покрытия togomoscow

Сформировано: 2026-07-21T12:07:40.543Z. БД: production PostgreSQL (read-only). OSM snapshot: 2026-07-21T10:44:50Z.

## Общие числа

- Заведения: **13052**; OSM-источник: **13014**.
- С меню: **693 (5.3%)**; без меню: **12359**.
- Без website: **6692**; без координат: **2**; без фото: **13049**.
- Текущий полный OSM-срез: **12894** объектов; уже в БД по external_id: **12894**; отсутствуют: **0**.

## Округа

| Округ | БД | OSM сейчас | OSM нет в БД | Покрытие OSM |
| --- | --- | --- | --- | --- |
| Центральный административный округ | 4671 | 4584 | 0 | 100% |
| Южный административный округ | 1185 | 1175 | 0 | 100% |
| Северный административный округ | 1133 | 1122 | 0 | 100% |
| Западный административный округ | 1078 | 1074 | 0 | 100% |
| Северо-Восточный административный округ | 1053 | 1035 | 0 | 100% |
| Юго-Восточный административный округ | 883 | 875 | 0 | 100% |
| Юго-Западный административный округ | 883 | 876 | 0 | 100% |
| Восточный административный округ | 828 | 825 | 0 | 100% |
| Северо-Западный административный округ | 617 | 610 | 0 | 100% |
| Новомосковский административный округ | 480 | 480 | 0 | 100% |
| Троицкий административный округ | 104 | 104 | 0 | 100% |

Не попали в текущие OSM-полигоны округов: БД — 135, OSM — 134. В районные полигоны попали все точки; расхождение связано с текущей топологией округов Новой Москвы.

## Главные районные дыры относительно текущего OSM

_Нет данных._

После additive-импорта эта таблица должна опустеть. Это доказывает полноту относительно выбранных OSM-тегов, но не полноту самого OSM.

## Районы с самой низкой плотностью каталога

Это кандидаты на ручную проверку/другие источники, а не доказанные пропуски: крупные и малонаселённые районы закономерно имеют низкую плотность.

| Район | Площадь, км² | Заведений | На км² |
| --- | --- | --- | --- |
| район Вороново | 509.5 | 15 | 0.03 |
| район Бекасово | 210.2 | 10 | 0.05 |
| Краснопахорский район | 249.4 | 26 | 0.1 |
| Филимонковский район | 130.3 | 46 | 0.35 |
| район Капотня | 8 | 3 | 0.37 |
| район Метрогородок | 27.2 | 10 | 0.37 |
| Молжаниновский район | 15.7 | 6 | 0.38 |
| район Троицк | 97.7 | 53 | 0.54 |
| район Восточный | 3.3 | 2 | 0.6 |
| район Щербинка | 64.7 | 54 | 0.84 |
| район Бирюлёво Западное | 8.4 | 10 | 1.19 |
| район Кунцево | 52.1 | 72 | 1.38 |
| район Внуково | 90.1 | 154 | 1.71 |
| Ново-Переделкино | 11.6 | 22 | 1.89 |
| район Некрасовка | 11.2 | 22 | 1.96 |
| район Бирюлёво Восточное | 14.7 | 31 | 2.11 |
| район Ивановское | 10.1 | 23 | 2.29 |
| район Очаково-Матвеевское | 17.4 | 40 | 2.29 |
| район Коммунарка | 95 | 226 | 2.38 |
| район Вешняки | 10.4 | 26 | 2.49 |

## Кухни: БД против текущего OSM baseline

OSM cuisine — неполный пользовательский тег, а не официальная статистика рынка. Сравнение показывает измеримые перекосы покрытия, но не долю продаж или посещений.

| Кухня (OSM tag) | БД | OSM сейчас | Дефицит | Покрытие |
| --- | --- | --- | --- | --- |
| georgian | 376 | 377 | 1 | 99.7% |
| russian | 270 | 271 | 1 | 99.6% |
| japanese | 204 | 205 | 1 | 99.5% |
| coffee_shop | 2501 | 2471 | 0 | 100% |
| burger | 637 | 632 | 0 | 100% |
| pizza | 590 | 583 | 0 | 100% |
| italian | 324 | 320 | 0 | 100% |
| kebab | 319 | 315 | 0 | 100% |
| chicken | 230 | 229 | 0 | 100% |
| sushi | 204 | 203 | 0 | 100% |
| asian | 179 | 175 | 0 | 100% |
| potato | 141 | 141 | 0 | 100% |
| seafood | 139 | 133 | 0 | 100% |
| vietnamese | 127 | 127 | 0 | 100% |
| regional | 112 | 112 | 0 | 100% |
| sandwich | 109 | 109 | 0 | 100% |
| crepe | 106 | 106 | 0 | 100% |
| cake | 107 | 105 | 0 | 100% |
| uzbek | 103 | 99 | 0 | 100% |
| international | 90 | 90 | 0 | 100% |
| steak_house | 79 | 79 | 0 | 100% |
| chinese | 76 | 75 | 0 | 100% |
| hot_dog | 62 | 62 | 0 | 100% |
| shawarma | 62 | 61 | 0 | 100% |
| sausage | 44 | 44 | 0 | 100% |
| tea | 42 | 42 | 0 | 100% |
| turkish | 41 | 41 | 0 | 100% |
| korean | 37 | 37 | 0 | 100% |
| breakfast | 37 | 36 | 0 | 100% |
| bubble_tea | 33 | 32 | 0 | 100% |

## Популярные места, отсутствующие целиком

Эталон: [WHERETOEAT Moscow 2025 shortlist](https://results2020.wheretoeat.ru/publications/news/moskva-short-list-2025/), 53 места; итоговый топ-10 помечен ⭐. Сопоставление сделано только по названию и официальному домену, без догадок.

| Место | Официальный домен |
| --- | --- |
| TOUCH Chef’s Place & Bar | — |
| Vadvare | tsa.moscow |
| На даче шефа | — |
| Mosto | — |

Найдено 49/53; не найдено 4.

## Приоритет доменов без menu-out

| Домен | Точек | Без меню | Отзывы | Важное место | Действие | Score |
| --- | --- | --- | --- | --- | --- | --- |
| kartoshka.com | 137 | 137 | 0 |  | owner-rule skip | 13750 |
| stardogs.ru | 70 | 70 | 0 |  | owner-rule skip | 7075 |
| subway.ru | 53 | 53 | 0 |  | owner-rule skip | 5325 |
| mealty.ru | 51 | 51 | 0 |  | retail skip | 5150 |
| miratorg.ru | 16 | 16 | 0 |  | retail skip | 1700 |
| lea.rest | 1 | 1 | 0 | да | automatic | 1125 |
| leomoscow.ru | 1 | 1 | 0 | да | automatic | 1125 |
| leorest.ru | 1 | 1 | 0 | да | automatic | 1125 |
| loro.lucky-group.ru | 1 | 1 | 0 | да | automatic | 1125 |
| lucky.gorynich.com | 1 | 1 | 0 | да | automatic | 1125 |
| manulmoscow.ru | 1 | 1 | 0 | да | automatic | 1125 |
| matrioshka.su | 1 | 1 | 0 | да | automatic | 1125 |
| matryoshka-rest.ru | 1 | 1 | 0 | да | automatic | 1125 |
| maya.lucky-group.rest | 1 | 1 | 0 | да | automatic | 1125 |
| modusfriends.ru | 1 | 1 | 0 | да | automatic | 1125 |
| padron-rest.ru | 1 | 1 | 0 | да | automatic | 1125 |
| pole.restaurant | 1 | 1 | 0 | да | automatic | 1125 |
| rico-restaurant.ru | 1 | 1 | 0 | да | automatic | 1125 |
| sagemoscow.ru | 1 | 1 | 0 | да | automatic | 1125 |
| sakhalin-moscow.ru | 1 | 1 | 0 | да | automatic | 1125 |
| saray.lucky-group.rest | 1 | 1 | 0 | да | automatic | 1125 |
| savvarest.ru | 1 | 1 | 0 | да | automatic | 1125 |
| selfiemoscow.ru | 1 | 1 | 0 | да | automatic | 1125 |
| severyane.moscow | 1 | 1 | 0 | да | automatic | 1125 |
| whiterabbitmoscow.com | 1 | 1 | 0 | да | automatic | 1125 |
| zhazhdakrovy.ru | 1 | 1 | 0 | да | automatic | 1125 |
| pivoteka465.ru | 10 | 10 | 0 |  | automatic | 1050 |
| delikateska.ru | 10 | 10 | 0 |  | retail skip | 1025 |
| cheburek.me | 9 | 9 | 0 |  | automatic | 925 |
| ojakhuri.ru | 8 | 8 | 0 |  | automatic | 825 |
| pizzamento.ru | 8 | 8 | 0 |  | automatic | 825 |
| karavay-sv.ru | 6 | 6 | 0 |  | automatic | 650 |
| hlebnitca.ru | 6 | 6 | 0 |  | automatic | 625 |
| xn--80aawfcdjqs6e5d.xn--p1ai | 6 | 6 | 0 |  | automatic | 625 |
| mcdonalds.ru | 4 | 4 | 0 |  | owner-rule skip | 425 |
| gt.life | 3 | 3 | 0 |  | automatic | 375 |
| burgerking.ru | 3 | 3 | 0 |  | owner-rule skip | 350 |
| papan-bakery.ru | 3 | 3 | 0 |  | automatic | 350 |
| tuttifruttirussia.com | 3 | 3 | 0 |  | automatic | 350 |
| hesburger.ru | 3 | 3 | 0 |  | owner-rule skip | 325 |
| meatcrew.ru | 3 | 3 | 0 |  | automatic | 325 |
| vaffel.ru | 3 | 3 | 0 |  | automatic | 325 |
| boscofamily.ru | 2 | 2 | 0 |  | automatic | 250 |
| cafesanta.ru | 2 | 2 | 0 |  | automatic | 250 |
| casadinonna.ru | 2 | 2 | 0 |  | automatic | 250 |
| chaihana-injir.com | 2 | 2 | 0 |  | automatic | 250 |
| citypizza.ru | 2 | 2 | 0 |  | automatic | 250 |
| correas.ru | 2 | 2 | 0 |  | automatic | 250 |
| dizengof99.com | 2 | 2 | 0 |  | automatic | 250 |
| dominos.ru | 2 | 1 | 0 |  | automatic | 250 |

## Потенциал распространения уже существующего меню по groupKey

Это кандидаты на проверку, не готовый список для слепого связывания: ошибочный groupKey может смешать одноимённые независимые места.

_Нет данных._

## Уже проверенные, но не извлечённые автоматически

| Домен | Точек | Статус | Следующий путь |
| --- | --- | --- | --- |
| cofix.global | 219 | manual_required (no menu found) | manual source review |
| burgerkingrus.ru | 203 | manual_required (no menu found) | owner-rule skip |
| rostics.ru | 182 | manual_required (WAF) | owner-rule skip |
| onepricecoffee.com | 174 | manual_required (no menu found) | manual source review |
| shoko.ru | 166 | manual_required (WAF) | browser/WAF review |
| surfcoffee.ru | 138 | Moscow pages link to surfmenu.ru Tilda catalogs, but products are not embedded and no public JSON endpoint was found; menu_raley is for Voronezh | manual source review |
| cofefest.ru | 126 | manual_required (no menu found) | manual source review |
| teremok.ru | 73 | manual_required (no menu found) | owner-rule skip |
| prime-star.ru | 69 | manual_required (no menu found) | manual source review |
| pravda-coffee.ru | 59 | manual_required (no menu found) | manual source review |
| tanukifamily.ru | 57 | manual_required (WAF) | browser/WAF review |
| sedelice.ru | 53 | manual_required (no menu found) | manual source review |
| double-b.ru | 45 | site and sitemap are public, but contain no priced menu or public menu API | manual source review |
| drinkit.ru | 45 | menu and ordering are offered only in the app; public guest site has no prices | manual source review |
| cinnabonrussia.com | 44 | manual_required (no menu found) | manual source review |
| sushiwok.ru | 44 | manual_required (no menu found) | manual source review |
| novikovgroup.ru | 20 | manual_required (no menu found) | manual source review |
| maxbakery.ru | 33 | manual_required (no menu found) | manual source review |
| farshburger.ru | 30 | manual_required (no menu found) | manual source review |
| eazzypizza.ru | 30 | HTTP 403 from WAF for site, sitemap, and common public endpoints | browser/WAF review |
| stars-coffee.ru | 25 | site and sitemap are public, but contain no priced menu or public menu API | manual source review |
| lepimivarim.ru | 23 | manual_required (no menu found) | manual source review |
| moremania.info | 23 | public /menu is a client-loaded Tilda catalog; no embedded products or public first-party JSON endpoint found | manual source review |
| brusnikacafe.ru | 22 | manual_required (no menu found) | manual source review |
| gagawa.ru | 22 | manual_required (no menu found) | manual source review |
| frankmeat.ru | 21 | manual_required (no menu found) | manual source review |
| hatimaki.ru | 21 | public catalog is visible, but Node fetch receives Qrator 404; no WAF bypass attempted | browser/WAF review |
| pankruassan.com | 20 | manual_required (no menu found) | manual source review |
| kff.su | 19 | manual_required (WAF) | browser/WAF review |
| buhanka.ru | 19 | manual_required (no menu found) | manual source review |

Полная очередь: `prisma/menu-priority.json`. Машиночитаемый отчёт: `prisma/coverage-report.json`.
