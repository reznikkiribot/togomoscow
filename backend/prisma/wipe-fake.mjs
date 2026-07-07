// Removes all seeded/fake reviews + votes and resets every listing's rating to 0,
// so the platform starts with a clean, organic slate (real reviews go through
// moderation from now on). Keeps users, favorites, follows, listings, menu links.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const votes = await prisma.reviewVote.deleteMany({});
  const reviews = await prisma.review.deleteMany({});
  const reset = await prisma.listing.updateMany({
    data: { avgRating: 0, reviewCount: 0 },
  });
  console.log(
    `Удалено: отзывов ${reviews.count}, голосов ${votes.count}. Рейтинг сброшен у ${reset.count} карточек.`,
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
