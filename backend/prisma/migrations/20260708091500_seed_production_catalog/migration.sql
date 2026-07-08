-- Minimal production catalog for a fresh Railway database.
-- Additive and idempotent: no user data is deleted or overwritten.

INSERT INTO "listings" (
  "id", "type", "name", "aliases", "description", "category", "address",
  "photo_url", "price_level", "lat", "lng", "source", "external_id",
  "hours", "cuisine", "group_key", "avg_rating", "review_count"
) VALUES
  ('10000000-0000-4000-8000-000000000001', 'RESTAURANT', 'Probka на Цветном', 'Probka, Пробка',
   'Итальянская кухня и винотека', 'Ресторан', 'Цветной б-р, 2',
   'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
   3, 55.7686, 37.6207, 'production-seed', 'venue-probka',
   'Mo-Su 10:00-23:00', 'Итальянская', 'probka', 4.6, 86),
  ('10000000-0000-4000-8000-000000000002', 'RESTAURANT', 'Salumeria', 'Салюмерия',
   'Итальянская траттория в центре Москвы', 'Ресторан', 'Маросейка, 9/2',
   'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
   2, 55.7575, 37.6360, 'production-seed', 'venue-salumeria',
   'Mo-Su 10:00-23:00', 'Итальянская', 'salumeria', 4.5, 64),
  ('10000000-0000-4000-8000-000000000003', 'RESTAURANT', 'Grace Bistro', 'Грейс Бистро',
   'Европейское бистро', 'Ресторан', 'М. Бронная, 24',
   'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80',
   3, 55.7625, 37.5950, 'production-seed', 'venue-grace',
   'Mo-Su 09:00-23:00', 'Европейская', 'grace-bistro', 4.4, 71)
ON CONFLICT ("source", "external_id") DO NOTHING;

INSERT INTO "listings" (
  "id", "type", "name", "aliases", "description", "category", "photo_url",
  "source", "external_id", "group_key", "avg_rating", "review_count"
) VALUES
  ('20000000-0000-4000-8000-000000000001', 'DISH', 'Болоньезе', 'bolognese, spaghetti bolognese, pasta bolognese, паста болоньезе, спагетти болоньезе',
   'Паста с мясным томатным соусом', 'Паста',
   'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?auto=format&fit=crop&w=900&q=80',
   'production-seed', 'dish-bolognese', 'bolognese', 4.7, 112),
  ('20000000-0000-4000-8000-000000000002', 'DISH', 'Карбонара', 'carbonara, pasta carbonara, паста карбонара',
   'Паста с сыром, яйцом и гуанчале', 'Паста',
   'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=900&q=80',
   'production-seed', 'dish-carbonara', 'carbonara', 4.6, 98),
  ('20000000-0000-4000-8000-000000000003', 'DISH', 'Стейк Рибай', 'ribeye steak, рибай, steak',
   'Мраморная говядина на гриле', 'Мясо',
   'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80',
   'production-seed', 'dish-ribeye', 'ribeye-steak', 4.8, 121),
  ('20000000-0000-4000-8000-000000000004', 'DISH', 'Тирамису', 'tiramisu, десерт тирамису',
   'Итальянский десерт с маскарпоне и кофе', 'Десерты',
   'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=900&q=80',
   'production-seed', 'dish-tiramisu', 'tiramisu', 4.5, 77),
  ('30000000-0000-4000-8000-000000000001', 'DRINK', 'Капучино', 'cappuccino, coffee, кофе капучино',
   'Кофейный напиток с молочной пеной', 'Кофе',
   'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=900&q=80',
   'production-seed', 'drink-cappuccino', 'cappuccino', 4.6, 103),
  ('30000000-0000-4000-8000-000000000002', 'DRINK', 'Матча латте', 'matcha latte, матча, green tea latte',
   'Матча на молоке', 'Чай',
   'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=80',
   'production-seed', 'drink-matcha-latte', 'matcha-latte', 4.4, 54)
ON CONFLICT ("source", "external_id") DO NOTHING;

INSERT INTO "menu_links" ("venue_id", "item_id", "status", "price") VALUES
  ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'APPROVED', 790),
  ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'APPROVED', 760),
  ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000004', 'APPROVED', 520),
  ('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'APPROVED', 720),
  ('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000004', 'APPROVED', 490),
  ('10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', 'APPROVED', 1800),
  ('10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'APPROVED', 320),
  ('10000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000002', 'APPROVED', 410)
ON CONFLICT ("venue_id", "item_id") DO NOTHING;
