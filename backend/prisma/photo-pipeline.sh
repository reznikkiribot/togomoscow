#!/usr/bin/env bash
# Continuous photo pipeline: generate → auto-crop padding → embed → audit every ~400.
# Run: DATABASE_URL="$(cat .railway-db-url)" nohup bash prisma/photo-pipeline.sh &
cd "$(dirname "$0")/.."
export DATABASE_URL="${DATABASE_URL:-$(cat .railway-db-url)}"
prev_audit=0
for cycle in $(seq 1 30); do
  echo "=== ЦИКЛ $cycle $(date +%H:%M) ==="
  node prisma/build-photo-todo.mjs 2>&1 | tail -1
  # img2img from parsed refs (strength 0.2 — closest to the real photo)
  node prisma/regen-from-refs.mjs --stage-dl 2>&1 | tail -1
  node prisma/regen-from-refs.mjs --stage-gen 2>&1 | tail -1
  node prisma/regen-from-refs.mjs --stage-check 2>&1 | tail -1
  # text2img fallback for dishes without a ref
  node prisma/generate-missing-photos.mjs --stage-gen 2>&1 | tail -1
  node prisma/generate-missing-photos.mjs --stage-check 2>&1 | tail -1
  # AUTO-CROP plain padding so the dish fills the card (no поля under object-fit:cover)
  node prisma/crop-photo-padding.mjs --all --limit 600 2>&1 | tail -1
  # embeddings for recognition
  node prisma/backfill-clip.mjs 2>&1 | tail -1
  count=$(node --input-type=module -e "process.env.DATABASE_URL=process.env.DATABASE_URL+'?connect_timeout=30&connection_limit=1';const {PrismaClient}=await import('@prisma/client');const p=new PrismaClient();console.log(await p.listing.count({where:{type:{in:['DISH','DRINK']},photoUrl:{not:null}}}));await p.\$disconnect();" 2>/dev/null)
  echo "фото сейчас: $count (аудит был на $prev_audit)"
  # every ~400 new photos → audit (type + composition incl. padding) → clear bad
  if [ $((count - prev_audit)) -ge 400 ]; then
    echo "=== АУДИТ (каждые 400) $(date +%H:%M) ==="
    node prisma/audit-photos.mjs 2>&1 | grep -E "напиток|рамка|поля|отцентр|ПЕРЕГЕНЕРАЦИИ"
    node prisma/audit-photos.mjs --apply-only 2>&1 | tail -1
    prev_audit=$count
  fi
  sleep 20
done
echo "=== PHOTO-PIPELINE ЗАВЕРШЁН $(date +%H:%M) ==="
