#!/usr/bin/env bash
# Continuous photo pipeline in SMALL batches: generate 20 → verify those 20 →
# upload the ones that pass → repeat. Photos reach prod within a minute of being
# generated instead of after a whole sweep.
#
# Why two processes per batch instead of checking each photo inline: CLIP
# (onnxruntime) and spawning sd-cli in the SAME node process segfault on Windows,
# so generation and verification must stay separate. A batch of 20 is the
# practical compromise between "immediately" and process overhead.
#
# Sources, in order of preference:
#   1) regen-from-refs — img2img (strength 0.2) from the photo parsed off the
#      venue's own menu, so the AI image stays close to the real dish;
#   2) generate-missing-photos — text2img by name, only for items whose menu had
#      no picture at all.
# Every uploaded photo passed the CLIP name check (≥0.5); anything below is skipped.
#
# Run: DATABASE_URL="$(cat .railway-db-url)" bash prisma/photo-pipeline.sh
cd "$(dirname "$0")/.."
export DATABASE_URL="${DATABASE_URL:-$(cat .railway-db-url)}"

BATCH=20
prev_audit=0

# work list + any new menu references: once per run, not per batch
node prisma/build-photo-todo.mjs 2>&1 | tail -1
node prisma/regen-from-refs.mjs --stage-dl 2>&1 | tail -1

for cycle in $(seq 1 400); do
  echo "=== ПОРЦИЯ $cycle ($(date +%H:%M)) ==="

  # 1) from the parsed menu photo (img2img 0.2): generate → verify → upload
  node prisma/regen-from-refs.mjs --stage-gen --limit $BATCH 2>&1 | tail -1
  node prisma/regen-from-refs.mjs --stage-check --limit $BATCH 2>&1 | tail -1

  # 2) no menu photo at all → text2img by name, same verify-before-upload
  node prisma/generate-missing-photos.mjs --stage-gen --limit $BATCH 2>&1 | tail -1
  node prisma/generate-missing-photos.mjs --stage-check --limit $BATCH 2>&1 | tail -1

  # 3) trim leftover background margin (720p rule; never clears a photo)
  node prisma/crop-photo-padding.mjs --all --limit $BATCH 2>&1 | tail -1

  count=$(node --input-type=module -e "process.env.DATABASE_URL=process.env.DATABASE_URL+'?connect_timeout=30&connection_limit=1';const {PrismaClient}=await import('@prisma/client');const p=new PrismaClient();console.log(await p.listing.count({where:{type:{in:['DISH','DRINK']},photoUrl:{not:null}}}));await p.\$disconnect();" 2>/dev/null)
  echo "фото на проде: $count"

  node prisma/backfill-clip.mjs 2>&1 | tail -1

  # full audit (wrong type / frame / margins / duplicates) every ~400 new photos
  if [ $((count - prev_audit)) -ge 400 ]; then
    echo "=== АУДИТ (каждые 400) $(date +%H:%M) ==="
    node prisma/audit-photos.mjs 2>&1 | grep -E "напиток|рамка|поля|отцентр|ДУБЛИ|ПЕРЕГЕНЕРАЦИИ"
    node prisma/audit-photos.mjs --apply-only 2>&1 | tail -1
    prev_audit=$count
  fi
done
echo "=== КОНВЕЙЕР ЗАВЕРШЁН $(date +%H:%M) ==="
