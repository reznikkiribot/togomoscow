import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

// grape varieties + generic styles — NOT brands → remove (per product decision:
// wine cards are by producer brand, not by grape sort)
const REMOVE = [
  "Каберне совиньон","Каберне фран","Мерло","Сира","Шираз","Гренаш","Мальбек",
  "Темпранильо","Неббиоло","Барбера","Зинфандель","Пинотаж","Карменер","Мурведр",
  "Гамэ","Шардоне","Совиньон блан","Рислинг","Пино гриджио","Пино гри","Мускат",
  "Алиготе","Шенен блан","Вердехо","Альбариньо","Грюнер вельтлинер","Ркацители",
  "Треббьяно","Гарганега","Санджовезе","Гевюрцтраминер","Вионье","Семильон",
  "Пино нуар","Шампанское","Lambrusco","Ламбруско","Chianti","Rioja","Просекко",
];

const victims = await p.listing.findMany({
  where: { type: "DRINK", category: "Вино", name: { in: REMOVE } },
  select: { id: true },
});
const ids = victims.map((v) => v.id);
console.log("to remove:", ids.length);
// Dislike.item_id has no FK → clean it manually; reviews/menulinks cascade
await p.dislike.deleteMany({ where: { itemId: { in: ids } } });
const del = await p.listing.deleteMany({ where: { id: { in: ids } } });
console.log("deleted:", del.count);
const left = await p.listing.count({ where: { type: "DRINK", category: "Вино" } });
console.log("wine brands left:", left);
await p.$disconnect();
