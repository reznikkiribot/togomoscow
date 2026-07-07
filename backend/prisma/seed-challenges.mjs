// Seeds a few starter challenges (idempotent by title). Run after db push.
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const CH = [
  { title: 'Кофейный тур: оцените 5 видов кофе', category: 'кофе', target: 5, days: 14 },
  { title: 'Винный набор: оцените 3 вина', category: 'вино', target: 3, days: 14 },
  { title: 'Гастро-старт: оцените 5 блюд', category: null, target: 5, days: 14 },
];

async function main() {
  let n = 0;
  for (const c of CH) {
    const exists = await prisma.challenge.findFirst({ where: { title: c.title, active: true } });
    if (exists) continue;
    await prisma.challenge.create({
      data: {
        title: c.title,
        category: c.category,
        target: c.target,
        endsAt: new Date(Date.now() + c.days * 86400000),
      },
    });
    n++;
  }
  console.log(`Челленджи добавлены: ${n}`);
  await prisma.$disconnect();
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
