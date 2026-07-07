import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

// Reviews left without a venueId (the "add dish & rate" bug) → attach them to the
// single venue whose APPROVED menu has that item, if unambiguous.
const orphans = await p.review.findMany({
  where: { status: "APPROVED" },
});
let fixed = 0;
for (const r of orphans) {
  const a = (r.attributes ?? {});
  if (a.venueId) continue; // already attributed
  // venues that have this item APPROVED on their menu
  const links = await p.menuLink.findMany({ where: { itemId: r.listingId, status: "APPROVED" }, select: { venueId: true } });
  if (links.length !== 1) {
    console.log(`skip review ${r.id} (item ${r.listingId}): ${links.length} candidate venues`);
    continue;
  }
  const venueId = links[0].venueId;
  await p.review.update({ where: { id: r.id }, data: { attributes: { ...a, venueId } } });
  if (a.price != null) {
    await p.menuLink.update({ where: { venueId_itemId: { venueId, itemId: r.listingId } }, data: { price: Number(a.price) } }).catch(() => {});
  }
  fixed++;
  console.log(`fixed review ${r.id} → venue ${venueId} (price=${a.price ?? "—"})`);
}
console.log(`\nDone. Fixed ${fixed} orphan review(s).`);
await p.$disconnect();
