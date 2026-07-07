import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
// re-link every DRINK/DISH review's item across its venue's whole chain
const revs = await p.review.findMany({ where:{ status:"APPROVED" }, select:{ listingId:true, userId:true, attributes:true } });
let added = 0;
for (const r of revs) {
  const a = r.attributes || {};
  if (!a.venueId) continue;
  const venue = await p.listing.findUnique({ where:{ id:a.venueId }, select:{ groupKey:true, name:true } });
  if (!venue) continue;
  const where = venue.groupKey ? { groupKey:venue.groupKey, type:"RESTAURANT" } : { name:{ equals:venue.name, mode:"insensitive" }, type:"RESTAURANT" };
  const branches = await p.listing.findMany({ where, select:{ id:true } });
  const ids = branches.map(b=>b.id);
  if (!ids.includes(a.venueId)) ids.push(a.venueId);
  for (const vid of ids) {
    const ex = await p.menuLink.findUnique({ where:{ venueId_itemId:{ venueId:vid, itemId:r.listingId } } }).catch(()=>null);
    if (!ex) { await p.menuLink.create({ data:{ venueId:vid, itemId:r.listingId, status:"APPROVED", addedByUserId:r.userId } }); added++; }
  }
}
console.log("links added:", added);
await p.$disconnect();
