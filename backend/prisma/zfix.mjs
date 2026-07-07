import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const r1 = await p.listing.updateMany({ where:{ name:"Болоньезе", type:"DISH" }, data:{ category:"Итальянская" } });
const r2 = await p.listing.updateMany({ where:{ name:"Картофель фри", type:"DISH", category:"Блюдо" }, data:{ category:"Фастфуд" } });
console.log("Болоньезе->Итальянская:", r1.count, " Картофель фри->Фастфуд:", r2.count);
await p.$disconnect();
