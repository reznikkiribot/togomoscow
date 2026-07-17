Сделаю аудит только чтением: сначала разберу конвейер premium-фото и контракты лайков от базы до UI, затем пройду связанные экраны и API на расхождения. Ничего менять не буду — итогом дам приоритизированные находки и конкретные фиксы по файлам.
  → Разобрать premium-фото конвейер и текущие фильтры/кадрирование
  • Проследить лайки отзывов: БД → backend DTO/endpoints → FeedPost/ListingDetail
  • Провести связанный аудит UI и данных, проверить сборкой/типами без изменений
  • Сформировать компактный список правил, находок и конкретных фиксов
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg -n --hidden --glob '"'!**/node_modules/**'"' --glob '"'!**/dist/**'"' \"premium|regen-per-venue|img2img|strength|CLIP|clip|sharp|cover|collage|комбо|combo\" backend/prisma backend/src frontend/src; rg -n --hidden --glob '"'!**/node_modules/**'"' --glob '"'!**/dist/**'"' \"FeedPost|voteState|vote|likeCount|dislikeCount|myVote|mine|likes|dislikes\" frontend/src backend/src backend/prisma/schema.prisma" in D:\Приложения\Yelp
 succeeded in 3432ms:
frontend/src\api.ts:430:    const body = await compressImage(file); // CLIP works on 224px crops — 1600px is plenty
frontend/src\components\Icons.tsx:1:// Clean line icons (premium, consistent stroke) — replaces emoji in the tab bar
frontend/src\components\ListingDetail.tsx:205:              style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, marginTop: 6 }}
frontend/src\components\ListingDetail.tsx:936:            // native tel: link (best-effort call) + clipboard fallback (webview may block tel:)
frontend/src\components\ListingDetail.tsx:1283:                  <img className="rb-avatar" src={myAvatar} alt="" style={{ objectFit: 'cover' }} />
frontend/src\components\ListingDetail.tsx:1504:            // first review of the card → discovery phrase; else a rotating one
frontend/src\components\PhotoPostModal.tsx:97:    navigator.clipboard?.writeText(shareLink).then(() => showToast('Ссылка скопирована')).catch(() => showToast('Не удалось'));
backend/src\vision\vision.module.ts:9:import { ClipService } from './clip.service';
backend/src\vision\vision.module.ts:15:// rest of the app is untouched. Extensible: swap OllamaService for a CLIP/SigLIP
backend/src\game\game.service.ts:39:    { key: 'first_taster_dish', title: 'Первый дегустатор блюда', icon: '🏅', metric: 'discoveries_dish', need: 1, enabled: true },
backend/src\game\game.service.ts:40:    { key: 'first_taster_drink', title: 'Первый дегустатор напитка', icon: '🥂', metric: 'discoveries_drink', need: 1, enabled: true },
backend/src\game\game.service.ts:51:  discovery: { enabled: true, showInProfile: true },
backend/src\game\game.service.ts:88:    // discoveries: my review is the EARLIEST on its listing
backend/src\game\game.service.ts:132:      discoveries: myFirsts.length,
backend/src\game\game.service.ts:133:      discoveries_dish: myFirsts.filter((f) => f.type === 'DISH').length,
backend/src\game\game.service.ts:134:      discoveries_drink: myFirsts.filter((f) => f.type === 'DRINK').length,
backend/src\vision\vision.controller.ts:19:import { ClipService } from './clip.service';
backend/src\vision\vision.controller.ts:33:    private readonly clip: ClipService,
backend/src\vision\vision.controller.ts:51:    const vec = await this.clip.embedImage(Buffer.concat(chunks));
backend/src\game\game.module.ts:7:// Gamification: progressive feature unlocks, levels, achievements, discoveries.
frontend/src\components\TasteHero.tsx:7:// Tinder-style discovery card. Swipe right → add to favorites; swipe left → "не люблю".
frontend/src\components\TasteHero.tsx:30:  // Tinder gesture is discoverable without any tutorial overlay
backend/src\vision\vision-recognition.service.ts:7:import { ClipService } from './clip.service';
backend/src\vision\vision-recognition.service.ts:58:    private readonly clip: ClipService,
backend/src\vision\vision-recognition.service.ts:74:    // PRIMARY: CLIP image-to-image — fast (~250ms) + accurate + language-independent.
backend/src\vision\vision-recognition.service.ts:76:    const qvec = await this.clip.embedImage(image);
backend/src\vision\vision-recognition.service.ts:78:    // alike to CLIP). Detect via the SAME embedding, then OCR.
backend/src\vision\vision-recognition.service.ts:80:      const probs = await this.clip.classifyVec(qvec, ClipService.BOTTLE_LABELS);
backend/src\vision\vision-recognition.service.ts:87:      const kind = await this.clip.classifyVec(qvec, [
backend/src\vision\vision-recognition.service.ts:111:          diagnostic: `clip:image top=${top.toFixed(2)} imageIndex=${this.vectors.imageSize}`,
backend/src\vision\vision-recognition.service.ts:114:      this.log.warn(`CLIP produced no candidates: imageIndex=${this.vectors.imageSize} rawHits=${hits.length}`);
backend/src\vision\vision-recognition.service.ts:116:    // FALLBACK (CLIP unavailable): VLM caption → translate → text search
backend/src\vision\vision-recognition.service.ts:146:        const vec = await this.clip.embedImage(url);
backend/src\vision\vector-search.service.ts:13://   • image (CLIP, 512d)   → photo recognition (image-to-image)
backend/src\vision\vector-search.service.ts:98:  /** Photo recognition: nearest items to a query IMAGE embedding (CLIP). */
backend/src\listings\listings.controller.ts:18:// Public browse/search endpoints — no auth needed to discover venues.
backend/src\vision\ollama.service.ts:6:// the model backend can be swapped (Ollama → CLIP/SigLIP server) without touching
backend/src\listings\listings.service.ts:20:// Cyrillic (they're read as literal m/M). This explicit class covers RU + EN + digits.
backend/src\listings\listings.service.ts:1440:    // (the owner's rule: every discovery card names its place and its price)
backend/src\vision\clip.service.ts:3:// CLIP image encoder running locally in-process (Transformers.js → ONNX, open-source,
backend/src\vision\clip.service.ts:9:  private readonly log = new Logger('CLIP');
backend/src\vision\clip.service.ts:13:  readonly model = process.env.CLIP_MODEL || 'Xenova/clip-vit-base-patch32';
backend/src\vision\clip.service.ts:32:      .catch((e) => this.log.warn(`CLIP preload failed: ${e?.message}`));
backend/src\vision\clip.service.ts:42:      (env as any).cacheDir = process.env.CLIP_CACHE || './.models-cache';
backend/src\vision\clip.service.ts:46:      this.log.log(`CLIP ready (${this.model}) in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
backend/src\vision\clip.service.ts:74:  // Moderation label embeddings via the CLIP TEXT tower only (~60MB quantized).
backend/src\vision\clip.service.ts:93:      const { AutoTokenizer, CLIPTextModelWithProjection, env } = await import('@xenova/transformers');
backend/src\vision\clip.service.ts:94:      (env as any).cacheDir = process.env.CLIP_CACHE || './.models-cache';
backend/src\vision\clip.service.ts:96:      const textModel = await CLIPTextModelWithProjection.from_pretrained(this.model);
backend/src\vision\clip.service.ts:109:      this.log.log(`CLIP moderation labels ready in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
backend/src\vision\clip.service.ts:123:        const { AutoTokenizer, CLIPTextModelWithProjection, env } = await import('@xenova/transformers');
backend/src\vision\clip.service.ts:124:        (env as any).cacheDir = process.env.CLIP_CACHE || './.models-cache';
backend/src\vision\clip.service.ts:126:        const textModel = await CLIPTextModelWithProjection.from_pretrained(this.model);
backend/src\vision\clip.service.ts:155:        const { AutoTokenizer, CLIPTextModelWithProjection, env } = await import('@xenova/transformers');
backend/src\vision\clip.service.ts:156:        (env as any).cacheDir = process.env.CLIP_CACHE || './.models-cache';
backend/src\vision\clip.service.ts:158:        const textModel = await CLIPTextModelWithProjection.from_pretrained(this.model);
backend/src\vision\clip.service.ts:187:   *  (softmax over CLIP similarities — same math the zero-shot pipeline does).
backend/src\vision\clip.service.ts:193:      // CLIP logit scale ≈ 100 for the ViT-B/32 checkpoint
backend/src\health\health.controller.ts:4:import { ClipService } from '../vision/clip.service';
backend/src\health\health.controller.ts:17:    private readonly clip: ClipService,
backend/src\health\health.controller.ts:65:        clipReady: this.clip.ready,
backend/src\health\health.controller.ts:73:        clipReady: this.clip.ready,
backend/src\recsys\recsys.service.ts:25:// venue-less/price-less cards are banned from the discovery feed entirely.
backend/src\recsys\recsys.service.ts:42:  // "not premium" everyday food (baking, grill, sandwiches).
backend/src\common\non-standalone.ts:4:// appear on any discovery surface (first-taster, rate pool, recsys, feed recs).
backend/src\reviews\reviews.service.ts:6:import { ClipService } from '../vision/clip.service';
backend/src\reviews\reviews.service.ts:21:// RU dish/drink name → a short English CLIP query, so the photo-name check works
backend/src\reviews\reviews.service.ts:22:// (CLIP ViT-B/32 reads English). Dictionary of classics first, then category.
backend/src\reviews\reviews.service.ts:65:    private readonly clip: ClipService,
backend/src\reviews\reviews.service.ts:74:  /** CLIP zero-shot check of an uploaded review photo.
backend/src\reviews\reviews.service.ts:92:        this.clip.moderatePhoto(buf),
backend/src\reviews\reviews.service.ts:101:      // the card name. CLIP zero-shot the photo against "<dish>" vs an unrelated
backend/src\reviews\reviews.service.ts:106:          this.clip.classify(buf, [`a photo of ${en}`, 'a photo of an unrelated object, screenshot or chart']),
backend/src\uploads\uploads.service.ts:15:import sharp from 'sharp';
backend/src\uploads\uploads.service.ts:71:        body = await sharp(buffer).rotate().toBuffer();
backend/src\uploads\uploads.controller.ts:16:import sharp from 'sharp';
backend/src\uploads\uploads.controller.ts:83:      const thumb = await sharp(buf).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
backend/src\uploads\uploads.controller.ts:118:      const thumb = await sharp(Buffer.concat(chunks)).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
frontend/src\storyImage.ts:61:    const coverScale = Math.max(tiny.width / img.width, tiny.height / img.height);
frontend/src\storyImage.ts:62:    const cw = img.width * coverScale;
frontend/src\storyImage.ts:63:    const ch = img.height * coverScale;
frontend/src\storyImage.ts:89:    ctx.clip();
frontend/src\tasting.ts:275:  { key: 'strength', label: 'Крепость', options: ['Крепкий', 'Средний', 'Лёгкий'] },
frontend/src\index.css:198:  object-fit: cover;
frontend/src\index.css:292:  object-fit: cover;
frontend/src\index.css:384:  object-fit: cover;
frontend/src\index.css:399:  object-fit: cover;
frontend/src\index.css:432:  object-fit: cover;
frontend/src\index.css:679:   NO height:100% here: clipping #root to the viewport blanked the page behind
frontend/src\index.css:788:  min-height: 0; /* let flex shrink the image so .info is never clipped */
frontend/src\index.css:790:  object-fit: cover;
frontend/src\index.css:851:  object-fit: cover;
frontend/src\index.css:897:  object-fit: cover;
frontend/src\index.css:910:  object-fit: cover;
frontend/src\index.css:1135:  object-fit: cover;
frontend/src\index.css:1197:  background-size: cover;
frontend/src\index.css:1236:  object-fit: cover;
frontend/src\index.css:1276:  object-fit: cover;
frontend/src\index.css:1364:  object-fit: cover;
frontend/src\index.css:1400:  object-fit: cover;
frontend/src\index.css:1760:  object-fit: cover;
frontend/src\index.css:1833:/* filter bar (toggled via "Фильтры") — wraps so dropdowns aren't clipped */
frontend/src\index.css:2005:  object-fit: cover;
frontend/src\index.css:2176:  object-fit: cover;
frontend/src\index.css:2324:  object-fit: cover;
frontend/src\index.css:2439:  object-fit: cover;
frontend/src\index.css:2474:  object-fit: cover;
frontend/src\index.css:2491:  object-fit: cover;
frontend/src\index.css:2778:  object-fit: cover;
frontend/src\index.css:2954:  object-fit: cover;
frontend/src\index.css:3224:  object-fit: cover;
frontend/src\index.css:3662:  object-fit: cover;
frontend/src\index.css:3759:  object-fit: cover;
frontend/src\index.css:3937:  object-fit: cover;
frontend/src\index.css:4273:  object-fit: cover;
frontend/src\index.css:4323:  object-fit: cover;
frontend/src\index.css:4412:  z-index: 0; /* own stacking context so Leaflet's internal z-indexes don't cover the sheet */
frontend/src\index.css:4674:  object-fit: cover;
frontend/src\index.css:4766:  object-fit: cover;
frontend/src\index.css:4828:  object-fit: cover;
frontend/src\index.css:5002:/* ---- premium polish pack (июль 2026) ---- */
frontend/src\index.css:5019:/* one-time Tinder-swipe hint on the discovery card (first 2 sessions) */
frontend/src\index.css:5172:  text-overflow: clip;
frontend/src\index.css:5193:   iOS WebKit resolves them against a stale first layout pass and CLIPS footers.
frontend/src\index.css:5209:/* bulletproof: the card can not visually clip its footer even if some engine
frontend/src\index.css:5210:   miscomputes its height — only the photo wrapper clips (for rounded corners) */
frontend/src\index.css:5389:  /* frosted glass — premium (iOS/Telegram style) */
frontend/src\index.css:5405:/* ---- premium press states (unified, subtle scale + interruptible curve) ---- */
frontend/src\index.css:5441:/* ---- skeletons (premium loading, replaces «Загрузка…»/spinner) ---- */
frontend/src\index.css:5468:/* «Показать ещё» premium loading: inline spinner in the button */
frontend/src\screens\MyRatings.tsx:186:      {game && ((game.counters.useful ?? 0) > 0 || (game.counters.discoveries ?? 0) > 0 || game.achievements.some((a) => a.earned)) && (
frontend/src\screens\MyRatings.tsx:195:              <b>{game.counters.discoveries ?? 0}</b>
frontend/src\screens\Home.tsx:419:    // clip telemetry: measure a real card once per session — if the footer is
frontend/src\screens\Home.tsx:420:    // clipped on THIS device, the exact numbers land in server logs
frontend/src\screens\Home.tsx:423:        if (sessionStorage.getItem('clipProbe')) return;
frontend/src\screens\Home.tsx:427:        sessionStorage.setItem('clipProbe', '1');
frontend/src\screens\Home.tsx:430:        const clip = Math.round(b.bottom - cr.bottom);
frontend/src\screens\Home.tsx:440:              where: 'card-clip', clip, btnH: Math.round(b.height), cardH: Math.round(cr.height),
frontend/src\screens\Home.tsx:883:                  // min 400ms so the spinner is always felt (premium — no jarring flash)
backend/prisma\ai-enrich-events.mjs:28:  /бургер|пицц|паст|ролл|сашими|суши|салат|\bсуп\b|\bсет\b|стейк|шаурм|шаверм|хачапур|хинкал|долм|десерт|торт|чизкейк|тирамису|выпечк|завтрак|сэндвич|сендвич|блюд|пельмен|вареник|\bвок\b|боул|поке|рамен|том.?ям|круассан|эклер|пончик|мороже|шашлык|кебаб|плов|лазань|ризотто|гирос|фалафель|хот.?дог|наггетс|картофель фри|кофе|латте|капучин|\bраф\b|\bчай\b|матч|какао|коктейл|лимонад|смузи|\bвино\b|\bпиво\b|сидр|напит|глинтвейн|эспрессо|американо|сангри|креветк|лосось|пельмен|окрошк|борщ|уха|том ям|гаспачо|комбо|сэт|меню/i;
backend/prisma\ai-enrich-events.mjs:92:const NOTFOOD = /\b(logo|banner|advertisement|advert|poster|flyer|billboard|\btext\b|words|sign that reads|price list|menu board|schedule|announcement|screenshot|collage|barcode|\bqr\b|a person|people|\bman\b|\bwoman\b|selfie|building|storefront|\bstreet\b|interior of|empty room|business card|nail|manicure)\b/i;
backend/prisma\backfill-clip.mjs:1:// CLIP image embeddings for every dish/drink photo → enables fast, accurate, language-
backend/prisma\backfill-clip.mjs:3:// embedded unless --all. Run: node prisma/backfill-clip.mjs [--all]
backend/prisma\backfill-clip.mjs:16:console.log('loading CLIP…');
backend/prisma\backfill-clip.mjs:17:const ex = await pipeline('image-feature-extraction', process.env.CLIP_MODEL || 'Xenova/clip-vit-base-patch32');
backend/prisma\backfill-clip.mjs:18:console.log('CLIP ready');
backend/prisma\backfill-clip.mjs:40:console.log(`\nCLIP embedded: ${done}, skipped: ${skip}, failed: ${fail}`);
backend/prisma\build-gen-todo.mjs:2:// proper English SD/CLIP prompt (dictionary → qwen → category hint). The
backend/prisma\build-taste-profiles.mjs:38: "price": "low|mid|premium|any",
backend/prisma\check-grayscale.mjs:2:// (dishes, drinks, venues). Uses sharp channel stats on 200px thumbnails: if the
backend/prisma\check-grayscale.mjs:13:const sharp = (await import('sharp')).default;
backend/prisma\check-grayscale.mjs:24:    const { data, info } = await sharp(buf).resize(64, 64, { fit: 'inside' }).raw().toBuffer({ resolveWithObject: true });
backend/prisma\generate-missing-photos.mjs:1:// Generates card images for the items that failed strict CLIP verification
backend/prisma\generate-missing-photos.mjs:3:// Vulkan). Two stages, because onnxruntime (CLIP) + child-process spawning in one
backend/prisma\generate-missing-photos.mjs:6://   --stage-check  only CLIP-score the PNGs, upload the best (≥0.5) to the bucket
backend/prisma\generate-missing-photos.mjs:33:// heavy deps are stage-scoped: CLIP/S3/sharp only for check (gen must stay spawn-only)
backend/prisma\generate-missing-photos.mjs:47:  console.log('загружаю CLIP…');
backend/prisma\generate-missing-photos.mjs:51:  zs = await t.pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
backend/prisma\generate-missing-photos.mjs:52:  console.log('CLIP готов');
backend/prisma\generate-missing-photos.mjs:152:      const png = fs.readFileSync(best.file); // sharp+onnxruntime in one process segfault (GLib clash) — ship the 512px PNG, ?w= resizes on delivery
backend/prisma\menu-engine.mjs:30:const IMAGE_KEYS = ['image', 'imageUrl', 'image_url', 'img', 'photo', 'picture', 'pictureUrl', 'previewImage', 'thumbnail', 'imageLink', 'cover', 'images'];
backend/prisma\menu-engine.mjs:81:// kopecks heuristic: premium menus store price*100; if the median is huge, divide.
backend/prisma\ingest-events.mjs:2://   discover  — fetch each venue's OWN website, extract its Telegram/VK links,
backend/prisma\ingest-events.mjs:9://   node prisma/ingest-events.mjs discover 200
backend/prisma\ingest-events.mjs:118:// ---- discover sources from a venue's own website ----
backend/prisma\ingest-events.mjs:119:async function discover(prisma, limit) {
backend/prisma\ingest-events.mjs:153:  console.log(`discover: scanned ${venues.length} venues, created ${made} sources`);
backend/prisma\ingest-events.mjs:310:  if (mode === 'discover' || mode === 'all') await discover(prisma, limit);
backend/prisma\menu-import-remote.mjs:50:  if (/любые пицц|комбо|\bсет\b|\bнабор\b|меню дня|за \d+\s*₽|выгодн|подарок|конструктор|собери|акци|скидк|сертификат|доставк|для офиса|идеальных|\+ ?\d|\d ?\+ ?\d/.test(n)) return true;
backend/prisma\menu-import.mjs:33:// strong food words → it's a dish even if the name mentions "напиток" (combos like "Пицца и напиток")
backend/prisma\menu-import.mjs:83:// skip non-dish noise the engine sometimes catches (combos / banners / sets / descriptions)
backend/prisma\menu-import.mjs:89:  if (/любые пицц|комбо|\bсет\b|\bнабор\b|меню дня|за \d+\s*₽|выгодн|подарок|конструктор|собери|акци|скидк|сертификат|доставк|для офиса|идеальных|\+ ?\d|\d ?\+ ?\d/.test(n)) return true;
backend/prisma\menu-pipeline.mjs:3://   2) per-venue photo pipeline: dl refs → img2img @0.2 → CLIP check → upload
backend/prisma\menu-pipeline.mjs:46:  run(['prisma/regen-per-venue.mjs', '--stage-dl']);
backend/prisma\menu-pipeline.mjs:47:  run(['prisma/regen-per-venue.mjs', '--stage-gen']);
backend/prisma\menu-pipeline.mjs:48:  run(['prisma/regen-per-venue.mjs', '--stage-check']);
backend/prisma\regen-from-refs.mjs:2:// makes a SIMILAR but not identical image (SD img2img, strength 0.6), and that
backend/prisma\regen-from-refs.mjs:5:// Stages (onnx/sharp/spawn conflicts → separate processes):
backend/prisma\regen-from-refs.mjs:7://                  to tools/sd/ref/<id>.png (768px, via sharp)
backend/prisma\regen-from-refs.mjs:8://   --stage-gen    sd-cli img2img per ref → tools/sd/out-i2i/<id>-<n>.png
backend/prisma\regen-from-refs.mjs:9://   --stage-check  CLIP-verify vs the dish name, upload the best as aigen-*
backend/prisma\regen-from-refs.mjs:44:  const sharp = (await import('sharp')).default;
backend/prisma\regen-from-refs.mjs:76:      // 512x512 cover — img2img wants the target aspect
backend/prisma\regen-from-refs.mjs:77:      await sharp(buf).resize(472, 472, { fit: 'contain', background: { r: 250, g: 249, b: 247 } }).extend({ top: 20, bottom: 20, left: 20, right: 20, background: { r: 250, g: 249, b: 247 } }).png().toFile(path.join(REF, `${l.id}.png`));
backend/prisma\regen-from-refs.mjs:103:          '-m', 'sd_turbo.safetensors', '-i', refRel, '--strength', '0.45',
backend/prisma\regen-from-refs.mjs:126:  console.log('загружаю CLIP…');
backend/prisma\regen-from-refs.mjs:129:  const zs = await t.pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
backend/prisma\regen-from-refs.mjs:131:  console.log('CLIP готов');
backend/prisma\regen-per-venue.mjs:8:// Stages (onnx/sharp/spawn conflicts → separate processes):
backend/prisma\regen-per-venue.mjs:11://   --stage-gen    sd img2img per ref → tools/sd/outv/<domain>__<slug>-<n>.png
backend/prisma\regen-per-venue.mjs:12://   --stage-check  CLIP-verify vs the dish name, upload, set menuLink.photoUrl for
backend/prisma\regen-per-venue.mjs:14://   node prisma/regen-per-venue.mjs --stage-dl|--stage-gen|--stage-check [--limit N]
backend/prisma\regen-per-venue.mjs:59:  const sharp = (await import('sharp')).default;
backend/prisma\regen-per-venue.mjs:95:        await sharp(buf)
backend/prisma\regen-per-venue.mjs:96:          .resize(512, 512, { fit: 'cover', position: 'top' })
backend/prisma\regen-per-venue.mjs:123:        // OWNER RULE 16.07.2026: strength 0.2 — the copy stays maximally faithful
backend/prisma\regen-per-venue.mjs:127:          '-m', 'sd_turbo.safetensors', '-i', ref, '--strength', '0.2',
backend/prisma\regen-per-venue.mjs:160:  console.log('загружаю CLIP…');
backend/prisma\regen-per-venue.mjs:166:  const MODEL = 'Xenova/clip-vit-base-patch32';
backend/prisma\regen-per-venue.mjs:168:  const { RawImage, AutoTokenizer, CLIPTextModelWithProjection } = t;
backend/prisma\regen-per-venue.mjs:170:  const textModel = await CLIPTextModelWithProjection.from_pretrained(MODEL);
backend/prisma\regen-per-venue.mjs:194:  // softmax over cosine sims ×100 (CLIP logit scale) — same math as the backend
backend/prisma\regen-per-venue.mjs:202:  console.log('CLIP готов');
backend/prisma\remoderate-photos.mjs:2:// (CLIP). A graph/screenshot/unrelated photo (name-match < 0.5) is removed from
backend/prisma\remoderate-photos.mjs:12:console.log('CLIP…');
backend/prisma\remoderate-photos.mjs:15:const zs = await t.pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
backend/prisma\menu-out\dodopizza.ru.json:850:      "name": "Футбольное комбо",
backend/prisma\menu-out\dodopizza.ru.json:905:      "name": "Легендарное комбо",
backend/prisma\retro-clean-stock.mjs:3:// stored listing photo that is NOT ai-generated (aigen- passed CLIP already) and
backend/prisma\retro-clean-stock.mjs:4:// NOT a user's review photo, CLIP checks "is this a plated dish/drink at all,
backend/prisma\retro-clean-stock.mjs:26:console.log('загружаю CLIP…');
backend/prisma\retro-clean-stock.mjs:29:const MODEL = 'Xenova/clip-vit-base-patch32';
backend/prisma\retro-clean-stock.mjs:31:const { RawImage, AutoTokenizer, CLIPTextModelWithProjection } = t;
backend/prisma\retro-clean-stock.mjs:33:const textModel = await CLIPTextModelWithProjection.from_pretrained(MODEL);
backend/prisma\retro-clean-stock.mjs:48:console.log('CLIP готов');
backend/prisma\retro-clean-stock.mjs:82:  !l.photoUrl.includes('aigen-') && // AI photos already CLIP-verified at creation
backend/prisma\schema.prisma:148:  imageEmbedding Float[]  @default([]) @map("image_embedding") // CLIP image embedding (photo recognition)
backend/prisma\schema.prisma:506:// (CLIP vector) to the item — the index literally learns from each choice, so
backend/prisma\verify-drinks.mjs:16:console.log('загружаю CLIP…');
backend/prisma\verify-drinks.mjs:19:const zs = await t.pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
backend/prisma\verify-drinks.mjs:21:console.log('CLIP готов');
backend/prisma\verify-photos.mjs:2:// CLIP zero-shot (local, ONNX): does the picture actually show THIS dish?
backend/prisma\verify-photos.mjs:5://      one (premium only: large size, landscape preferred);
backend/prisma\verify-photos.mjs:34:// ---- CLIP zero-shot (local) ----
backend/prisma\verify-photos.mjs:35:console.log('загружаю CLIP…');
backend/prisma\verify-photos.mjs:38:const zs = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
backend/prisma\verify-photos.mjs:39:console.log('CLIP готов');
backend/prisma\verify-photos.mjs:133:  const tooSmall = (cur.w ?? 0) < 600; // not premium → replace even if it matches
backend/prisma\verify-photos.mjs:141:  // current photo FAILED → hunt for a verified premium replacement
backend/prisma\menu-out\karavaevi.ru.json:10:      "name": "Детское комбо Гречка с куриной котлетой",
backend/prisma\menu-out\karavaevi.ru.json:15:      "name": "Детское комбо Рис с фрикадельками",
backend/prisma\menu-out\karavaevi.ru.json:20:      "name": "Детское комбо Картофельное пюре и шницель",
backend/prisma\menu-out\pizzapaolo.ru.json:250:      "name": "Акция: 3 пиццы-комбо (пепперони, 4 сыра, с грибами и ветчиной)",
backend/prisma\menu-out\pizzapaolo.ru.json:255:      "name": "Акция: 3 пиццы-комбо (пепперони, с грибами и ветчиной, с курицей)",
backend/prisma\menu-out\zotmanpizza.ru.json:170:      "name": "Студенческий набор | комбо  из 5 пицц",
backend/prisma\menu-out\zotmanpizza.ru.json:185:      "name": "Студенческий набор | комбо из 10 пицц",
backend/prisma/schema.prisma:79:  dislikes        Dislike[]
backend/prisma/schema.prisma:116:  @@map("dislikes")
backend/prisma/schema.prisma:248:  votes ReviewVote[]
backend/prisma/schema.prisma:265:  @@map("review_votes")
backend/prisma/schema.prisma:417:// vote/comment on my review, new follower, new post by someone I follow.
backend/prisma/schema.prisma:422:  kind      String // vote | comment | follow | friend_post
backend/src\game\game.service.ts:99:    // useful votes received across my reviews
backend/src\events\events.controller.ts:28:  @Get('mine')
backend/src\events\events.controller.ts:30:  async mine(@Req() req: any, @Query('take') take?: string) {
backend/src\listings\listings.controller.ts:185:  // smart personal feed (ratings + recent views + quiz − dislikes)
backend/src\recsys\recsys.service.ts:133:      const mine = await this.prisma.review.findMany({
backend/src\recsys\recsys.service.ts:137:      if (mine.length) {
backend/src\recsys\recsys.service.ts:138:        const avg = mine.reduce((s, r) => s + r.rating, 0) / mine.length;
backend/src\recsys\recsys.service.ts:160:   * profile (preferences.aiTaste — cuisines/loves boost, dislikes penalise),
backend/src\recsys\recsys.service.ts:174:    const dislikes: string[] = (ai.dislikes ?? []).map((s: string) => String(s).toLowerCase());
backend/src\recsys\recsys.service.ts:234:        for (const d of dislikes) if (hay.includes(d)) s -= 4;
backend/src\notifications\notifications.service.ts:5:// events — vote on my review, comment on my review, new follower, new post by
backend/src\notifications\notifications.service.ts:15:    kind: 'vote' | 'comment' | 'follow' | 'friend_post';
backend/src\reviews\reviews.service.ts:399:      voteCounts: vmap[r.id] ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
backend/src\reviews\reviews.service.ts:421:  /** Toggle a useful/funny/cool vote on a review, return fresh counts + mine. */
backend/src\reviews\reviews.service.ts:422:  async vote(userId: string, reviewId: string, type: VoteType) {
backend/src\reviews\reviews.service.ts:440:          kind: 'vote',
backend/src\reviews\reviews.service.ts:448:    return this.voteState(reviewId, userId);
backend/src\reviews\reviews.service.ts:451:  async voteState(reviewId: string, userId: string) {
backend/src\reviews\reviews.service.ts:452:    const votes = await this.prisma.reviewVote.findMany({
backend/src\reviews\reviews.service.ts:457:    const mine: string[] = [];
backend/src\reviews\reviews.service.ts:458:    for (const v of votes) {
backend/src\reviews\reviews.service.ts:460:      if (v.userId === userId) mine.push(v.type);
backend/src\reviews\reviews.service.ts:462:    return { counts, mine };
backend/src\listings\listings.service.ts:627:    const votes = await this.prisma.reviewVote.groupBy({
backend/src\listings\listings.service.ts:633:    for (const v of votes) {
backend/src\listings\listings.service.ts:654:    const mine = await this.prisma.review.findMany({
backend/src\listings\listings.service.ts:659:    for (const m of mine) {
backend/src\listings\listings.service.ts:784:      r.voteCounts = vmap[r.id] ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 };
backend/src\listings\listings.service.ts:967:    const [user, reviews, dislikes] = await Promise.all([
backend/src\listings\listings.service.ts:985:    for (const d of dislikes) bump(d.category, -2); // swiped away → penalise
backend/src\listings\listings.service.ts:987:    const exclude = [...new Set([...reviews.map((r) => r.listingId), ...dislikes.map((d) => d.itemId)])];
backend/src\listings\listings.service.ts:1572:    // attach vote counts (useful/funny/cool) to each review
backend/src\listings\listings.service.ts:1587:      voteCounts: vmap[r.id] ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
backend/src\listings\listings.service.ts:1592:        b.voteCounts.USEFUL - a.voteCounts.USEFUL ||
backend/src\reviews\reviews.controller.ts:26:  async mine(@Req() req: any) {
backend/src\reviews\reviews.controller.ts:37:  @Post('reviews/:id/vote')
backend/src\reviews\reviews.controller.ts:38:  async vote(@Req() req: any, @Param('id') id: string, @Body() body: { type: VoteType }) {
backend/src\reviews\reviews.controller.ts:40:    return this.reviews.vote(user.id, id, body.type);
backend/src\reviews\reviews.controller.ts:44:  @Get('reviews/:id/vote')
backend/src\reviews\reviews.controller.ts:45:  async voteState(@Req() req: any, @Param('id') id: string) {
backend/src\reviews\reviews.controller.ts:47:    return this.reviews.voteState(id, user.id);
frontend/src\types.ts:98:  voteCounts?: { USEFUL: number; FUNNY: number; COOL: number; OHNO: number };
frontend/src\types.ts:106:  kind: 'vote' | 'comment' | 'follow' | 'friend_post';
frontend/src\types.ts:120:  mine: VoteType[];
backend/src\social\social.service.ts:19:    const [reviews, followers, following, mine] = await Promise.all([
backend/src\social\social.service.ts:37:      isFollowing: !!mine,
backend/src\social\social.service.ts:188:      r.voteCounts = vmap[r.id] ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 };
frontend/src\api.ts:315:  vote: (reviewId: string, type: VoteType) =>
frontend/src\api.ts:316:    postJson<VoteState>(`/reviews/${reviewId}/vote`, { type }),
frontend/src\api.ts:317:  voteState: (reviewId: string) => getJson<VoteState>(`/reviews/${reviewId}/vote`),
frontend/src\api.ts:351:  myEvents: () => getJson<VenueEvent[]>('/events/mine'),
frontend/src\index.css:1442:.pp-votes {
frontend/src\index.css:1449:.pp-vote {
frontend/src\index.css:1460:.pp-vote.active {
frontend/src\index.css:1766:/* review vote buttons */
frontend/src\index.css:1767:.vote-row {
frontend/src\index.css:1773:.vote-btn {
frontend/src\index.css:1783:.vote-btn.active {
frontend/src\index.css:1789:.post .vote-row {
frontend/src\index.css:1794:.post .vote-btn {
frontend/src\index.css:3427:/* prominent rate CTA on a dish/drink card */
frontend/src\index.css:4923:.vote-btn,
frontend/src\tasting.ts:214:// it can't be determined. JS \b is ASCII-only, so short Cyrillic words use lookarounds.
frontend/src\screens\Alerts.tsx:7:const KIND_ICON: Record<string, string> = { vote: '👍', comment: '💬', follow: '➕', friend_post: '📝' };
frontend/src\components\FeedPost.tsx:32:export function FeedPost({
frontend/src\components\FeedPost.tsx:53:  const [vote, setVote] = useState<VoteState>({
frontend/src\components\FeedPost.tsx:54:    counts: review.voteCounts ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
frontend/src\components\FeedPost.tsx:55:    mine: [],
frontend/src\components\FeedPost.tsx:58:    api.vote(review.id, t).then(setVote).catch(() => {});
frontend/src\components\FeedPost.tsx:129:        <div className="vote-row" onClick={(e) => e.stopPropagation()}>
frontend/src\components\FeedPost.tsx:133:              className={'vote-btn' + (vote.mine.includes(t) ? ' active' : '')}
frontend/src\components\FeedPost.tsx:137:              {vote.counts[t] ? ` ${vote.counts[t]}` : ''}
frontend/src\screens\Home.tsx:8:import { FeedPost } from '../components/FeedPost';
frontend/src\screens\Home.tsx:840:                      <FeedPost
frontend/src\components\ListingDetail.tsx:291:  const [votes, setVotes] = useState<Record<string, VoteState>>({});
frontend/src\components\ListingDetail.tsx:589:  const voteState = (r: Review): VoteState =>
frontend/src\components\ListingDetail.tsx:590:    votes[r.id] ?? {
frontend/src\components\ListingDetail.tsx:591:      counts: r.voteCounts ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
frontend/src\components\ListingDetail.tsx:592:      mine: [],
frontend/src\components\ListingDetail.tsx:596:      .vote(reviewId, type)
frontend/src\components\ListingDetail.tsx:1378:                  <div className="vote-row">
frontend/src\components\ListingDetail.tsx:1380:                      const vs = voteState(r);
frontend/src\components\ListingDetail.tsx:1384:                          className={'vote-btn' + (vs.mine.includes(t) ? ' active' : '')}
frontend/src\components\ListingDetail.tsx:1498:                const rv: any = { voteCounts: { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 }, ...media.review };
frontend/src\components\PhotoPostModal.tsx:45:  const [vote, setVote] = useState<VoteState>({
frontend/src\components\PhotoPostModal.tsx:46:    counts: review.voteCounts ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
frontend/src\components\PhotoPostModal.tsx:47:    mine: [],
frontend/src\components\PhotoPostModal.tsx:66:    api.voteState(review.id).then(setVote).catch(() => {});
frontend/src\components\PhotoPostModal.tsx:70:  const doVote = (t: VoteType) => api.vote(review.id, t).then(setVote).catch(() => {});
frontend/src\components\PhotoPostModal.tsx:167:          <div className="pp-votes">
frontend/src\components\PhotoPostModal.tsx:171:                className={'pp-vote' + (vote.mine.includes(t) ? ' active' : '')}
frontend/src\components\PhotoPostModal.tsx:175:                {vote.counts[t] ? ` ${vote.counts[t]}` : ''}
frontend/src\components\ReviewCard.tsx:6:const REACTS: [keyof NonNullable<Review['voteCounts']>, string][] = [
frontend/src\components\ReviewCard.tsx:32:  const vc = review.voteCounts;

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content backend/prisma/regen-per-venue.mjs; Get-Content backend/prisma/menu-import.mjs -TotalCount 125; Get-Content backend/prisma/menu-import-remote.mjs -TotalCount 85; Get-Content backend/prisma/build-gen-todo.mjs; Get-Content backend/prisma/menu-pipeline.mjs' in D:\Приложения\Yelp
 succeeded in 774ms:
// PER-VENUE AI photos (owner rule 12.07.2026): each chain's own menu photo of a
// dish is the reference; we generate our OWN image from it and store it on that
// chain's menu links (menuLink.photoUrl). Same dish at a different chain в†’ a
// different photo. Rotating "РїРѕРїСЂРѕР±СѓР№С‚Рµ РІ" rotates the image.
//
// Keyed by (domain, dish name): all a chain's branches share the chain menu photo,
// so one generation fills every branch's link for that dish.
// Stages (onnx/sharp/spawn conflicts в†’ separate processes):
//   --stage-dl     from menu-out files: match (chain venues Г— dish) links, download
//                  the chain's menu photo to tools/sd/refv/<domain>__<slug>.png
//   --stage-gen    sd img2img per ref в†’ tools/sd/outv/<domain>__<slug>-<n>.png
//   --stage-check  CLIP-verify vs the dish name, upload, set menuLink.photoUrl for
//                  every link of that (domain, dish)
//   node prisma/regen-per-venue.mjs --stage-dl|--stage-gen|--stage-check [--limit N]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
process.env.DATABASE_URL = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim();
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

const STAGE = process.argv.includes('--stage-dl') ? 'dl' : process.argv.includes('--stage-gen') ? 'gen' : process.argv.includes('--stage-check') ? 'check' : null;
if (!STAGE) { console.log('--stage-dl | --stage-gen | --stage-check'); process.exit(1); }
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;
const SD = path.join(__dirname, '..', '..', 'tools', 'sd');
const REF = path.join(SD, 'refv');
const OUT = path.join(SD, 'outv');
fs.mkdirSync(REF, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
const MAP_FILE = path.join(__dirname, 'perv-map.json');
const DONE_FILE = path.join(__dirname, 'perv-done.json');
const ACCEPT = 0.5;
const norm = (s) => (s ?? '').toLowerCase().replace(/С‘/g, 'Рµ').replace(/[^a-zР°-СЏ0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
// the public DB proxy drops connections randomly (P1001) вЂ” retry, don't die mid-run
const retryDb = async (fn) => {
  for (let a = 1; a <= 6; a++) {
    try { return await fn(); } catch (e) {
      if (a === 6) throw e;
      console.log(`  db retry ${a}: ${String(e.message || '').split('\n').filter(Boolean).slice(-1)[0].slice(0, 60)}`);
      await new Promise((r) => setTimeout(r, a * 5000));
    }
  }
};
// ASCII-only key вЂ” sd-cli.exe cannot open Cyrillic file paths on Windows
const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h.toString(36); };
const key = (domain, name) => `${domain.replace(/[^a-z0-9]/gi, '').slice(0, 12)}_${hash(domain + '|' + norm(name))}`;

if (STAGE === 'dl') {
  const sharp = (await import('sharp')).default;
  let map = {};
  try { map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')); } catch { /* first run */ }
  let dl = 0, mapped = 0;
  for (const f of fs.readdirSync(path.join(__dirname, 'menu-out'))) {
    if (!f.endsWith('.json') || f.startsWith('_')) continue;
    const j = JSON.parse(fs.readFileSync(path.join(__dirname, 'menu-out', f), 'utf8'));
    const domain = (j.domain || f.replace('.json', '')).replace(/^www\./, '');
    const items = Array.isArray(j) ? j : (j.items ?? []);
    const withImg = items.filter((it) => it?.name && it?.image && /^https?:/.test(it.image));
    if (!withImg.length) continue;
    // this chain's venue ids
    const venues = await retryDb(() => p.listing.findMany({
      where: { type: 'RESTAURANT', website: { contains: domain } },
      select: { id: true },
    }));
    if (!venues.length) continue;
    const venueIds = venues.map((v) => v.id);
    for (const it of withImg) {
      const k = key(domain, it.name);
      // which catalog item(s) do this chain's links point at for this dish name?
      const links = await retryDb(() => p.menuLink.findMany({
        where: { venueId: { in: venueIds }, item: { name: { equals: it.name, mode: 'insensitive' } } },
        select: { venueId: true, itemId: true, photoUrl: true },
      }));
      if (!links.length) continue;
      mapped++;
      map[k] = { domain, name: it.name, image: it.image, links: links.map((l) => [l.venueId, l.itemId]) };
      if (fs.existsSync(path.join(REF, k + '.png'))) continue;
      try {
        const r = await fetch(it.image, { signal: AbortSignal.timeout(20000) });
        if (!r.ok) continue;
        const buf = Buffer.from(await r.arrayBuffer());
        // OWNER FRAMING RULE (12.07.2026): the dish fills ~75% of the frame and
        // sits slightly HIGH, so the card crop (top band) shows the food while the
        // lower part revealed on open is just background. Cover-crop keeps it large.
        await sharp(buf)
          .resize(512, 512, { fit: 'cover', position: 'top' })
          .png()
          .toFile(path.join(REF, k + '.png'));
        dl++;
        if (dl % 25 === 0) { fs.writeFileSync(MAP_FILE, JSON.stringify(map)); console.log(`  СЃРєР°С‡Р°РЅРѕ ${dl}`); }
      } catch { /* skip */ }
    }
  }
  fs.writeFileSync(MAP_FILE, JSON.stringify(map));
  console.log(`РС‚РѕРі (dl): (СЃРµС‚СЊГ—Р±Р»СЋРґРѕ)=${mapped}, СЂРµС„РѕРІ СЃРєР°С‡Р°РЅРѕ=${dl}, РІ РєР°СЂС‚Рµ=${Object.keys(map).length}`);
}

if (STAGE === 'gen') {
  const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
  let done = new Set();
  try { done = new Set(JSON.parse(fs.readFileSync(DONE_FILE, 'utf8'))); } catch { /* none */ }
  let n = 0;
  for (const k of Object.keys(map)) {
    if (done.has(k)) continue;
    if (n >= LIMIT) break;
    const ref = `refv/${k}.png`;
    if (!fs.existsSync(path.join(SD, ref))) continue;
    let made = 0;
    for (let a = 0; a < 2; a++) {
      const outRel = `outv/${k}-${a}.png`;
      if (fs.existsSync(path.join(SD, outRel))) { made++; continue; }
      try {
        // OWNER RULE 16.07.2026: strength 0.2 вЂ” the copy stays maximally faithful
        // to the official reference (0.45 mutated strawberries into raspberries,
        // 0.35 turned a wok pasta into a soup); we only "re-shoot", not re-invent
        execFileSync('./sd-cli.exe', [
          '-m', 'sd_turbo.safetensors', '-i', ref, '--strength', '0.2',
          '--steps', '6', '--cfg-scale', '1.0', '-W', '512', '-H', '512',
          '-s', String(3000 + a * 555), '-o', outRel,
          '-p', `professional food photography, the dish fills most of the frame in the upper part, appetizing, natural light, soft blurred background below, high detail`,
        ], { stdio: 'pipe', timeout: 300000, cwd: SD });
        made++;
      } catch (e) { console.log(`gen FAIL ${k} #${a}: ${String(e.message || '').slice(0, 70)}`); }
    }
    if (made) { n++; if (n % 20 === 0) console.log(`  gen ${n}`); }
  }
  console.log(`РС‚РѕРі (gen): РѕР±СЂР°Р±РѕС‚Р°РЅРѕ=${n}`);
}

if (STAGE === 'check') {
  const aws = await import('@aws-sdk/client-s3');
  // railway CLI hits backboard over the network вЂ” transient resets (10054) killed
  // whole runs before, so retry with backoff instead of dying on the first drop
  let creds = null;
  for (let att = 1; att <= 5; att++) {
    try {
      creds = JSON.parse(execSync('railway bucket credentials --bucket uploads --json', { cwd: path.join(__dirname, '..', '..'), encoding: 'utf8' }));
      break;
    } catch (e) {
      console.log(`bucket credentials attempt ${att}/5 failed: ${String(e.message || '').split('\n')[0].slice(0, 90)}`);
      if (att === 5) throw e;
      await new Promise((r) => setTimeout(r, att * 5000));
    }
  }
  const s3 = new aws.S3Client({
    endpoint: creds.endpoint, region: creds.region,
    credentials: { accessKeyId: creds.accessKeyId, secretAccessKey: creds.secretAccessKey },
    forcePathStyle: creds.urlStyle !== 'virtual-host',
  });
  console.log('Р·Р°РіСЂСѓР¶Р°СЋ CLIPвЂ¦');
  const t = await import('@xenova/transformers');
  t.env.cacheDir = path.join(__dirname, '..', '.models-cache');
  // ONE vision tower (feature-extraction) + text tower for labels вЂ” the zero-shot
  // pipeline would load a second full vision copy (OOM lesson). Embeddings let us
  // also verify the result against the official REFERENCE, not just the name.
  const MODEL = 'Xenova/clip-vit-base-patch32';
  const embedder = await t.pipeline('image-feature-extraction', MODEL);
  const { RawImage, AutoTokenizer, CLIPTextModelWithProjection } = t;
  const tokenizer = await AutoTokenizer.from_pretrained(MODEL);
  const textModel = await CLIPTextModelWithProjection.from_pretrained(MODEL);
  const textVecCache = new Map();
  async function textVecs(labels) {
    const ck = labels.join('|');
    if (textVecCache.has(ck)) return textVecCache.get(ck);
    const { text_embeds } = await textModel(tokenizer(labels, { padding: true, truncation: true }));
    const [nn, dim] = text_embeds.dims;
    const vecs = [];
    for (let i = 0; i < nn; i++) {
      const v = Array.from(text_embeds.data.slice(i * dim, (i + 1) * dim));
      const nrm = Math.hypot(...v) || 1;
      vecs.push(v.map((x) => x / nrm));
    }
    textVecCache.set(ck, vecs);
    return vecs;
  }
  const cos = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  async function embedFile(file) {
    const img = await RawImage.fromBlob(new Blob([new Uint8Array(fs.readFileSync(file))]));
    const out = await embedder(img, { pooling: 'mean', normalize: true });
    const v = Array.from(out.data);
    const nrm = Math.hypot(...v) || 1; // pipeline output is NOT unit-length вЂ” normalize
    return v.map((x) => x / nrm);
  }
  // softmax over cosine sims Г—100 (CLIP logit scale) вЂ” same math as the backend
  function textScore(imgVec, vecs) {
    const logits = vecs.map((v) => cos(imgVec, v) * 100);
    const mx = Math.max(...logits);
    const exps = logits.map((l) => Math.exp(l - mx));
    return exps[0] / exps.reduce((a, b) => a + b, 0);
  }
  const REF_SIM = 0.82; // generated image must stay CLOSE to the official reference
  console.log('CLIP РіРѕС‚РѕРІ');
  // dish english labels from gen-todo (best-effort)
  let enByName = {};
  try { for (const m of JSON.parse(fs.readFileSync(path.join(__dirname, 'gen-todo.json'), 'utf8')).mismatches) enByName[norm(m.name)] = m.en; } catch { /* fine */ }

  const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
  let done = new Set();
  try { done = new Set(JSON.parse(fs.readFileSync(DONE_FILE, 'utf8'))); } catch { /* none */ }
  let up = 0, skip = 0, n = 0;
  for (const k of Object.keys(map)) {
    if (done.has(k)) continue;
    if (n >= LIMIT) break;
    const m = map[k];
    const en = enByName[norm(m.name)] ?? 'restaurant plated dish';
    const labels = await textVecs([`a photo of ${en}`, 'a photo of an unrelated object or scene']);
    // the official reference embedding вЂ” the generated shot must stay close to it
    let refVec = null;
    const refFile = path.join(REF, `${k}.png`);
    if (fs.existsSync(refFile)) { try { refVec = await embedFile(refFile); } catch { /* no ref check */ } }
    let best = null;
    for (let a = 0; a < 2; a++) {
      const file = path.join(OUT, `${k}-${a}.png`);
      if (!fs.existsSync(file)) continue;
      try {
        const imgVec = await embedFile(file);
        const s = textScore(imgVec, labels);
        const refSim = refVec ? cos(imgVec, refVec) : null;
        if (!best || s + (refSim ?? 0) > best.s + (best.refSim ?? 0)) best = { s, refSim, file };
      } catch { /* skip variant */ }
    }
    if (!best) continue;
    n++;
    if (best.s < ACCEPT || (best.refSim != null && best.refSim < REF_SIM)) {
      skip++;
      if (best.refSim != null && best.refSim < REF_SIM) console.log(`  reject ${m.name}: СѓС€Р»Рѕ РѕС‚ СЂРµС„РµСЂРµРЅСЃР° (sim=${best.refSim.toFixed(2)})`);
      continue;
    }
    const keyName = `aigen-${randomUUID()}`;
    try {
      await s3.send(new aws.PutObjectCommand({ Bucket: creds.bucketName, Key: keyName, Body: fs.readFileSync(best.file), ContentType: 'image/png' }));
      const url = `/api/files/${keyName}`;
      // set on EVERY link of this (chain Г— dish)
      for (const [venueId, itemId] of m.links) {
        await retryDb(() => p.menuLink.update({ where: { venueId_itemId: { venueId, itemId } }, data: { photoUrl: url } })).catch(() => {});
      }
      done.add(k);
      up++;
      if (up % 20 === 0) { fs.writeFileSync(DONE_FILE, JSON.stringify([...done])); console.log(`  Р·Р°Р»РёС‚Рѕ ${up}`); }
    } catch (e) { console.log(`upload FAIL ${k}: ${String(e.message || '').slice(0, 70)}`); }
  }
  fs.writeFileSync(DONE_FILE, JSON.stringify([...done]));
  console.log(`РС‚РѕРі (check): Р·Р°Р»РёС‚Рѕ=${up} РЅРµ РїСЂРѕС€Р»Рѕ=${skip} РѕР±СЂР°Р±РѕС‚Р°РЅРѕ=${n}`);
}
await p.$disconnect();
// Imports extracted chain menus (prisma/menu-out/<domain>.json) into the catalog.
// A chain shares one menu, so each item is linked to ALL the chain's venues
// (matched by website host), with the price stored on the menu link.
//
//   node prisma/menu-import.mjs <domain...> [--pending]
// Default status APPROVED (authoritative chain data в†’ usable immediately).
// Tagged with source='menu-import' + logged to menu-out/_import-log.json for undo.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'menu-out');

// JS \b is ASCII-only (breaks on Cyrillic) в†’ use explicit Cyrillic/Latin boundaries.
const B = (w) => `(?<![Р°-СЏС‘a-z])(?:${w})(?![Р°-СЏС‘a-z])`;
const DRINK_RE = new RegExp([
  'Р»Р°С‚С‚Рµ', 'РєР°РїСѓС‡РёРЅ', 'СЌСЃРїСЂРµСЃСЃРѕ', 'Р°РјРµСЂРёРєР°РЅРѕ', 'РєР°РєР°Рѕ', 'РјР°С‚С‡', 'С‚РѕРЅРёРє', 'Р»РёРјРѕРЅР°Рґ', 'СЃРјСѓР·Рё', 'РґР¶СѓСЃ', 'juice',
  'РјРѕСЂСЃ', 'РєРѕРјРїРѕС‚', 'РєРѕРєС‚РµР№Р»', 'РіР»РёРЅС‚РІРµР№РЅ', 'Р±Р°РјР±Р»', 'С„Р»СЌС‚.?СѓР°Р№С‚', 'РєРѕР»Рґ.?Р±СЂСЋ', 'С„СЂР°РїРїРµ', 'РіР»СЏСЃРµ', 'РјРёР»РєС€РµР№Рє',
  'РЅР°РїРёС‚РѕРє', 'Р°Р№СЃ.?Р»Р°С‚С‚Рµ', 'Р°Р№СЃС‚Рё', 'Р°Р№СЃ.?С‚Рё', 'ice.?tea', 'Р°Р№СЃ.?РєРѕС„Рµ', 'РјРѕРєРєРѕ', 'РјРѕРєРєР°', 'РєРѕСЂС‚Р°РґРѕ', 'РїРёРєРєРѕР»Рѕ',
  'С‡РёРЅРѕ', 'РјР°СЂС€РјРµР»Р»РѕСѓ', 'РїСѓРЅС€', 'РіР°Р·РёСЂРѕРІ', 'РјРёРЅРµСЂР°Р»', 'Р±РѕСЂР¶РѕРјРё', 'РЅР°СЂР·Р°РЅ', 'РґРѕР±СЂС‹Р№', 'С„Р°РЅС‚Р°', 'СЃРїСЂР°Р№С‚', 'РїРµРїСЃРё',
  'С€РІРµРїСЃ', 'СЌРЅРµСЂРіРµС‚', 'red.?bull', 'milkis', 'РјРёСЂРёРЅРґР°', 'Р±Р°Р№РєР°Р»', 'С‚Р°СЂС…СѓРЅ', 'РґСЋС€РµСЃ',
  B('РєРѕС„Рµ'), B('СЂР°С„'), B('С‡Р°Р№'), B('СЃРѕРє'), B('РІРёРЅРѕ'), B('РїРёРІРѕ'), B('РІРѕРґР°'), B('РєРѕР»Р°'), B('С€РµР№Рє'), B('СЌР»СЊ'),
  B('tea'), B('coffee'), B('latte'), B('juice'), B('wine'), B('beer'), // English drink words in brand names (Rich Tea, Stars CoffeeвЂ¦)
].join('|'), 'i');
// alcohol в†’ a proper category so the recsys filter (which excludes РїРёРІРѕ/РІРёРЅРѕ/РєРѕРєС‚РµР№Р»Рё/
// РєСЂРµРїРєРёРµ by category) actually catches it. Checked BEFORE the generic drink branch.
const WINE_RE = new RegExp(['РІРёРЅРѕ', 'С€Р°СЂРґРѕРЅРµ', 'РєР°Р±РµСЂРЅРµ', 'РјРµСЂР»Рѕ', 'СЃРѕРІРёРЅСЊРѕРЅ', 'РїСЂРѕСЃРµРєРєРѕ', 'РёРіСЂРёСЃС‚', 'СЂРёСЃР»РёРЅРі', B('РїРёРЅРѕ'), 'СЃР°РЅРґР¶РѕРІРµР·Рµ', 'РјР°Р»СЊР±РµРє', 'Р»Р°РјР±СЂСѓСЃРєРѕ', 'РїРѕСЂС‚РІРµР№РЅ', 'С€Р°РјРїР°РЅСЃРє', 'РїСЂРѕСЃРµРє', 'sauvignon', 'savignon', 'chardonnay', 'merlot', 'cabernet', 'riesling', B('blanc'), B('rose')].join('|'), 'i');
const BEER_RE = new RegExp(['РїРёРІРѕ', 'Р»Р°РіРµСЂ', B('СЌР»СЊ'), B('ipa'), 'РёРїР°', 'СЃС‚Р°СѓС‚', 'РїРѕСЂС‚РµСЂ', 'РїРёР»СЃРЅРµСЂ', B('РІР°Р№СЃ'), 'СЃРёРґСЂ', 'С…СѓРіР°СЂРґРµРЅ', 'РіРёРЅРЅРµСЃ'].join('|'), 'i');
const SPIRIT_RE = new RegExp(['РІРёСЃРєРё', 'РІРѕРґРє', B('СЂРѕРј'), B('РґР¶РёРЅ'), 'С‚РµРєРёР»', 'РєРѕРЅСЊСЏРє', 'Р»РёРєС‘СЂ', 'Р»РёРєРµСЂ', 'Р±СЂРµРЅРґРё', 'РІРµСЂРјСѓС‚', 'РєР°РјРїР°СЂРё', 'СЃР°РјР±СѓРєР°', 'Р°Р±СЃРµРЅС‚', 'РіСЂР°РїРїР°', 'РєР°Р»СЊРІР°РґРѕСЃ', B('РјР°СЂС‚РёРЅРё'), B('СЃР°РєРµ')].join('|'), 'i');
// note: NOT "РјР°СЂРіР°СЂРёС‚" (collides with РњР°СЂРіР°СЂРёС‚Р° pizza) вЂ” only explicit cocktails
const COCKTAIL_RE = new RegExp(['РєРѕРєС‚РµР№Р»', 'РјРѕС…РёС‚Рѕ', 'РЅРµРіСЂРѕРЅРё', 'СЃРїСЂРёС‚С†', 'Р°РїРµСЂРѕР»СЊ', 'РґР°Р№РєРёСЂРё', 'РєРѕСЃРјРѕРїРѕР»РёС‚', 'b52', 'Р»РѕРЅРі.?Р°Р№Р»РµРЅРґ', 'РїРёРЅР°.?РєРѕР»Р°РґР°', 'РєСЂРѕРІР°РІР°СЏ РјСЌСЂРё'].join('|'), 'i');
const MILKSHAKE_RE = new RegExp(['РјРёР»РєС€РµР№Рє', 'РјРѕР»РѕС‡РЅ.{0,5}РєРѕРєС‚РµР№Р»', B('С€РµР№Рє'), 'С„СЂР°РїРїРµ'].join('|'), 'i');
// strong food words в†’ it's a dish even if the name mentions "РЅР°РїРёС‚РѕРє" (combos like "РџРёС†С†Р° Рё РЅР°РїРёС‚РѕРє")
const FOOD_OVERRIDE = /РїРёС†С†|Р±СѓСЂРіРµСЂ|СЃР°Р»Р°С‚|СЂРѕР»Р»|СЃРїР°РіРµС‚С‚Рё|С€Р°СѓСЂРј|С€Р°РІРµСЂРј|СЃС‚РµР№Рє|СЃСЌРЅРґРІРёС‡|СЃРµРЅРґРІРёС‡|РґРѕРЅРµСЂ|РєРµР±Р°Р±|\bСЃСѓРї\b|РЅР°РіРіРµС‚СЃ|РєР°СЂС‚РѕС„|С…Р°С‡Р°РїСѓСЂ|С…РёРЅРєР°Р»|\bРІРѕРє\b|Р±РѕСѓР»|РїРѕРєРµ|С‚РѕРј.?СЏРј|Р»Р°Р·Р°РЅСЊ|СЂРёР·РѕС‚С‚Рѕ|РєР°СЂР±РѕРЅР°СЂ|Р±РѕР»РѕРЅСЊРµ|С‚РѕСЃС‚|Р±СЂСѓСЃРєРµС‚С‚|СЃС‹СЂРЅРёРє|Р±Р»РёРЅ|РїР°СЃС‚/i;
export function classify(name) {
  const n = name.toLowerCase();
  if (MILKSHAKE_RE.test(n)) return { type: 'DRINK', category: 'РЎРјСѓР·Рё' }; // milkshake в‰  alcohol cocktail
  // filter/specialty coffee (coffeemania "hoop", Sber filter, pour-over, origins) в†’ DRINK/РљРѕС„Рµ
  if (/\bhoop\b|РїСѓСЂРѕРІРµСЂ|РїСѓСЂ.?РѕРІРµСЂ|С„РёР»СЊС‚СЂ.?РєРѕС„Рµ|Р°СЌСЂРѕРїСЂРµСЃСЃ|РєРµРјРµРєСЃ|\bv60\b|РґСЂРёРї.?РїР°РєРµС‚/i.test(n) ||
      (/С„РёР»СЊС‚СЂ/i.test(n) && /СЌС„РёРѕРї|Р№РµРјРµРЅ|РєРѕР»СѓРјР±|РєРµРЅРё|Р±СЂР°Р·РёР»|РіРІР°С‚РµРјР°Р»|РєРѕСЃС‚.?СЂРёРє|\bРїРµСЂСѓ\b|РЅРёРєР°СЂР°РіСѓР°/i.test(n))) {
    return { type: 'DRINK', category: 'РљРѕС„Рµ' };
  }
  if (WINE_RE.test(n)) return { type: 'DRINK', category: 'Р’РёРЅРѕ' };
  if (BEER_RE.test(n)) return { type: 'DRINK', category: 'РџРёРІРѕ' };
  if (SPIRIT_RE.test(n)) return { type: 'DRINK', category: 'РљСЂРµРїРєРёРµ РЅР°РїРёС‚РєРё' };
  if (COCKTAIL_RE.test(n)) return { type: 'DRINK', category: 'РљРѕРєС‚РµР№Р»Рё' };
  if (!FOOD_OVERRIDE.test(n) && DRINK_RE.test(n)) {
    let c = 'РќР°РїРёС‚РєРё';
    if (new RegExp(['РєРѕС„Рµ', 'Р»Р°С‚С‚Рµ', 'РєР°РїСѓС‡РёРЅ', 'СЌСЃРїСЂРµСЃСЃРѕ', 'Р°РјРµСЂРёРєР°РЅРѕ', B('СЂР°С„'), 'С„Р»СЌС‚', 'РєРѕР»Рґ.?Р±СЂСЋ', 'РјРѕРєРєРѕ', 'РјРѕРєРєР°', 'РєРѕСЂС‚Р°РґРѕ', 'РїРёРєРєРѕР»Рѕ', 'Р±Р°РјР±Р»', 'Р°Р№СЃ.?Р»Р°С‚С‚Рµ', 'РіР»СЏСЃРµ', 'Р°Р№СЃ.?РєРѕС„Рµ', B('coffee'), B('latte'), B('espresso')].join('|'), 'i').test(n)) c = 'РљРѕС„Рµ';
    else if (new RegExp([B('С‡Р°Р№'), 'РјР°С‚С‡', 'СѓР»СѓРЅ', 'РїСѓСЌСЂ', 'Р°Р№СЃС‚Рё', 'Р°Р№СЃ.?С‚Рё', 'ice.?tea', B('tea')].join('|'), 'i').test(n)) c = 'Р§Р°Р№';
    else if (/РєРѕРєС‚РµР№Р»/.test(n)) c = 'РљРѕРєС‚РµР№Р»Рё';
    else if (new RegExp(['СЃРјСѓР·Рё', B('С€РµР№Рє'), 'РјРёР»РєС€РµР№Рє', 'С„СЂР°РїРїРµ'].join('|'), 'i').test(n)) c = 'РЎРјСѓР·Рё';
    else if (new RegExp(['Р»РёРјРѕРЅР°Рґ', B('СЃРѕРє'), 'РґР¶СѓСЃ', 'juice', 'РјРѕСЂСЃ', 'РєРѕРјРїРѕС‚', 'С‚РѕРЅРёРє', B('РІРѕРґР°'), B('РєРѕР»Р°')].join('|'), 'i').test(n)) c = 'Р‘РµР·Р°Р»РєРѕРіРѕР»СЊРЅС‹Рµ';
    return { type: 'DRINK', category: c };
  }
  let c = 'Р‘Р»СЋРґРѕ';
  if (/РїРёС†С†/.test(n)) c = 'РџРёС†С†Р°';
  else if (/Р±СѓСЂРіРµСЂ|С‡РёР·Р±СѓСЂРіРµСЂ/.test(n)) c = 'Р‘СѓСЂРіРµСЂС‹';
  else if (/РїР°СЃС‚|СЃРїР°РіРµС‚С‚Рё|РєР°СЂР±РѕРЅР°СЂ|Р±РѕР»РѕРЅСЊРµ|Р»Р°Р·Р°РЅСЊ/.test(n)) c = 'РџР°СЃС‚Р°';
  else if (/СЃСѓС€Рё|СЂРѕР»Р»|СЃР°С€РёРјРё|РїРѕРєРµ/.test(n)) c = 'РЇРїРѕРЅСЃРєР°СЏ';
  else if (/СЃР°Р»Р°С‚|С†РµР·Р°СЂСЊ/.test(n)) c = 'РЎР°Р»Р°С‚С‹';
  else if (/\bСЃСѓРї\b|С‚РѕРј.?СЏРј|Р±РѕСЂС‰/.test(n)) c = 'РЎСѓРїС‹';
  else if (/РґРµСЃРµСЂС‚|С‚РѕСЂС‚|С‡РёР·РєРµР№Рє|С‚РёСЂР°РјРёСЃСѓ|РјР°С„С„РёРЅ|РєСЂСѓР°СЃСЃР°РЅ|С€С‚СЂСѓРґРµР»СЊ|РјРѕСЂРѕР¶Рµ|РїР°РЅРЅР°/.test(n)) c = 'Р”РµСЃРµСЂС‚С‹';
  else if (/РєР°СЂС‚РѕС„|РЅР°РіРіРµС‚СЃ|СЃС‚СЂРёРїСЃ|С‚РІРёСЃС‚РµСЂ|С€Р°СѓСЂРј|С…РѕС‚.?РґРѕРі|С„СЂРё/.test(n)) c = 'Р¤Р°СЃС‚С„СѓРґ';
  else if (/СЃС‚РµР№Рє|СЂРёР±Р°Р№|РјРёРЅСЊРѕРЅ/.test(n)) c = 'РЎС‚РµР№РєРё';
  return { type: 'DISH', category: c };
}

// normalize a menu name: strip codes, marketing noise, and вЂ” importantly вЂ” SIZE/VOLUME
// so "Р›Р°С‚С‚Рµ 300 РјР»" and "Р›Р°С‚С‚Рµ 400 РјР»" collapse to one item "Р›Р°С‚С‚Рµ" (find-or-create
// dedups them). Flavor variants ("Р›Р°С‚С‚Рµ РњР°С‚С‡Р°", "Р›Р°С‚С‚Рµ РЎРёРЅРіР°РїСѓСЂ") are kept.
function sanitizeName(name) {
  let n = name
    .replace(/\s*\[[^\]]*\]/g, '') // [AT], [NEW] вЂ¦
    .replace(/\s*\((?:Рј3|m3|Р·РѕРЅР° ?\d|РЅРѕС‡РЅ[Р°-СЏ]*)\)/gi, '');
  // JS \b is ASCII-only (fails after Cyrillic letters) в†’ use Cyrillic-safe lookaheads
  n = n.replace(/\s*\d+([.,]\d+)?\s?(РјР»|ml|Р»РёС‚СЂ|Р»|l|РіСЂ|Рі|g)(?![Р°-СЏС‘a-z])\.?/gi, ' '); // "300 РјР»", "0,5 Р»"
  n = n.replace(/\s*\d+\s?С€С‚(?![Р°-СЏС‘])\.?/gi, ' ').replace(/\s*[xС…]\s?\d+(?![\dР°-СЏС‘a-z])/gi, ' '); // "2 С€С‚", "x2"
  n = n.replace(/\s+(РіСЂР°РЅРґРµ|РІРµРЅС‚Рё|grande|venti|tall|Р±РѕР»СЊС€РѕР№|Р±РѕР»СЊС€(?:Р°СЏ|РѕРµ)|СЃСЂРµРґРЅ(?:РёР№|СЏСЏ|РµРµ)|РјР°Р»РµРЅСЊРє\w+|РјР°Р»(?:С‹Р№|Р°СЏ))(?![Р°-СЏС‘])/gi, ' ');
  n = n.replace(/\s+(xl|xxl|[sml])\s*$/i, ''); // trailing standalone size letter
  return n.replace(/\s+/g, ' ').trim();
}
// skip non-dish noise the engine sometimes catches (combos / banners / sets / descriptions)
function isJunk(name) {
  const n = name.toLowerCase();
  if (n.length < 2 || n.length > 55) return true;
  if (n.split(/\s+/).length > 7) return true; // a sentence/description, not a menu name
  if (/^\d+\s*(Р»СЋР±С‹Рµ|РїРёС†С†|С€С‚СѓРє|С€С‚\b)/.test(n)) return true; // "3 Р»СЋР±С‹Рµ РїРёС†С†С‹"
  if (/Р»СЋР±С‹Рµ РїРёС†С†|РєРѕРјР±Рѕ|\bСЃРµС‚\b|\bРЅР°Р±РѕСЂ\b|РјРµРЅСЋ РґРЅСЏ|Р·Р° \d+\s*в‚Ѕ|РІС‹РіРѕРґРЅ|РїРѕРґР°СЂРѕРє|РєРѕРЅСЃС‚СЂСѓРєС‚РѕСЂ|СЃРѕР±РµСЂРё|Р°РєС†Рё|СЃРєРёРґРє|СЃРµСЂС‚РёС„РёРєР°С‚|РґРѕСЃС‚Р°РІРє|РґР»СЏ РѕС„РёСЃР°|РёРґРµР°Р»СЊРЅС‹С…|\+ ?\d|\d ?\+ ?\d/.test(n)) return true;
  // OWNER RULE (13.07.2026): a SINGLE adjective is not a dish name ("РњР°Р»РёРЅРѕРІС‹Р№",
  // "РЎС‹СЂРЅС‹Р№", "Р’Р°РЅРёР»СЊРЅС‹Р№") вЂ” it's missing the noun. Reject one-word names that
  // are just an adjective (Russian adjective endings).
  const words = n.split(/\s+/).filter(Boolean);
  if (words.length === 1 && /(С‹Р№|РёР№|РѕР№|Р°СЏ|СЏСЏ|РѕРµ|РµРµ|С‹Рµ|РёРјРё|РѕРіРѕ|РѕСЃРЅ?С‹Р№)$/.test(words[0]) && words[0].length >= 5) return true;
  // mostly non-letters (codes/garbage)
  const letters = (n.match(/[Р°-СЏС‘a-z]/gi) || []).length;
  if (letters < n.length * 0.5) return true;
  return false;
}

// mass fast-food chains the owner doesn't want in the catalog вЂ” skipped on parse
const FASTFOOD_BLOCK = /burgerking|burger.?king|Р±СѓСЂРіРµСЂ.?РєРёРЅРі|vkusnoitochka|РІРєСѓСЃРЅРѕ.?Рё.?С‚РѕС‡РєР°|rostics|rostic|СЂРѕСЃС‚РёРєСЃ|kfc|РјР°РєРґРѕ|mcdonald|РґРѕРґРѕ.?СЌРєСЃРїСЂРµСЃСЃ|subway|СЃР°Р±РІСЌР№|carls|hesburger|С‚РµСЂРµРјРѕРє|РєСЂРѕС€РєР°.?РєР°СЂС‚РѕС€РєР°|СЃС‚Р°СЂРґРѕРі|stardog/i;

async function undo() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  // delete every menu link this import created (incl. links to pre-existing items)вЂ¦
  const logPath = path.join(OUT, '_import-log.json');
  if (fs.existsSync(logPath)) {
    const log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    let n = 0;
    for (const [venueId, itemId] of log.links || []) {
      await prisma.menuLink.delete({ where: { venueId_itemId: { venueId, itemId } } }).catch(() => {});
      n++;
    }
    console.log(`removed ${n} logged menu links`);
  }
  // вЂ¦then delete every item the import created (cascades any remaining links)
  const del = await prisma.listing.deleteMany({ where: { source: 'menu-import' } });
  console.log(`deleted ${del.count} imported items. Undo complete.`);
  await prisma.$disconnect();
}

async function main() {
  const args = process.argv.slice(2);
// Remote-DB-friendly chain-menu import: same semantics as menu-import.mjs but BATCHED
// (createMany + a handful of queries per domain) so it survives the Railway proxy вЂ”
// the per-link upsert loop of the original dies with P1017 over high-latency links.
// Venue matching: website host OR brand-name patterns (some venues have no website).
//
//   DATABASE_URL=<railway> node prisma/menu-import-remote.mjs --all | <domain...>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify } from './menu-import.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'menu-out');
if (!process.env.DATABASE_URL) {
  const f = path.join(__dirname, '..', '.railway-db-url');
  if (fs.existsSync(f)) process.env.DATABASE_URL = fs.readFileSync(f, 'utf8').trim();
}
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

// brand-name fallbacks for venues that lost/never had a website
const BRANDS = {
  'dodopizza.ru': ['РґРѕРґРѕ', 'dodo'],
  'coffeemania.ru': ['РєРѕС„РµРјР°РЅРёСЏ', 'coffeemania'],
  'cofix.global': ['cofix', 'РєРѕС„РёРєСЃ'],
  'burgerkingrus.ru': ['Р±СѓСЂРіРµСЂ РєРёРЅРі', 'burger king'],
  'rostics.ru': ["rostic", 'СЂРѕСЃС‚РёРє'],
  'papajohns.ru': ["papa john", 'РїР°РїР° РґР¶РѕРЅСЃ'],
  'dominopizza.ru': ['domino', 'РґРѕРјРёРЅРѕ РїРёС†С†'],
  'onepricecoffee.com': ['one price'],
  'shoko.ru': ['С€РѕРєРѕР»Р°РґРЅРёС†Р°'],
};

// copied from menu-import.mjs (not exported there)
function sanitizeName(name) {
  let n = name
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/\s*\((?:Рј3|m3|Р·РѕРЅР° ?\d|РЅРѕС‡РЅ[Р°-СЏ]*)\)/gi, '');
  n = n.replace(/\s*\d+([.,]\d+)?\s?(РјР»|ml|Р»РёС‚СЂ|Р»|l|РіСЂ|Рі|g)(?![Р°-СЏС‘a-z])\.?/gi, ' ');
  n = n.replace(/\s*\d+\s?С€С‚(?![Р°-СЏС‘])\.?/gi, ' ').replace(/\s*[xС…]\s?\d+(?![\dР°-СЏС‘a-z])/gi, ' ');
  n = n.replace(/\s+(РіСЂР°РЅРґРµ|РІРµРЅС‚Рё|grande|venti|tall|Р±РѕР»СЊС€РѕР№|Р±РѕР»СЊС€(?:Р°СЏ|РѕРµ)|СЃСЂРµРґРЅ(?:РёР№|СЏСЏ|РµРµ)|РјР°Р»РµРЅСЊРє\w+|РјР°Р»(?:С‹Р№|Р°СЏ))(?![Р°-СЏС‘])/gi, ' ');
  n = n.replace(/\s+(xl|xxl|[sml])\s*$/i, '');
  return n.replace(/\s+/g, ' ').trim();
}
function isJunk(name) {
  const n = name.toLowerCase();
  if (n.length < 2 || n.length > 55) return true;
  if (n.split(/\s+/).length > 7) return true;
  if (/^\d+\s*(Р»СЋР±С‹Рµ|РїРёС†С†|С€С‚СѓРє|С€С‚\b)/.test(n)) return true;
  if (/Р»СЋР±С‹Рµ РїРёС†С†|РєРѕРјР±Рѕ|\bСЃРµС‚\b|\bРЅР°Р±РѕСЂ\b|РјРµРЅСЋ РґРЅСЏ|Р·Р° \d+\s*в‚Ѕ|РІС‹РіРѕРґРЅ|РїРѕРґР°СЂРѕРє|РєРѕРЅСЃС‚СЂСѓРєС‚РѕСЂ|СЃРѕР±РµСЂРё|Р°РєС†Рё|СЃРєРёРґРє|СЃРµСЂС‚РёС„РёРєР°С‚|РґРѕСЃС‚Р°РІРє|РґР»СЏ РѕС„РёСЃР°|РёРґРµР°Р»СЊРЅС‹С…|\+ ?\d|\d ?\+ ?\d/.test(n)) return true;
  const letters = (n.match(/[Р°-СЏС‘a-z]/gi) || []).length;
  if (letters < n.length * 0.5) return true;
  return false;
}

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const domains = process.argv.includes('--all')
  ? fs.readdirSync(OUT).filter((f) => f.endsWith('.json') && f !== '_import-log.json')
      .map((f) => { try { const j = JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')); return (j.count ?? 0) >= 5 ? j.domain : null; } catch { return null; } })
      .filter(Boolean)
  : args;

for (const domain of domains) {
  const file = path.join(OUT, domain.replace(/[^\w.-]/g, '_') + '.json');
  if (!fs.existsSync(file)) { console.log(`${domain}: no extract, skip`); continue; }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!data.items?.length) { console.log(`${domain}: empty, skip`); continue; }

  // venues: by website host OR brand name
  const host = domain.replace(/^www\./, '');
  const brand = BRANDS[domain] ?? [];
  const venues = await p.listing.findMany({
    where: {
      type: 'RESTAURANT',
      OR: [
        { website: { contains: host } },
        ...brand.map((b) => ({ name: { contains: b, mode: 'insensitive' } })),
      ],
    },
    select: { id: true },
  });
  if (!venues.length) { console.log(`${domain}: no venues, skip`); continue; }

  // prepare items in memory (dedup by type+lower(name))
  const wanted = new Map(); // key type|lower в†’ {type,name,category,photoUrl,price}
// Builds prisma/gen-todo.json вЂ” every DISH/DRINK with NO photo, each with a
// proper English SD/CLIP prompt (dictionary в†’ qwen в†’ category hint). The
// generate-missing-photos.mjs stages then work through this list.
//   node prisma/build-gen-todo.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.DATABASE_URL = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim();
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

const DICT = [
  [/РїРµР»СЊРјРµРЅ/i, 'pelmeni russian dumplings'], [/СЃС‹СЂРЅРёРє/i, 'syrniki cottage cheese pancakes'],
  [/Р±РѕСЂС‰/i, 'borscht beet soup with sour cream'], [/Р±Р»РёРЅ/i, 'russian crepes blini'],
  [/РѕР»РёРІСЊРµ/i, 'olivier salad'], [/С…Р°С‡Р°РїСѓСЂРё/i, 'khachapuri cheese bread boat'],
  [/С…РёРЅРєР°Р»/i, 'khinkali dumplings'], [/С€Р°СѓСЂРј|С€Р°РІРµСЂРј/i, 'shawarma wrap'],
  [/РїР»РѕРІ/i, 'uzbek plov rice with lamb'], [/РІР°СЂРµРЅРёРє/i, 'vareniki dumplings'],
  [/РѕРєСЂРѕС€Рє/i, 'okroshka cold soup'], [/СЃРѕР»СЏРЅРє/i, 'solyanka meat soup'],
  [/С‰Рё\b/i, 'shchi cabbage soup'], [/РіРѕР»СѓР±С†/i, 'stuffed cabbage rolls'],
  [/РґСЂР°РЅРёРє/i, 'potato pancakes with sour cream'], [/РјРѕСЂСЃ/i, 'red berry drink mors in a glass'],
  [/РєРѕРјРїРѕС‚/i, 'fruit compote drink'], [/РєРІР°СЃ/i, 'kvass dark bread drink'],
  [/СЂР°С„/i, 'raf coffee latte in a glass'], [/РєР°РїСѓС‡РёРЅРѕ/i, 'cappuccino with latte art'],
  [/Р»Р°С‚С‚Рµ/i, 'latte coffee in a tall glass'], [/СЌСЃРїСЂРµСЃСЃРѕ/i, 'espresso shot in a small cup'],
  [/Р°РјРµСЂРёРєР°РЅРѕ/i, 'americano black coffee'], [/С„Р»СЌС‚ СѓР°Р№С‚|С„Р»РµС‚ СѓР°Р№С‚/i, 'flat white coffee'],
  [/Р»СЋР»СЏ/i, 'lula kebab minced meat skewer'], [/С‡РµР±СѓСЂРµРє/i, 'cheburek fried pastry'],
  [/РјР°РЅС‚С‹/i, 'manti steamed dumplings'], [/РЅР°РіРіРµС‚СЃ/i, 'crispy chicken nuggets'],
  [/С„СЂРё\b/i, 'french fries'], [/С†РµР·Р°СЂСЊ/i, 'caesar salad with chicken'],
  [/РіСЂРµС‡РµСЃРє/i, 'greek salad with feta'], [/С‚РѕРј СЏРј/i, 'tom yum soup with shrimp'],
  [/С„Рѕ Р±Рѕ|С„Рѕ-Р±Рѕ/i, 'pho bo vietnamese soup'], [/СЂР°РјРµРЅ/i, 'ramen noodle soup with egg'],
  [/РїР°СЃС‚Р°|СЃРїР°РіРµС‚С‚Рё|С„РµС‚С‚СѓС‡РёРЅ|С‚Р°Р»СЊСЏС‚РµР»Р»Рµ|РїРµРЅРЅРµ/i, 'italian pasta dish'],
  [/РєР°СЂР±РѕРЅР°СЂР°/i, 'pasta carbonara'], [/Р±РѕР»РѕРЅСЊРµР·Рµ/i, 'pasta bolognese'],
  [/РїРёС†С†/i, 'italian pizza'], [/Р±СѓСЂРіРµСЂ/i, 'burger with beef patty'],
  [/СЃС‚РµР№Рє/i, 'grilled steak on a plate'], [/СЂРёР±Р°Р№/i, 'ribeye steak'],
  [/СЃСѓС€Рё|СЂРѕР»Р»/i, 'sushi rolls on a plate'], [/СЃР°С€РёРјРё/i, 'sashimi slices'],
  [/РїРѕРєРµ/i, 'poke bowl with salmon'], [/Р±РѕСѓР»/i, 'healthy bowl with vegetables'],
  [/С‚РёСЂР°РјРёСЃСѓ/i, 'tiramisu dessert'], [/С‡РёР·РєРµР№Рє/i, 'cheesecake slice with berries'],
  [/РјРµРґРѕРІРёРє/i, 'honey layer cake medovik'], [/РЅР°РїРѕР»РµРѕРЅ/i, 'napoleon puff pastry cake'],
  [/СЌРєР»РµСЂ/i, 'chocolate eclair'], [/РєСЂСѓР°СЃСЃР°РЅ/i, 'french croissant'],
  [/РїР°РЅРєРµР№Рє/i, 'pancakes with syrup'], [/РІР°С„Р»/i, 'belgian waffles with berries'],
  [/РјРѕСЂРѕР¶РµРЅРѕРµ|РїР»РѕРјР±РёСЂ/i, 'ice cream scoops in a bowl'],
  [/СЃРјСѓР·Рё/i, 'fruit smoothie in a glass'], [/Р»РёРјРѕРЅР°Рґ/i, 'lemonade with ice and citrus'],
  [/РјРёР»РєС€РµР№Рє|РјРѕР»РѕС‡РЅС‹Р№ РєРѕРєС‚РµР№Р»/i, 'milkshake with whipped cream'],
  [/РјР°С‚С‡Р°/i, 'iced matcha drink'], [/РєР°РєР°Рѕ/i, 'hot cocoa with marshmallows'],
  [/РіР»РёРЅС‚РІРµР№РЅ/i, 'mulled wine with orange and spices'],
  [/С‡Р°Р№/i, 'tea in a glass teapot'], [/СЃРѕРє/i, 'glass of fresh juice'],
  [/СЃСѓРї/i, 'soup in a bowl'], [/СЃР°Р»Р°С‚/i, 'fresh salad plate'],
  [/РґРµСЃРµСЂС‚/i, 'plated dessert'], [/Р·Р°РІС‚СЂР°Рє/i, 'breakfast plate'],
  [/РѕРјР»РµС‚/i, 'omelette with herbs'], [/РєР°С€Р°/i, 'porridge bowl with berries'],
  [/С‚РѕСЃС‚/i, 'toast with toppings'], [/СЃСЌРЅРґРІРёС‡|СЃРµРЅРґРІРёС‡/i, 'sandwich on a plate'],
  [/РєРѕС‚Р»РµС‚/i, 'cutlets with garnish'], [/РєСѓСЂРёРЅ|РєСѓСЂРёС†Р°|С†С‹РїР»/i, 'roasted chicken dish'],
  [/Р»РѕСЃРѕСЃ|СЃС‘РјРі|СЃРµРјРі/i, 'grilled salmon fillet'], [/С‚СѓРЅРµС†/i, 'tuna dish'],
  [/РєСЂРµРІРµС‚Рє/i, 'grilled shrimp on a plate'], [/РјРёС‚Р±РѕР»/i, 'meatballs in sauce'],
  [/СЂРёР·РѕС‚С‚Рѕ/i, 'creamy risotto'], [/РїР°СЌР»СЊ/i, 'spanish paella'],
  [/С„Р°Р»Р°С„РµР»/i, 'falafel balls with sauce'], [/С…СѓРјСѓСЃ/i, 'hummus plate with pita'],
];

async function qwen(name) {
  try {
    const r = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:3b',
        prompt: `Translate the Russian dish/drink name into a short English food-photo description (3-6 words, only latin letters). Keep the dish TYPE correct.\nExamples:\nРџРµР»СЊРјРµРЅРё -> pelmeni dumplings\nРўРѕРј СЏРј -> tom yum soup\nРњРµРґРѕРІРёРє -> honey cake\nРљРѕС‚Р»РµС‚Р° РїРѕ-РєРёРµРІСЃРєРё -> chicken kiev cutlet\nNow translate (answer with the description only): ${name}`,
        stream: false,
        options: { temperature: 0 },
      }),
    });
    const j = await r.json();
    const out = (j.response ?? '').trim().split('\n')[0].replace(/["'.]/g, '').slice(0, 60);
    // reject transliteration garbage / non-latin output
    if (!out || /[^a-z0-9\s-]/i.test(out)) return null;
    return out.toLowerCase();
  } catch {
    return null;
  }
}

const items = await p.listing.findMany({
  where: { type: { in: ['DISH', 'DRINK'] }, photoUrl: null },
  select: { id: true, name: true, category: true, type: true },
  orderBy: { name: 'asc' },
});
console.log(`РїРѕР·РёС†РёРё Р±РµР· С„РѕС‚Рѕ: ${items.length}`);
const todo = [];
for (const it of items) {
  let en = null;
  for (const [re, q] of DICT) if (re.test(it.name)) { en = q; break; }
  if (!en) en = await qwen(it.name);
  if (!en) {
    // last resort by category/type вЂ” a generic but honest image
    const cat = (it.category ?? '').toLowerCase();
    en = /РєРѕС„Рµ/.test(cat) ? 'specialty coffee drink in a cup'
      : /РІРёРЅРѕ/.test(cat) ? 'glass of wine'
      : /РїРёРІРѕ/.test(cat) ? 'glass of craft beer'
      : /РєРѕРєС‚РµР№Р»/.test(cat) ? 'craft cocktail in a glass'
      : /С‡Р°Р№/.test(cat) ? 'tea in a glass'
      : it.type === 'DRINK' ? 'refreshing drink in a glass' : 'restaurant plated dish';
  }
  todo.push({ id: it.id, name: it.name, en });
  if (todo.length % 50 === 0) console.log(`  РїРµСЂРµРІРµРґРµРЅРѕ ${todo.length}/${items.length}`);
}
fs.writeFileSync(path.join(__dirname, 'gen-todo.json'), JSON.stringify({ mismatches: todo }, null, 1));
console.log(`gen-todo.json: ${todo.length} РїРѕР·РёС†РёР№`);
await p.$disconnect();
// FULL menu pipeline orchestrator (owner 18.07 wish: В«РјРµРЅСЋ СЃР°РјРѕ Р·Р°РіСЂСѓР¶Р°РµС‚СЃСЏВ»):
//   1) import every OK menu-out file into the prod catalog (idempotent upserts)
//   2) per-venue photo pipeline: dl refs в†’ img2img @0.2 в†’ CLIP check в†’ upload
// Run manually or from the weekly scheduled task. Each stage is a separate
// process (onnx+spawn segfault lesson) and survives transient proxy drops.
//   node prisma/menu-pipeline.mjs [--no-photos]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = path.join(__dirname, '..');
const dbUrl = fs.readFileSync(path.join(BACKEND, '.railway-db-url'), 'utf8').trim();
const env = { ...process.env, DATABASE_URL: `${dbUrl}?connect_timeout=30&connection_limit=1` };
const node = process.execPath;

const run = (args, tries = 3) => {
  for (let a = 1; a <= tries; a++) {
    try {
      execFileSync(node, args, { cwd: BACKEND, env, stdio: 'inherit', timeout: 6 * 3600_000 });
      return true;
    } catch {
      console.log(`  attempt ${a}/${tries} failed: node ${args.join(' ')}`);
    }
  }
  return false;
};

// 1) all parseable menus в†’ catalog (only files with real items)
const domains = fs.readdirSync(path.join(__dirname, 'menu-out'))
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .filter((f) => {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(__dirname, 'menu-out', f), 'utf8'));
      return j.status === 'ok' && (j.items?.length ?? 0) >= 5;
    } catch { return false; }
  })
  .map((f) => f.replace('.json', ''));
console.log(`== РРњРџРћР Рў: ${domains.length} РґРѕРјРµРЅРѕРІ`);
for (let i = 0; i < domains.length; i += 8) run(['prisma/menu-import.mjs', ...domains.slice(i, i + 8)]);

// 2) photos for everything new
if (!process.argv.includes('--no-photos')) {
  console.log('== Р¤РћРўРћ: dl в†’ gen(0.2) в†’ check');
  run(['prisma/regen-per-venue.mjs', '--stage-dl']);
  run(['prisma/regen-per-venue.mjs', '--stage-gen']);
  run(['prisma/regen-per-venue.mjs', '--stage-check']);
}
console.log('== PIPELINE DONE');

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$files = @('"'frontend/src/components/FeedPost.tsx','frontend/src/components/PhotoPostModal.tsx','frontend/src/components/ListingDetail.tsx','frontend/src/screens/Home.tsx','frontend/src/api.ts','frontend/src/types.ts','backend/src/reviews/reviews.controller.ts','backend/src/reviews/reviews.service.ts','backend/src/listings/listings.controller.ts','backend/src/listings/listings.service.ts','backend/src/social/social.service.ts'); foreach ("'$f in $files) { Write-Output "FILE $f"; rg -n -C 8 "voteState|voteCounts|mine: '"\\[\\]|api\\.vote|FeedPost|reviews:|attach.*vote|groupBy|byId\\(|@Get\\(':id'\\)|@Get\\('reviews|list\\(\" "'$f }' in D:\Приложения\Yelp
 succeeded in 1084ms:
FILE frontend/src/components/FeedPost.tsx
24-      alt=""
25-      loading="lazy"
26-      onError={() => setIdx((i) => i + 1)}
27-    />
28-  );
29-}
30-
31-// A user's activity post (Yelp-style): author + photo + the item/venue they reviewed.
32:export function FeedPost({
33-  review,
34-  onOpen,
35-  onComments,
36-  onOpenUser,
37-  onOpenPhoto,
38-  onOpenVenue,
39-}: {
40-  review: Review;
--
46-}) {
47-  // the user's own photo leads; text-only posts fall back to the dish's card
48-  // photo (illustrative, labeled) so the wall never looks broken/empty
49-  const photo = review.photoUrls?.[0];
50-  const cardPhoto = !photo ? review.listing?.photoUrl : null;
51-  const u = review.user;
52-  const initial = (u?.firstName ?? u?.username ?? '?').trim()[0]?.toUpperCase() ?? '?';
53-  const [vote, setVote] = useState<VoteState>({
54:    counts: review.voteCounts ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
55:    mine: [],
56-  });
57-  const doVote = (t: VoteType) =>
58:    api.vote(review.id, t).then(setVote).catch(() => {});
59-
60-  return (
61-    <div className="post" onClick={onOpen}>
62-      <button
63-        type="button"
64-        className="post-head"
65-        onClick={(e) => {
66-          e.stopPropagation(); // open the author's profile, never the post
FILE frontend/src/components/PhotoPostModal.tsx
38-  const initial = (u?.firstName ?? u?.username ?? '?').trim()[0]?.toUpperCase() ?? '?';
39-  const [closing, setClosing] = useState(false);
40-  // dead photo URL → hide the media instead of showing a broken-image icon
41-  const [photoBroken, setPhotoBroken] = useState(false);
42-  const [thumbBroken, setThumbBroken] = useState(false);
43-  const [menu, setMenu] = useState(false);
44-  const [toast, setToast] = useState('');
45-  const [vote, setVote] = useState<VoteState>({
46:    counts: review.voteCounts ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
47:    mine: [],
48-  });
49-  const [comments, setComments] = useState<Comment[]>([]);
50-  const [text, setText] = useState('');
51-  const [busy, setBusy] = useState(false);
52-  const [err, setErr] = useState('');
53-
54-  const reqClose = () => {
55-    setClosing(true);
--
58-  useEscClose(reqClose);
59-
60-  // swipe-down anywhere (from the scroll top) dismisses — shared app-wide pattern
61-  const sheetRef = useRef<HTMLDivElement>(null);
62-  useSwipeDismiss(sheetRef, onClose);
63-
64-  useEffect(() => {
65-    api.comments(review.id).then(setComments).catch(() => {});
66:    api.voteState(review.id).then(setVote).catch(() => {});
67-    // eslint-disable-next-line react-hooks/exhaustive-deps
68-  }, [review.id]);
69-
70:  const doVote = (t: VoteType) => api.vote(review.id, t).then(setVote).catch(() => {});
71-  const send = async () => {
72-    if (!text.trim()) return;
73-    setBusy(true);
74-    setErr('');
75-    try {
76-      const c = await api.addComment(review.id, text.trim());
77-      if (c) setComments((p) => [...p, c]);
78-      setText('');
FILE frontend/src/components/ListingDetail.tsx
373-  }, []);
374-  const [tab, setTab] = useState<'menu' | 'info' | 'reviews' | 'qa'>('menu');
375-  const menuRef = useRef<HTMLDivElement>(null);
376-  const infoRef = useRef<HTMLDivElement>(null);
377-  const reviewsRef = useRef<HTMLDivElement>(null);
378-  const qaRef = useRef<HTMLDivElement>(null);
379-  const goTab = (k: 'menu' | 'info' | 'reviews' | 'qa') => {
380-    setTab(k);
381:    const ref = { menu: menuRef, info: infoRef, reviews: reviewsRef, qa: qaRef }[k];
382-    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
383-  };
384-  // scroll-spy: highlight the tab of whichever section is currently under the header
385-  // as the user scrolls the card (root = the scrollable modal sheet).
386-  useEffect(() => {
387-    const root = sheetRef.current;
388-    if (!root) return;
389-    const sections: [React.RefObject<HTMLDivElement>, 'menu' | 'info' | 'reviews' | 'qa'][] = [
--
412-  const load = useCallback(() => {
413-    api
414-      .listing(id)
415-      .then((d) => {
416-        if (freshReviews.current.length && d.type !== 'RESTAURANT') {
417-          const have = new Set((d.reviews ?? []).map((r: any) => r.id));
418-          const missing = freshReviews.current.filter((r) => !have.has(r.id));
419-          if (missing.length) {
420:            d = { ...d, reviews: [...missing, ...(d.reviews ?? [])], reviewCount: (d.reviewCount ?? 0) + missing.length };
421-          }
422-        }
423-        setData(d);
424-        pushRecent({ ...(d as Listing), placeholderPhoto: d.placeholderPhotos?.[0] ?? null });
425-        // the card's history: who tasted it first (only when reviews exist)
426-        setFirstTaster(null);
427-        if (d.reviewCount > 0 && d.type !== 'RESTAURANT') {
428-          api.firstTasterOf(id).then(setFirstTaster).catch(() => {});
--
581-  const thumbUrl = (u: string) => thumb(u, 600) ?? u;
582-
583-  const VOTE_LABEL: Record<VoteType, string> = {
584-    USEFUL: '👍 Полезно',
585-    FUNNY: '😄 Смешно',
586-    COOL: '😎 Круто',
587-    OHNO: '🙀 О нет',
588-  };
589:  const voteState = (r: Review): VoteState =>
590-    votes[r.id] ?? {
591:      counts: r.voteCounts ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
592:      mine: [],
593-    };
594-  const doVote = (reviewId: string, type: VoteType) => {
595-    api
596-      .vote(reviewId, type)
597-      .then((vs) => setVotes((prev) => ({ ...prev, [reviewId]: vs })))
598-      .catch(() => {});
599-  };
600-  const doClaim = () => {
--
1372-                      ))}
1373-                      {r.videoUrls?.map((u) => (
1374-                        <video key={u} src={u} controls playsInline />
1375-                      ))}
1376-                    </div>
1377-                  )}
1378-                  <div className="vote-row">
1379-                    {(['USEFUL', 'FUNNY', 'COOL', 'OHNO'] as VoteType[]).map((t) => {
1380:                      const vs = voteState(r);
1381-                      return (
1382-                        <button
1383-                          key={t}
1384-                          className={'vote-btn' + (vs.mine.includes(t) ? ' active' : '')}
1385-                          onClick={() => doVote(r.id, t)}
1386-                        >
1387-                          {VOTE_LABEL[t]}
1388-                          {vs.counts[t] ? ` ${vs.counts[t]}` : ''}
--
1490-            const ratedId = reviewTarget?.id ?? data.id;
1491-            setShowReview(false);
1492-            // the fresh review appears on the card INSTANTLY (moderation may lag
1493-            // behind load() — the user must never need a page refresh to see it)
1494-            if (media?.review && ratedId === data.id) {
1495-              freshReviews.current = [media.review, ...freshReviews.current].slice(0, 5);
1496-              setData((d) => {
1497-                if (!d || d.reviews?.some((r: any) => r.id === (media.review as any).id)) return d;
1498:                const rv: any = { voteCounts: { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 }, ...media.review };
1499-                const count = (d.reviewCount ?? 0) + 1;
1500-                const avg = ((d.avgRating ?? 0) * (d.reviewCount ?? 0) + rv.rating) / count;
1501:                return { ...d, reviews: [rv, ...(d.reviews ?? [])], reviewCount: count, avgRating: avg };
1502-              });
1503-            }
1504-            // first review of the card → discovery phrase; else a rotating one
1505-            const phrase = data.reviewCount === 0
1506-              ? '🏅 Вы открыли это для сообщества — вы первый дегустатор!'
1507-              : RATE_PHRASES[Math.floor(Math.random() * RATE_PHRASES.length)];
1508-            setRateToast(phrase);
1509-            setTimeout(() => setRateToast(''), 3200);
FILE frontend/src/screens/Home.tsx
1-import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
2-import { api } from '../api';
3-import { ListingCard } from '../components/ListingCard';
4-import { TasteHero } from '../components/TasteHero';
5-import { ListRow } from '../components/ListRow';
6-import { Stars } from '../components/Stars';
7-import { preloadListingPhotos, VenuePhoto } from '../components/VenuePhoto';
8:import { FeedPost } from '../components/FeedPost';
9-import { PhotoPostModal } from '../components/PhotoPostModal';
10-import { CommentsModal } from '../components/CommentsModal';
11-import { hasOpenModal } from '../modalEsc';
12-import { UserProfileModal } from '../components/People';
13-const ListingDetailModal = lazy(() => import('../components/ListingDetail').then((m) => ({ default: m.ListingDetailModal })));
14-import { Filters, type FilterState } from '../components/Filters';
15-import type { BrowseCat } from '../components/MapBrowse';
16-const MapBrowse = lazy(() => import('../components/MapBrowse').then((m) => ({ default: m.MapBrowse })));
--
832-                  position is frozen: «показать ещё» only APPENDS below, sorted
833-                  within the new batch — never reshuffles what the user has seen. */}
834-              {(() => {
835-                const byKey = new Map<string, { s: number; el: JSX.Element }>();
836-                wallPosts.forEach((r, i) => {
837-                  byKey.set('p:' + r.id, {
838-                    s: Number((r as any).normScore ?? Math.max(0.05, 1 - i * 0.04)),
839-                    el: (
840:                      <FeedPost
841-                        key={r.id}
842-                        review={r}
843-                        onOpen={() => r.listing && openListing(r.listing)}
844-                        onComments={() => setCommentsReview(r.id)}
845-                        onOpenUser={(uid) => setOpenUser(uid)}
846-                        onOpenPhoto={() => setPhotoReview(r)}
847-                        onOpenVenue={() => r.venue?.id && openListing({ id: r.venue.id, name: r.venue.name } as Listing)}
848-                      />
FILE frontend/src/api.ts
309-    postJson<Review>(`/listings/${id}/reviews`, dto),
310-  // notification center (bell): list + unread badge + mark-all-read
311-  notifications: () => getJson<{ items: AppNotification[]; unread: number }>('/notifications'),
312-  notificationsUnread: () => getJson<{ unread: number }>('/notifications/unread'),
313-  notificationsRead: () => postJson<{ ok: boolean }>('/notifications/read'),
314-  deleteReview: (reviewId: string) => del<{ ok: boolean }>(`/reviews/${reviewId}`),
315-  vote: (reviewId: string, type: VoteType) =>
316-    postJson<VoteState>(`/reviews/${reviewId}/vote`, { type }),
317:  voteState: (reviewId: string) => getJson<VoteState>(`/reviews/${reviewId}/vote`),
318-  comments: (reviewId: string) =>
319-    getJson<import('./types').Comment[]>(`/reviews/${reviewId}/comments`),
320-  // add a photo to a card WITHOUT a review/rating (just the picture)
321-  addPhoto: (listingId: string, url: string) =>
322-    postJson<{ ok: boolean }>(`/listings/${listingId}/photo`, { url }),
323-  addComment: (reviewId: string, text: string, parentId?: string) =>
324-    postJson<import('./types').Comment>(`/reviews/${reviewId}/comments`, { text, parentId }),
325-  deleteComment: (commentId: string) => del<{ ok: boolean }>(`/comments/${commentId}`),
FILE frontend/src/types.ts
88-  text?: string | null;
89-  attributes?: Record<string, unknown> | null;
90-  photoUrls: string[];
91-  videoUrls?: string[];
92-  createdAt: string;
93-  status?: 'PENDING' | 'APPROVED';
94-  ownerReply?: string | null;
95-  listing?: Listing;
96:  venue?: { id: string | null; name: string } | null; // for dish/drink reviews: where it's served
97-  user?: ReviewUser;
98:  voteCounts?: { USEFUL: number; FUNNY: number; COOL: number; OHNO: number };
99-  commentCount?: number;
100-  topComment?: Comment | null;
101-}
102-
103-// bell / notification-center item
104-export interface AppNotification {
105-  id: string;
106-  kind: 'vote' | 'comment' | 'follow' | 'friend_post';
--
118-export interface VoteState {
119-  counts: { USEFUL: number; FUNNY: number; COOL: number; OHNO: number };
120-  mine: VoteType[];
121-}
122-
123-export interface ListingDetail extends Listing {
124-  openNow?: boolean | null;
125-  links?: { website?: string | null; telegram?: string | null; vk?: string | null };
126:  reviews: Review[];
127-  topDishes: Listing[];
128-  topDrinks: Listing[];
129-  venues: Listing[];
130-  pendingItems: Listing[];
131-  chain?: { avgRating: number; reviewCount: number; branchCount: number } | null;
132-  branches?: {
133-    id: string;
134-    name: string;
--
217-    id: string;
218-    telegramId?: string;
219-    firstName?: string | null;
220-    username?: string | null;
221-    photoUrl?: string | null;
222-    role?: 'CUSTOMER' | 'OWNER' | 'ADMIN';
223-  };
224-  counts: {
225:    reviews: number;
226-    followers: number;
227-    following: number;
228-    favorites: number;
229-  };
230-}
231-
232-export interface Answer {
233-  id: string;
--
261-  user?: { firstName?: string | null; username?: string | null };
262-}
263-
264-export interface PublicUser {
265-  id: string;
266-  firstName?: string | null;
267-  username?: string | null;
268-  photoUrl?: string | null;
269:  reviews: number;
270-  followers: number;
271-  following: number;
272-  isFollowing: boolean;
273-  isMe: boolean;
274-}
275-export interface PublicProfile extends PublicUser {
276-  reviewList: Review[];
277-}
FILE backend/src/reviews/reviews.controller.ts
3-import { TelegramAuthGuard } from '../common/telegram-auth.guard';
4-import { UsersService } from '../users/users.service';
5-import { CreateReviewDto, ReviewsService } from './reviews.service';
6-
7-@Controller()
8-@UseGuards(TelegramAuthGuard)
9-export class ReviewsController {
10-  constructor(
11:    private readonly reviews: ReviewsService,
12-    private readonly users: UsersService,
13-  ) {}
14-
15-  @Post('listings/:id/reviews')
16-  async create(
17-    @Req() req: any,
18-    @Param('id') id: string,
19-    @Body() body: CreateReviewDto,
--
36-
37-  @Post('reviews/:id/vote')
38-  async vote(@Req() req: any, @Param('id') id: string, @Body() body: { type: VoteType }) {
39-    const user = await this.users.upsertFromTelegram(req.telegramUser);
40-    return this.reviews.vote(user.id, id, body.type);
41-  }
42-
43-  // current reaction counts + which ones are MINE (to prefill the photo view)
44:  @Get('reviews/:id/vote')
45:  async voteState(@Req() req: any, @Param('id') id: string) {
46-    const user = await this.users.upsertFromTelegram(req.telegramUser);
47:    return this.reviews.voteState(id, user.id);
48-  }
49-
50-  // threaded comments (Reddit-style) on a review
51:  @Get('reviews/:id/comments')
52-  comments(@Param('id') id: string) {
53-    return this.reviews.comments(id);
54-  }
55-
56-  @Post('reviews/:id/comments')
57-  async addComment(
58-    @Req() req: any,
59-    @Param('id') id: string,
FILE backend/src/reviews/reviews.service.ts
379-  async myReviews(userId: string) {
380-    const reviews = await this.prisma.review.findMany({
381-      where: { userId },
382-      include: { listing: true },
383-      orderBy: { createdAt: 'desc' },
384-    });
385-    const ids = reviews.map((r) => r.id);
386-    const grouped = ids.length
387:      ? await this.prisma.reviewVote.groupBy({
388-          by: ['reviewId', 'type'],
389-          where: { reviewId: { in: ids } },
390-          _count: true,
391-        })
392-      : [];
393-    const vmap: Record<string, Record<string, number>> = {};
394-    for (const g of grouped) {
395-      (vmap[g.reviewId] ??= { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 })[g.type] = g._count;
396-    }
397-    const out = reviews.map((r) => ({
398-      ...r,
399:      voteCounts: vmap[r.id] ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
400-    })) as any[];
401-    // attach the venue for dish/drink reviews
402-    const itemIds = out
403-      .filter((r) => r.listing && r.listing.type !== 'RESTAURANT')
404-      .map((r) => r.listing.id);
405-    if (itemIds.length) {
406-      const links = await this.prisma.menuLink.findMany({
407-        where: { itemId: { in: itemIds } },
--
440-          kind: 'vote',
441-          actorId: userId,
442-          actorName: name,
443-          reviewId,
444-          text: `${name} отметил(а) ваш отзыв о «${review.listing?.name ?? ''}» ${emoji}`,
445-        });
446-      })().catch(() => {});
447-    }
448:    return this.voteState(reviewId, userId);
449-  }
450-
451:  async voteState(reviewId: string, userId: string) {
452-    const votes = await this.prisma.reviewVote.findMany({
453-      where: { reviewId },
454-      select: { type: true, userId: true },
455-    });
456-    const counts: Record<string, number> = { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 };
457-    const mine: string[] = [];
458-    for (const v of votes) {
459-      counts[v.type]++;
FILE backend/src/listings/listings.controller.ts
59-    @Param('id') id: string,
60-    @Body() body: { lat?: number; lng?: number; photoUrl?: string; note?: string },
61-  ) {
62-    const u = await this.users.upsertFromTelegram(req.telegramUser);
63-    return this.listings.checkin(u.id, id, body);
64-  }
65-
66-  @Get()
67:  async list(
68-    @Req() req: any,
69-    @Query('type') type?: ListingType,
70-    @Query('search') search?: string,
71-    @Query('take') take?: string,
72-    @Query('sort') sort?: string,
73-    @Query('price') price?: string,
74-    @Query('openNow') openNow?: string,
75-    @Query('cuisine') cuisine?: string,
76-    @Query('category') category?: string,
77-  ) {
78-    // optional auth: a known viewer gets «Рекомендуемые» ranked by THEIR taste
79-    const auth: string = req.headers['authorization'] ?? '';
80-    const [scheme, initData] = auth.split(' ');
81-    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
82-    const tgUser = scheme === 'tma' && initData && token ? validateTelegramInitData(initData, token, 0) : null;
83-    const viewer = tgUser ? await this.users.upsertFromTelegram(tgUser) : null;
84:    return this.listings.list({
85-      type,
86-      search,
87-      take: take ? Number(take) : undefined,
88-      sort,
89-      price: price ? Number(price) : undefined,
90-      openNow: openNow === '1' || openNow === 'true',
91-      cuisine,
92-      category,
--
191-  }
192-
193-  // real places to taste a given dish/drink (menu links + cuisine match)
194-  @Get(':id/where')
195-  placesForItem(@Param('id') id: string) {
196-    return this.listings.placesForItem(id);
197-  }
198-
199:  @Get(':id')
200:  byId(@Param('id') id: string) {
201:    return this.listings.byId(id);
202-  }
203-}
FILE backend/src/listings/listings.service.ts
189-export class ListingsService {
190-  constructor(private readonly prisma: PrismaService) {}
191-
192-  /**
193-   * Search/list with chain grouping: chain branches (same group_key) collapse
194-   * into ONE representative row carrying branchCount. Independents have
195-   * branchCount = 1.
196-   */
197:  async list(params: {
198-    type?: ListingType;
199-    search?: string;
200-    take?: number;
201-    sort?: string;
202-    price?: number;
203-    openNow?: boolean;
204-    cuisine?: string;
205-    category?: string;
--
428-        const withPhoto = vs.filter((v) => v.photoUrl);
429-        const pool = withPhoto.length ? withPhoto : vs;
430-        tryAtByItem.set(itemId, pool[Math.floor(Math.random() * pool.length)]);
431-      }
432-    }
433-    const wantByListing = new Map<string, number>();
434-    const viewsByListing = new Map<string, number>();
435-    if (zeroIds.length) {
436:      const favs = await this.prisma.favorite.groupBy({
437-        by: ['listingId'],
438-        where: { listingId: { in: zeroIds } },
439-        _count: true,
440-      });
441-      for (const f of favs) wantByListing.set(f.listingId, f._count);
442:      const views = await this.prisma.interaction.groupBy({
443-        by: ['listingId'],
444-        where: { listingId: { in: zeroIds }, type: 'VIEW' },
445-        _count: true,
446-      });
447-      for (const v of views) viewsByListing.set(v.listingId, v._count);
448-    }
449-
450-    return rows.map((r) => {
--
619-        take: 50,
620-      });
621-      recycled = true;
622-    }
623-    if (!fresh.length) return [];
624-
625-    // engagement, batched: useful×3, other reactions ×1, comments ×2
626-    const ids = fresh.map((r) => r.id);
627:    const votes = await this.prisma.reviewVote.groupBy({
628-      by: ['reviewId', 'type'],
629-      where: { reviewId: { in: ids } },
630-      _count: true,
631-    });
632-    const eng = new Map<string, number>();
633-    for (const v of votes) {
634-      const w = v.type === 'USEFUL' ? 3 : 1;
635-      eng.set(v.reviewId, (eng.get(v.reviewId) ?? 0) + w * v._count);
636-    }
637:    const cms = await this.prisma.comment.groupBy({
638-      by: ['reviewId'],
639-      where: { reviewId: { in: ids } },
640-      _count: true,
641-    });
642-    for (const c of cms) eng.set(c.reviewId, (eng.get(c.reviewId) ?? 0) + 2 * c._count);
643-
644-    // is this the author's FIRST post ever? (cold-start reach rule)
645-    const authorIds = [...new Set(fresh.map((r) => r.userId))];
646:    const authorCounts = await this.prisma.review.groupBy({
647-      by: ['userId'],
648-      where: { userId: { in: authorIds } },
649-      _count: true,
650-    });
651-    const postCount = new Map(authorCounts.map((a) => [a.userId, a._count]));
652-
653-    // viewer's taste: top categories from their own ratings + onboarding quiz
654-    const mine = await this.prisma.review.findMany({
--
763-    });
764-    await this.attachVenuesToReviews(list);
765-    await this.attachCommentPreview(list);
766-    await this.attachVoteCounts(list);
767-    return list;
768-  }
769-
770-  /** Adds reaction counts (👍😄😎🙀) to each review so the feed shows them. */
771:  async attachVoteCounts(reviews: any[]) {
772-    const ids = reviews.map((r) => r.id);
773-    if (!ids.length) return;
774:    const grouped = await this.prisma.reviewVote.groupBy({
775-      by: ['reviewId', 'type'],
776-      where: { reviewId: { in: ids } },
777-      _count: true,
778-    });
779-    const vmap: Record<string, Record<string, number>> = {};
780-    for (const g of grouped) {
781-      (vmap[g.reviewId] ??= { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 })[g.type] = g._count;
782-    }
783-    for (const r of reviews) {
784:      r.voteCounts = vmap[r.id] ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 };
785-    }
786-  }
787-
788-  /** Adds commentCount + the first comment to each review (feed preview). */
789:  async attachCommentPreview(reviews: any[]) {
790-    const ids = reviews.map((r) => r.id);
791-    if (!ids.length) return;
792-    const comments = await this.prisma.comment.findMany({
793-      where: { reviewId: { in: ids } },
794-      include: { user: { select: { id: true, firstName: true, username: true, photoUrl: true } } },
795-      orderBy: { createdAt: 'asc' },
796-    });
797-    const byReview = new Map<string, any[]>();
--
802-    for (const r of reviews) {
803-      const arr = byReview.get(r.id) ?? [];
804-      r.commentCount = arr.length;
805-      r.topComment = arr[0] ?? null;
806-    }
807-  }
808-
809-  /** Tags each dish/drink review with the venue the user tasted at (or a menu link). */
810:  private async attachVenuesToReviews(reviews: any[]) {
811-    const items = reviews.filter((r) => r.listing && r.listing.type !== 'RESTAURANT');
812-    if (items.length === 0) return;
813-    const explicitIds = [
814-      ...new Set(items.map((r) => (r.attributes as any)?.venueId).filter(Boolean)),
815-    ] as string[];
816-    const venueById = new Map<string, { id: string; name: string }>();
817-    if (explicitIds.length) {
818-      const vs = await this.prisma.listing.findMany({
--
1452-    const rows = await this.prisma.listing.findMany({
1453-      where: { type: 'RESTAURANT' },
1454-      orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
1455-      take,
1456-    });
1457-    return this.enrichCards(rows);
1458-  }
1459-
1460:  async byId(id: string) {
1461-    const listing = await this.prisma.listing.findUnique({
1462-      where: { id },
1463-      include: {
1464:        reviews: {
1465-          where: { status: 'APPROVED' },
1466-          include: { user: true },
1467-          orderBy: { createdAt: 'desc' },
1468-        },
1469-      },
1470-    });
1471-    if (!listing) return null;
1472-
--
1564-      itemLinks = links; // kept for the venue-photo rule below
1565-      venues = links
1566-        // keep the menu price so "Где попробовать" shows how much the item costs there
1567-        .map((l) => ({ ...l.venue, menuPrice: l.price }))
1568-        .sort((a, b) => b.avgRating - a.avgRating)
1569-        .slice(0, 8);
1570-    }
1571-
1572:    // attach vote counts (useful/funny/cool) to each review
1573-    const reviewIds = listing.reviews.map((r) => r.id);
1574-    const grouped = reviewIds.length
1575:      ? await this.prisma.reviewVote.groupBy({
1576-          by: ['reviewId', 'type'],
1577-          where: { reviewId: { in: reviewIds } },
1578-          _count: true,
1579-        })
1580-      : [];
1581-    const vmap: Record<string, Record<string, number>> = {};
1582-    for (const g of grouped) {
1583-      (vmap[g.reviewId] ??= { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 })[g.type] = g._count;
1584-    }
1585:    const reviews: any[] = listing.reviews.map((r) => ({
1586-      ...r,
1587:      voteCounts: vmap[r.id] ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
1588-    }));
1589-    // the most USEFUL reviews lead (community-curated), recency breaks ties
1590-    reviews.sort(
1591-      (a, b) =>
1592:        b.voteCounts.USEFUL - a.voteCounts.USEFUL ||
1593-        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
1594-    );
1595-
1596-    // for a dish/drink, tag each review with the place the user tasted it at
1597-    let tastedAt: any[] = [];
1598-    let bestVenue: { name: string; rating: number; count: number } | null = null;
1599-    if (listing.type !== 'RESTAURANT') {
1600-      const venueIds = [
FILE backend/src/social/social.service.ts
106-    ).length;
107-    const level = [...LEVELS].reverse().find((l) => quality >= l.need) ?? LEVELS[0];
108-    // taster map (specializations) — everyone can see it on anyone's profile
109-    const specializations = (await this.specializations(targetId)).filter((s: any) => s.count > 0);
110-    return { ...card, reviewList, level: { title: level.title, icon: level.icon, quality }, specializations };
111-  }
112-
113-  /** For dish/drink reviews, attach the venue that serves the item. */
114:  async attachItemVenues(reviews: any[]) {
115-    const items = reviews.filter((r) => r.listing && r.listing.type !== 'RESTAURANT');
116-    if (items.length === 0) return;
117-
118-    // the exact place the user picked when rating (most accurate)
119-    const explicitIds = [
120-      ...new Set(items.map((r) => (r.attributes as any)?.venueId).filter(Boolean)),
121-    ] as string[];
122-    const venueById = new Map<string, { id: string; name: string }>();
--
167-    });
168-    await this.attachItemVenues(list);
169-    await this.attachCommentPreview(list);
170-    await this.attachVoteCounts(list);
171-    return list;
172-  }
173-
174-  /** Adds reaction counts (👍😄😎🙀) to each review for the social feed. */
175:  async attachVoteCounts(reviews: any[]) {
176-    const ids = reviews.map((r) => r.id);
177-    if (!ids.length) return;
178:    const grouped = await this.prisma.reviewVote.groupBy({
179-      by: ['reviewId', 'type'],
180-      where: { reviewId: { in: ids } },
181-      _count: true,
182-    });
183-    const vmap: Record<string, Record<string, number>> = {};
184-    for (const g of grouped) {
185-      (vmap[g.reviewId] ??= { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 })[g.type] = g._count;
186-    }
187-    for (const r of reviews) {
188:      r.voteCounts = vmap[r.id] ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 };
189-    }
190-  }
191-
192-  /** commentCount + first comment per review (feed preview). */
193:  async attachCommentPreview(reviews: any[]) {
194-    const ids = reviews.map((r) => r.id);
195-    if (!ids.length) return;
196-    const comments = await this.prisma.comment.findMany({
197-      where: { reviewId: { in: ids } },
198-      include: { user: { select: { id: true, firstName: true, username: true, photoUrl: true } } },
199-      orderBy: { createdAt: 'asc' },
200-    });
201-    const byReview = new Map<string, any[]>();
--
270-      delta,
271-      top: ranked.slice(0, 5),
272-      next,
273-      compareWith,
274-    };
275-  }
276-
277-  /**
278:   * Untappd-style taste portrait built purely from the user's own reviews:
279-   * favourite category, what they tend to love, average strictness, best find.
280-   * Meaningful from the very first review — no crowd data required.
281-   */
282-  // How many reviews the user has in each category. A category's rankings
283-  // ("король бургеров" etc.) and precise recs unlock at THRESHOLD reviews — this
284-  // trains the recommender on the user's taste before showing category verdicts.
285-  static readonly UNLOCK_THRESHOLD = 5;
286-

codex
По лайкам уже видна системная причина: backend в выдачах прикладывает только общие счётчики, а `FeedPost` и `ListingDetail` всегда инициализируют `mine: []`. Единственный экран, который действительно гидратирует реакцию текущего пользователя, — полноэкранный просмотр фото; поэтому состояние появляется лишь после клика/отдельного запроса. Сейчас уточняю лучший фикс без N+1-запросов и проверяю соседние контракты данных.
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content backend/src/listings/listings.controller.ts | Select-Object -First 220; Get-Content backend/src/listings/listings.service.ts | Select-Object -Skip 540 -First 260; Get-Content backend/src/listings/listings.service.ts | Select-Object -Skip 1450 -First 250; Get-Content backend/src/social/social.controller.ts; Get-Content backend/src/social/social.service.ts | Select-Object -First 220; Get-Content backend/src/reviews/reviews.service.ts | Select-Object -Skip 410 -First 70; Get-Content backend/prisma/schema.prisma | Select-Object -Skip 225 -First 50' in D:\Приложения\Yelp
 succeeded in 1563ms:
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ListingType } from '@prisma/client';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { validateTelegramInitData } from '../common/telegram-init-data';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { ListingsService } from './listings.service';

// Public browse/search endpoints вЂ” no auth needed to discover venues.
@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listings: ListingsService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  // a logged-in user proposes a dish/drink for a venue (pending owner approval)
  @Post(':id/items')
  @UseGuards(TelegramAuthGuard)
  async addItem(
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      type: 'DISH' | 'DRINK';
      name: string;
      description?: string;
      photoUrl?: string;
      category?: string;
    },
  ) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.listings.addItem(u.id, id, body);
  }

  // link an existing dish/drink to a restaurant the user picked
  @Post(':itemId/served-at')
  @UseGuards(TelegramAuthGuard)
  async servedAt(@Req() req: any, @Param('itemId') itemId: string, @Body() body: { venueId: string }) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.listings.linkItemToVenue(u.id, itemId, body.venueId);
  }

  // a user checks in at a venue; GPS coords (if provided) verify proximity
  @Post(':id/checkin')
  @UseGuards(TelegramAuthGuard)
  async checkin(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { lat?: number; lng?: number; photoUrl?: string; note?: string },
  ) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.listings.checkin(u.id, id, body);
  }

  @Get()
  async list(
    @Req() req: any,
    @Query('type') type?: ListingType,
    @Query('search') search?: string,
    @Query('take') take?: string,
    @Query('sort') sort?: string,
    @Query('price') price?: string,
    @Query('openNow') openNow?: string,
    @Query('cuisine') cuisine?: string,
    @Query('category') category?: string,
  ) {
    // optional auth: a known viewer gets В«Р РµРєРѕРјРµРЅРґСѓРµРјС‹РµВ» ranked by THEIR taste
    const auth: string = req.headers['authorization'] ?? '';
    const [scheme, initData] = auth.split(' ');
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
    const tgUser = scheme === 'tma' && initData && token ? validateTelegramInitData(initData, token, 0) : null;
    const viewer = tgUser ? await this.users.upsertFromTelegram(tgUser) : null;
    return this.listings.list({
      type,
      search,
      take: take ? Number(take) : undefined,
      sort,
      price: price ? Number(price) : undefined,
      openNow: openNow === '1' || openNow === 'true',
      cuisine,
      category,
      viewerId: viewer?.id ?? null,
    });
  }

  @Get('feed')
  async feed(@Req() req: any, @Query('take') take?: string) {
    // optional auth: a known viewer gets the PERSONALIZED one-time feed
    // (impressions recorded); anonymous falls back to the public ranking
    const auth: string = req.headers['authorization'] ?? '';
    const [scheme, initData] = auth.split(' ');
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
    const tgUser = scheme === 'tma' && initData && token ? validateTelegramInitData(initData, token, 0) : null;
    const viewer = tgUser ? await this.users.upsertFromTelegram(tgUser) : null;
    return this.listings.feedRanked(viewer?.id ?? null, take ? Number(take) : undefined);
  }

  // NOTE: specific routes must be declared before the ':id' wildcard.
  @Get('recommended')
  recommended(@Query('take') take?: string) {
    return this.listings.recommended(take ? Number(take) : undefined);
  }

  @Get('top-weekly')
  topWeekly() {
    return this.listings.topWeekly();
  }

  // В«РЎС‚Р°РЅСЊС‚Рµ РїРµСЂРІС‹Рј РґРµРіСѓСЃС‚Р°С‚РѕСЂРѕРјВ» вЂ” items nobody has reviewed yet (gamification)
  @Get('first-taster')
  firstTaster(@Query('take') take?: string) {
    return this.listings.firstTasterItems(take ? Number(take) : undefined);
  }

  // personalized picks from the user's chosen categories (quiz)
  @Get('recommended-for')
  recommendedFor(@Query('cats') cats?: string) {
    return this.listings.recommendedFor((cats ?? '').split(',').filter(Boolean));
  }

  @Get('geo')
  geo() {
    return this.listings.geo();
  }

  // venues serving a dish/drink (for the Р‘Р»СЋРґР° / РќР°РїРёС‚РєРё map search)
  @Get('venues-serving')
  venuesServing(@Query('type') type: 'DISH' | 'DRINK', @Query('q') q?: string) {
    return this.listings.venuesServing(type === 'DRINK' ? 'DRINK' : 'DISH', q);
  }

  // autocomplete suggestions for adding a dish/drink
  @Get('item-suggest')
  itemSuggest(@Query('type') type: 'DISH' | 'DRINK', @Query('q') q?: string) {
    return this.listings.suggestItems(type === 'DRINK' ? 'DRINK' : 'DISH', q);
  }

  // unified venue search (by name OR by dish/drink they serve)
  @Get('search-venues')
  searchVenues(@Query('q') q?: string) {
    return this.listings.searchVenues(q);
  }

  // unified search: matching dish/drink first, then venues
  @Get('search-all')
  searchAll(@Query('q') q?: string) {
    return this.listings.searchAll(q);
  }

  // search-bar autocomplete suggestions
  @Get('suggest')
  suggest(@Query('q') q?: string) {
    return this.listings.suggest(q);
  }

  // search dishes/drinks by name (Р‘Р»СЋРґР° / РќР°РїРёС‚РєРё mode)
  @Get('search-items')
  searchItems(@Query('type') type: 'DISH' | 'DRINK', @Query('q') q?: string) {
    return this.listings.searchItems(type === 'DRINK' ? 'DRINK' : 'DISH', q);
  }

  @Get('group')
  group(@Query('key') key: string, @Query('type') type?: ListingType) {
    return this.listings.group(key, type);
  }

  // find beers by the flavor/serving tags people left in reviews (e.g. "РњСЏРіРєРѕРµ,РЎ РіРѕСЂС‡РёРЅРєРѕР№")
  @Get('beer-by-tags')
  beerByTags(@Query('tags') tags?: string) {
    const list = (tags ?? '').split(',').map((t) => t.trim()).filter(Boolean);
    return this.listings.beerByTags(list);
  }

  // smart personal feed (ratings + recent views + quiz в€’ dislikes)
  @Get('recommended-smart')
  @UseGuards(TelegramAuthGuard)
  async recommendedSmart(@Req() req: any, @Query('recent') recent?: string) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.listings.recommendedSmart(u.id, (recent ?? '').split(',').filter(Boolean));
  }

  // real places to taste a given dish/drink (menu links + cuisine match)
  @Get(':id/where')
  placesForItem(@Param('id') id: string) {
    return this.listings.placesForItem(id);
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.listings.byId(id);
  }
}
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    if (linked.length) {
      const seenName = new Set<string>();
      const pick = shuffle(linked).filter((it) => {
        const n = it.name.toLowerCase().trim();
        if (seenName.has(n)) return false;
        seenName.add(n);
        return true;
      }).slice(0, limit);
      const cards = await this.enrichCards(pick);
      return cards.map((c, i) => {
        const links = ((pick[i] as any).servedAt ?? []).filter((l: any) => l.venue);
        const link = links.length ? links[Math.floor(Math.random() * links.length)] : undefined;
        const recVenue = link ? { ...link.venue, price: link.price ?? null } : undefined;
        return { ...c, recReason: 'popular now', recVenue };
      });
    }

    // Last resort: still show real items instead of leaving the home screen empty.
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM listings WHERE type::text IN ('DISH', 'DRINK')
      ORDER BY RANDOM() LIMIT ${limit}
    `;
    const ids = rows.map((r) => r.id);
    const items = await this.prisma.listing.findMany({ where: { id: { in: ids } } });
    const byId = new Map(items.map((i) => [i.id, i]));
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as typeof items;
    return this.enrichCards(ordered);
  }

  /**
   * Instagram-grade ranked feed. Score = Quality Г— TasteMatch Г— Freshness Г— Boosts:
   *  вЂў Quality вЂ” text depth + engagement (usefulГ—3, commentsГ—2, reactions Г—1);
   *  вЂў TasteMatch вЂ” the post's category vs the VIEWER's own taste profile;
   *  вЂў Freshness вЂ” exp(-age/7d);
   *  вЂў FIRST-POST BOOST Г—5 (72h) вЂ” the author's first-ever review gets real reach;
   *  вЂў follow boost Г—2 вЂ” people you follow rank higher in the same list.
   * Delivery is ONE-TIME per viewer: served posts are recorded in feed_impressions
   * and never returned to that viewer again ("РџРѕРєР°Р·Р°С‚СЊ РµС‰С‘" pages the next batch).
   */
  async feedRanked(viewerId: string | null, take = 20) {
    if (!viewerId) return this.feed(take); // anonymous в†’ public recency feed
    const seenRows = await this.prisma.feedImpression.findMany({
      where: { userId: viewerId },
      select: { reviewId: true },
    });
    const seen = new Set(seenRows.map((x) => x.reviewId));
    const candidates = await this.prisma.review.findMany({
      where: {
        status: 'APPROVED',
        // a post is a photo OR a written note вЂ” bare star-only ratings stay out
        OR: [{ photoUrls: { isEmpty: false } }, { text: { gt: '' } }],
        userId: { not: viewerId },
      },
      include: { user: true, listing: true },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    // unseen posts lead; when they run out the feed RECYCLES already-seen posts
    // (friends' and strangers' alike, ranked) so the wall is never empty вЂ” the
    // client stops only when literally every post in the app has been shown
    let fresh = candidates.filter((r) => !seen.has(r.id));
    let recycled = false;
    if (!fresh.length) {
      fresh = candidates;
      recycled = true;
    }
    if (!fresh.length) {
      // no other people's posts exist at all (tiny community) в†’ the viewer's own
      // posts keep the wall alive rather than showing an empty feed
      fresh = await this.prisma.review.findMany({
        where: { status: 'APPROVED', OR: [{ photoUrls: { isEmpty: false } }, { text: { gt: '' } }], userId: viewerId },
        include: { user: true, listing: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      recycled = true;
    }
    if (!fresh.length) return [];

    // engagement, batched: usefulГ—3, other reactions Г—1, comments Г—2
    const ids = fresh.map((r) => r.id);
    const votes = await this.prisma.reviewVote.groupBy({
      by: ['reviewId', 'type'],
      where: { reviewId: { in: ids } },
      _count: true,
    });
    const eng = new Map<string, number>();
    for (const v of votes) {
      const w = v.type === 'USEFUL' ? 3 : 1;
      eng.set(v.reviewId, (eng.get(v.reviewId) ?? 0) + w * v._count);
    }
    const cms = await this.prisma.comment.groupBy({
      by: ['reviewId'],
      where: { reviewId: { in: ids } },
      _count: true,
    });
    for (const c of cms) eng.set(c.reviewId, (eng.get(c.reviewId) ?? 0) + 2 * c._count);

    // is this the author's FIRST post ever? (cold-start reach rule)
    const authorIds = [...new Set(fresh.map((r) => r.userId))];
    const authorCounts = await this.prisma.review.groupBy({
      by: ['userId'],
      where: { userId: { in: authorIds } },
      _count: true,
    });
    const postCount = new Map(authorCounts.map((a) => [a.userId, a._count]));

    // viewer's taste: top categories from their own ratings + onboarding quiz
    const mine = await this.prisma.review.findMany({
      where: { userId: viewerId },
      select: { listing: { select: { category: true } } },
    });
    const catCnt = new Map<string, number>();
    for (const m of mine) {
      const cat = m.listing?.category?.toLowerCase();
      if (cat) catCnt.set(cat, (catCnt.get(cat) ?? 0) + 1);
    }
    const viewer = await this.prisma.user.findUnique({
      where: { id: viewerId },
      select: { preferences: true },
    });
    for (const k of (((viewer?.preferences as any)?.categories ?? []) as string[])) {
      catCnt.set(k.toLowerCase(), (catCnt.get(k.toLowerCase()) ?? 0) + 2);
    }
    const topCats = new Set(
      [...catCnt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k),
    );
    const followed = new Set(
      (
        await this.prisma.follow.findMany({
          where: { followerId: viewerId },
          select: { followingId: true },
        })
      ).map((f) => f.followingId),
    );

    const now = Date.now();
    const scored = fresh
      .map((r) => {
        const textQ = Math.min(1, (r.text?.trim().length ?? 0) / 200) * 0.5;
        const engQ = Math.min(1, Math.log1p(eng.get(r.id) ?? 0) / Math.log1p(20)) * 0.5;
        const quality = 0.25 + textQ + engQ; // photo is guaranteed here в†’ base 0.25
        const cat = (r.listing?.category ?? '').toLowerCase();
        const taste = topCats.size === 0 ? 1 : topCats.has(cat) ? 1.5 : 0.8;
        const ageDays = (now - r.createdAt.getTime()) / 86_400_000;
        const freshness = Math.exp(-ageDays / 7) + 0.05; // old posts never hit exactly 0
        const firstPost = (postCount.get(r.userId) ?? 99) === 1 && ageDays < 3 ? 5 : 1;
        const isFriend = followed.has(r.userId);
        const follow = isFriend ? 2 : 1;
        return { r, isFriend, score: quality * taste * freshness * firstPost * follow };
      })
      // FRIENDS STRICTLY FIRST, then everyone else by the recommendation score
      // (owner rule 13.07.2026: СЃРЅР°С‡Р°Р»Р° РґСЂСѓР·РµР№, РїРѕС‚РѕРј СЂР°РЅРґРѕРјРЅС‹Рµ РїРѕ СЂРµРєРѕРјРµРЅРґР°С†РёСЏРј)
      .sort((a, b) => Number(b.isFriend) - Number(a.isFriend) || b.score - a.score);

    if (recycled) {
      for (let i = scored.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [scored[i], scored[j]] = [scored[j], scored[i]];
      }
    }
    const maxScore = Math.max(1e-9, ...scored.map((x) => x.score));
    const page = scored.slice(0, recycled ? 100 : Number(take)).map((x) => {
      (x.r as any).isFriend = x.isFriend;
      // unified 0..1 score вЂ” rec CARDS compete with posts on equal footing
      // (owner 17.07.2026: РµСЃР»Рё РєР°СЂС‚РѕС‡РєР° РїРѕРґС…РѕРґРёС‚ Р±РѕР»СЊС€Рµ вЂ” РѕРЅР° РІС‹С€Рµ РїРѕСЃС‚Р° РґСЂСѓРіР°)
      (x.r as any).normScore = x.score / maxScore;
      return x.r;
    });
    for (const r of page) (r as any).recycled = recycled; // client-side session dedupe hint
    // record the delivery вЂ” these will never be served to this viewer again
    // (recycled pages are already recorded вЂ” skip the write)
    if (page.length && !recycled) {
      await this.prisma.feedImpression
        .createMany({
          data: page.map((r) => ({ userId: viewerId, reviewId: r.id })),
          skipDuplicates: true,
        })
        .catch(() => {});
    }
    await this.attachVenuesToReviews(page);
    await this.attachCommentPreview(page);
    await this.attachVoteCounts(page);
    // text-only posts fall back to the ITEM's card photo; after the stock purge
    // that may be null while the menu LINKS still hold the venue's aigen photo вЂ”
    // use it (prefer the venue the review was tasted at) so posts never go blank
    const needPhoto = page.filter((r: any) => !(r.photoUrls?.length) && r.listing && !r.listing.photoUrl);
    if (needPhoto.length) {
      const itemIds = [...new Set(needPhoto.map((r: any) => r.listingId))];
      const links = await this.prisma.menuLink.findMany({
        where: { itemId: { in: itemIds }, photoUrl: { not: null } },
        select: { itemId: true, venueId: true, photoUrl: true },
      });
      const byItem = new Map<string, { venueId: string; photoUrl: string | null }[]>();
      for (const l of links) (byItem.get(l.itemId) ?? byItem.set(l.itemId, []).get(l.itemId)!).push(l);
      for (const r of needPhoto as any[]) {
        const ls = byItem.get(r.listingId);
        if (!ls?.length) continue;
        const vid = (r.attributes as any)?.venueId;
        r.listing.photoUrl = (vid && ls.find((l) => l.venueId === vid)?.photoUrl) || ls[0].photoUrl;
      }
    }
    return page;
  }

  /** Activity wall: recent user posts. ONLY reviews where the user uploaded their OWN
   *  photo вЂ” a rating without a photo never shows in the recommendation feed. (The
   *  item's own internet-sourced photo is for its card, not the feed.) */
  async feed(take = 20) {
    const list = await this.prisma.review.findMany({
      where: {
        status: 'APPROVED',
        photoUrls: { isEmpty: false },
      },
      include: { user: true, listing: true },
      orderBy: { createdAt: 'desc' },
      take: Number(take),
    });
    await this.attachVenuesToReviews(list);
    await this.attachCommentPreview(list);
    await this.attachVoteCounts(list);
    return list;
  }

  /** Adds reaction counts (рџ‘Ќрџ„рџЋрџ™Ђ) to each review so the feed shows them. */
  async attachVoteCounts(reviews: any[]) {
    const ids = reviews.map((r) => r.id);
    if (!ids.length) return;
    const grouped = await this.prisma.reviewVote.groupBy({
      by: ['reviewId', 'type'],
      where: { reviewId: { in: ids } },
      _count: true,
    });
    const vmap: Record<string, Record<string, number>> = {};
    for (const g of grouped) {
      (vmap[g.reviewId] ??= { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 })[g.type] = g._count;
    }
    for (const r of reviews) {
      r.voteCounts = vmap[r.id] ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 };
    }
  }

  /** Adds commentCount + the first comment to each review (feed preview). */
  async attachCommentPreview(reviews: any[]) {
    const ids = reviews.map((r) => r.id);
    if (!ids.length) return;
    const comments = await this.prisma.comment.findMany({
      where: { reviewId: { in: ids } },
      include: { user: { select: { id: true, firstName: true, username: true, photoUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const byReview = new Map<string, any[]>();
    for (const c of comments) {
      if (!byReview.has(c.reviewId)) byReview.set(c.reviewId, []);
      byReview.get(c.reviewId)!.push(c);
  async topWeekly(take = 10) {
    const rows = await this.prisma.listing.findMany({
      where: { type: 'RESTAURANT' },
      orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
      take,
    });
    return this.enrichCards(rows);
  }

  async byId(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        reviews: {
          where: { status: 'APPROVED' },
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!listing) return null;

    // count a profile view (fire-and-forget вЂ” owner analytics)
    this.prisma.listing
      .update({ where: { id }, data: { views: { increment: 1 } } })
      .catch(() => {});

    // lazily resolve a street address from coords (OSM has only ~10% of them).
    // Done on open + persisted, so it's policy-friendly (only viewed venues).
    if (listing.type === 'RESTAURANT' && !listing.address && listing.lat != null && listing.lng != null) {
      const addr = await this.reverseGeocode(listing.lat, listing.lng);
      if (addr) {
        listing.address = addr;
        this.prisma.listing.update({ where: { id }, data: { address: addr } }).catch(() => {});
      }
    }

    let topDishes: unknown[] = [];
    let topDrinks: unknown[] = [];
    let venues: unknown[] = [];
    let pendingItems: unknown[] = [];
    let itemLinks: { venueId: string; photoUrl: string | null }[] = [];

    if (listing.type === 'RESTAURANT') {
      const links = await this.prisma.menuLink.findMany({
        where: { venueId: id },
        include: { item: true },
      });
      const approved = links.filter((l) => l.status === 'APPROVED');
      // a chain shares one menu AND one set of ratings: count reviews tasted at
      // ANY branch of the chain, not just this point.
      const chainWhere = listing.groupKey
        ? { groupKey: listing.groupKey, type: 'RESTAURANT' as const }
        : { groupKey: null, name: { equals: listing.name, mode: 'insensitive' as const }, type: 'RESTAURANT' as const };
      const chainVenueIds = new Set(
        (await this.prisma.listing.findMany({ where: chainWhere, select: { id: true } })).map((b) => b.id),
      );
      chainVenueIds.add(id);
      // community price/count: from APPROVED reviews left at this chain
      const itemIds = approved.map((l) => l.item.id);
      const venueReviews = itemIds.length
        ? await this.prisma.review.findMany({
            where: { status: 'APPROVED', listingId: { in: itemIds } },
            select: { listingId: true, attributes: true, rating: true },
            orderBy: { createdAt: 'desc' },
          })
        : [];
      const priceByItem = new Map<string, number>();
      const countByItem = new Map<string, number>();
      const sumByItem = new Map<string, number>();
      for (const r of venueReviews) {
        const a = r.attributes as any;
        if (!chainVenueIds.has(a?.venueId)) continue; // reviews tasted at this chain
        countByItem.set(r.listingId, (countByItem.get(r.listingId) ?? 0) + 1);
        sumByItem.set(r.listingId, (sumByItem.get(r.listingId) ?? 0) + (r as any).rating);
        if (a?.price && !priceByItem.has(r.listingId)) priceByItem.set(r.listingId, Number(a.price));
      }
      const linkPrice = new Map(approved.map((l) => [l.item.id, l.price]));
      const buildItems = async (t: string) => {
        // pre-trim by global rating, then re-rank by rating AT THIS VENUE
        const raw = approved
          .filter((l) => l.item.type === t)
          .map((l) => l.item)
          .sort((a, b) => b.avgRating - a.avgRating)
          .slice(0, 20);
        const cards = await this.enrichCards(raw);
        const withRating = cards.map((c) => {
          const cnt = countByItem.get(c.id) ?? 0;
          return {
            ...c,
            // moderator/owner-set price wins; otherwise community price from reviews
            price: linkPrice.get(c.id) ?? priceByItem.get(c.id) ?? null,
            venueReviews: cnt,
            // average rating of THIS item AT THIS venue (not the global average)
            venueRating: cnt ? (sumByItem.get(c.id) ?? 0) / cnt : null,
          };
        });
        // carousel sorted by rating вЂ” best on the LEFT, descending (venue rating first,
        // then the item's global rating as a tiebreaker)
        withRating.sort(
          (a, b) => (b.venueRating ?? b.avgRating ?? 0) - (a.venueRating ?? a.avgRating ?? 0),
        );
        return withRating.slice(0, 8);
      };
      topDishes = await buildItems('DISH');
      topDrinks = await buildItems('DRINK');
      // user-proposed items awaiting owner approval (still reviewable)
      pendingItems = links.filter((l) => l.status === 'PENDING').map((l) => l.item);
    } else {
      const links = await this.prisma.menuLink.findMany({
        where: { itemId: id, status: 'APPROVED' },
        include: { venue: true },
      });
      itemLinks = links; // kept for the venue-photo rule below
      venues = links
        // keep the menu price so "Р“РґРµ РїРѕРїСЂРѕР±РѕРІР°С‚СЊ" shows how much the item costs there
        .map((l) => ({ ...l.venue, menuPrice: l.price }))
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 8);
    }

    // attach vote counts (useful/funny/cool) to each review
    const reviewIds = listing.reviews.map((r) => r.id);
    const grouped = reviewIds.length
      ? await this.prisma.reviewVote.groupBy({
          by: ['reviewId', 'type'],
          where: { reviewId: { in: reviewIds } },
          _count: true,
        })
      : [];
    const vmap: Record<string, Record<string, number>> = {};
    for (const g of grouped) {
      (vmap[g.reviewId] ??= { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 })[g.type] = g._count;
    }
    const reviews: any[] = listing.reviews.map((r) => ({
      ...r,
      voteCounts: vmap[r.id] ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
    }));
    // the most USEFUL reviews lead (community-curated), recency breaks ties
    reviews.sort(
      (a, b) =>
        b.voteCounts.USEFUL - a.voteCounts.USEFUL ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // for a dish/drink, tag each review with the place the user tasted it at
    let tastedAt: any[] = [];
    let bestVenue: { name: string; rating: number; count: number } | null = null;
    if (listing.type !== 'RESTAURANT') {
      const venueIds = [
        ...new Set(reviews.map((r) => (r.attributes as any)?.venueId).filter(Boolean)),
      ] as string[];
      const vById = new Map<string, any>();
      if (venueIds.length) {
        const vs = await this.prisma.listing.findMany({ where: { id: { in: venueIds } } });
        for (const v of vs) vById.set(v.id, v);
      }
      const onlyVenue = (venues as any[]).length === 1 ? (venues[0] as any) : null;
      for (const r of reviews) {
        const vid = (r.attributes as any)?.venueId;
        const vname = (r.attributes as any)?.venueName;
        r.venue =
          (vid && vById.get(vid)) ||
          (vname ? { id: null, name: vname, pending: true } : null) ||
          onlyVenue;
      }

      // "РџСЂРѕР±РѕРІР°Р»Рё РІ" = full venue cards (rating + address + the price paid)
      const seenT = new Set<string>();
      const withId: any[] = [];
      for (const r of reviews) {
        const v = r.venue;
        if (!v) continue;
        const key = v.id ?? v.name;
        if (seenT.has(key)) continue;
        seenT.add(key);
        const price = (r.attributes as any)?.price ?? null;
        if (v.id) withId.push({ ...v, menuPrice: price });
        else tastedAt.push({ ...v, menuPrice: price });
      }
      const enriched = await this.enrichCards(withId);
      tastedAt = [...enriched, ...tastedAt];
      const tastedIds = new Set(tastedAt.map((v) => v.id).filter(Boolean));
      venues = (venues as { id: string }[]).filter((v) => !tastedIds.has(v.id));

      // best place to have this item вЂ” the venue where it's rated highest
      const byVenue = new Map<string, { sum: number; c: number }>();
      for (const r of reviews) {
        const vid = (r.attributes as any)?.venueId;
        if (!vid) continue;
        const e = byVenue.get(vid) ?? { sum: 0, c: 0 };
        e.sum += r.rating;
        e.c++;
        byVenue.set(vid, e);
      }
      // "Р›СѓС‡С€РёРµ РјРµСЃС‚Р°": rate each venue by THIS item's rating there (not the venue's
      // general rating) and sort best-first вЂ” the core of the redesigned search.
      for (const v of tastedAt as any[]) {
        const e = v.id ? byVenue.get(v.id) : null;
        v.itemRating = e ? e.sum / e.c : null;
        v.itemReviewCount = e ? e.c : 0;
      }
      (tastedAt as any[]).sort(
        (a, b) => (b.itemRating ?? -1) - (a.itemRating ?? -1) || (b.itemReviewCount ?? 0) - (a.itemReviewCount ?? 0),
      );
      let top: { vid: string; avg: number; c: number } | null = null;
      for (const [vid, e] of byVenue) {
        const avg = e.sum / e.c;
        if (!top || avg > top.avg) top = { vid, avg, c: e.c };
      }
      if (top && vById.get(top.vid)) {
        bestVenue = { name: vById.get(top.vid).name, rating: top.avg, count: top.c };
      }
      // fallback: no per-item review data yet в†’ the highest-rated venue serving it
      if (!bestVenue) {
        const ranked = [...(venues as any[]), ...tastedAt]
          .filter((v) => v && v.name && (v.reviewCount ?? 0) > 0)
          .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
        if (ranked.length) bestVenue = { name: ranked[0].name, rating: ranked[0].avgRating, count: ranked[0].reviewCount };
      }
      // OWNER RULE 16.07.2026: the detail photo is the photo of THIS venue's menu
      // link вЂ” exactly what the outer card shows. Priority: best venue's link,
      // then any link with a photo. Different venue в†’ its own photo, by design.
      const linkByVenue = new Map(itemLinks.map((l) => [l.venueId, l.photoUrl]));
      const venuePhoto =
        (top && linkByVenue.get(top.vid)) ||
        (venues as any[]).map((v) => linkByVenue.get(v.id)).find(Boolean) ||
        itemLinks.map((l) => l.photoUrl).find(Boolean) ||
        null;
      if (venuePhoto) (listing as any).photoUrl = venuePhoto;
    }

    let openNow: boolean | null = null;
    if (listing.hours) {
      try {
        const oh = new (OpeningHours as any)(listing.hours);
        openNow = oh.getState(new Date());
      } catch {
        openNow = null;
      }
    }

    // chain aggregate (weighted) вЂ” so a branch can show both its own and the
    // network rating; the chain rating is the aggregate of all its points.
    // events: for a venue в†’ its own posts; for a dish/drink в†’ posts (from any
    // venue) that mention THIS item, shown as a carousel on the item card.
    let events: any[] = [];
    if (listing.type === 'RESTAURANT') {
      events = await this.prisma.venueEvent.findMany({
        where: { venueId: id },
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { UsersService } from '../users/users.service';
import { SocialService } from './social.service';

@Controller()
@UseGuards(TelegramAuthGuard)
export class SocialController {
  constructor(
    private readonly social: SocialService,
    private readonly users: UsersService,
  ) {}

  private me(req: any) {
    return this.users.upsertFromTelegram(req.telegramUser);
  }

  @Get('me/profile')
  async profile(@Req() req: any) {
    const user = await this.me(req);
    return this.social.profile(user.id);
  }

  @Get('me/onboarding')
  async onboarding(@Req() req: any) {
    const user = await this.me(req);
    return this.social.onboarding(user.id);
  }

  @Post('me/onboarding')
  async setOnboarding(@Req() req: any, @Body() body: { categories: string[]; price?: number }) {
    const user = await this.me(req);
    return this.social.setOnboarding(user.id, body);
  }

  @Get('me/taste-ranking')
  async tasteRanking(@Req() req: any, @Query('itemId') itemId: string) {
    const user = await this.me(req);
    return this.social.tasteRanking(user.id, itemId);
  }

  @Get('me/skips')
  async skips(@Req() req: any) {
    const user = await this.me(req);
    return this.social.skips(user.id);
  }

  @Post('me/skip')
  async skip(@Req() req: any, @Body() body: { itemId: string; category?: string }) {
    const user = await this.me(req);
    return this.social.skip(user.id, body.itemId, body.category);
  }

  @Post('me/compare')
  async compare(
    @Req() req: any,
    @Body() body: { winnerId: string; loserId: string; reason?: string; category?: string },
  ) {
    const user = await this.me(req);
    return this.social.compare(user.id, body);
  }

  @Get('me/taste-profile')
  async tasteProfile(@Req() req: any) {
    const user = await this.me(req);
    return this.social.tasteProfile(user.id);
  }

  @Get('me/category-progress')
  async categoryProgress(@Req() req: any) {
    const user = await this.me(req);
    return this.social.categoryProgress(user.id);
  }

  @Get('me/stats')
  async stats(@Req() req: any) {
    const user = await this.me(req);
    return this.social.stats(user.id);
  }

  @Get('me/specializations')
  async specializations(@Req() req: any) {
    const user = await this.me(req);
    return this.social.specializations(user.id);
  }

  @Get('me/followers')
  async myFollowers(@Req() req: any) {
    const user = await this.me(req);
    return this.social.followers(user.id, user.id);
  }

  @Get('me/following')
  async myFollowing(@Req() req: any) {
    const user = await this.me(req);
    return this.social.following(user.id, user.id);
  }

  @Get('me/following-feed')
  async followingFeed(@Req() req: any) {
    const user = await this.me(req);
    return this.social.followingFeed(user.id);
  }

  @Get('users/search')
  async search(@Req() req: any, @Query('q') q: string) {
    const user = await this.me(req);
    return this.social.search(q, user.id);
  }

  @Get('users/:id/profile')
  async userProfile(@Req() req: any, @Param('id') id: string) {
    const user = await this.me(req);
    return this.social.userProfile(id, user.id);
  }

  @Get('users/:id/followers')
  async userFollowers(@Req() req: any, @Param('id') id: string) {
    const user = await this.me(req);
    return this.social.followers(id, user.id);
  }

  @Get('users/:id/following')
  async userFollowing(@Req() req: any, @Param('id') id: string) {
    const user = await this.me(req);
    return this.social.following(id, user.id);
  }

  @Post('users/:id/follow')
  async follow(@Req() req: any, @Param('id') id: string) {
    const user = await this.me(req);
    return this.social.follow(user.id, id);
  }

  @Delete('users/:id/follow')
  async unfollow(@Req() req: any, @Param('id') id: string) {
    const user = await this.me(req);
    return this.social.unfollow(user.id, id);
  }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SocialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Public user card with counts + whether the current user follows them. */
  private async publicUser(
    u: { id: string; firstName: string | null; username: string | null; photoUrl: string | null },
    meId: string,
  ) {
    const [reviews, followers, following, mine] = await Promise.all([
      this.prisma.review.count({ where: { userId: u.id, status: 'APPROVED' } }),
      this.prisma.follow.count({ where: { followingId: u.id } }),
      this.prisma.follow.count({ where: { followerId: u.id } }),
      meId
        ? this.prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: meId, followingId: u.id } },
          })
        : null,
    ]);
    return {
      id: u.id,
      firstName: u.firstName,
      username: u.username,
      photoUrl: u.photoUrl,
      reviews,
      followers,
      following,
      isFollowing: !!mine,
      isMe: u.id === meId,
    };
  }

  async followers(userId: string, meId: string) {
    const rows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      include: { follower: true },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(rows.map((r) => this.publicUser(r.follower, meId)));
  }

  async following(userId: string, meId: string) {
    const rows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      include: { following: true },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(rows.map((r) => this.publicUser(r.following, meId)));
  }

  async search(q: string, meId: string) {
    const query = (q ?? '').trim().replace(/^@/, '');
    if (!query) return [];
    const users = await this.prisma.user.findMany({
      where: {
        NOT: { id: meId },
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
    return Promise.all(users.map((u) => this.publicUser(u, meId)));
  }

  async userProfile(targetId: string, meId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!u) throw new NotFoundException('User not found');
    const card = await this.publicUser(u, meId);
    // PENDING included on purpose: the profile is a social surface like the follow
    // feed вЂ” moderation gates public ratings/the general feed, not a person's page.
    // Without this a fresh review shows on the wall but "disappears" on the profile.
    const reviewList = await this.prisma.review.findMany({
      where: { userId: targetId, status: { in: ['APPROVED', 'PENDING'] } },
      include: { listing: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    await this.attachItemVenues(reviewList);
    await this.attachVoteCounts(reviewList); // reactions must show real counts
    // taster LEVEL (same ladder as gamification) вЂ” shown on the public profile
    const LEVELS = [
      { title: 'РќРѕРІРёС‡РѕРє', icon: 'рџЊ±', need: 0 },
      { title: 'РСЃСЃР»РµРґРѕРІР°С‚РµР»СЊ', icon: 'рџ§­', need: 5 },
      { title: 'Р“СѓСЂРјР°РЅ', icon: 'рџЌ·', need: 15 },
      { title: 'РљСЂРёС‚РёРє', icon: 'вњ’пёЏ', need: 30 },
      { title: 'Р­РєСЃРїРµСЂС‚', icon: 'рџЋ“', need: 60 },
      { title: 'РђРјР±Р°СЃСЃР°РґРѕСЂ', icon: 'рџ‘‘', need: 120 },
    ];
    const allReviews = await this.prisma.review.findMany({
      where: { userId: targetId },
      select: { text: true, photoUrls: true },
    });
    const quality = allReviews.filter(
      (r) => (r.text?.trim().length ?? 0) >= 30 || (r.photoUrls?.length ?? 0) > 0,
    ).length;
    const level = [...LEVELS].reverse().find((l) => quality >= l.need) ?? LEVELS[0];
    // taster map (specializations) вЂ” everyone can see it on anyone's profile
    const specializations = (await this.specializations(targetId)).filter((s: any) => s.count > 0);
    return { ...card, reviewList, level: { title: level.title, icon: level.icon, quality }, specializations };
  }

  /** For dish/drink reviews, attach the venue that serves the item. */
  async attachItemVenues(reviews: any[]) {
    const items = reviews.filter((r) => r.listing && r.listing.type !== 'RESTAURANT');
    if (items.length === 0) return;

    // the exact place the user picked when rating (most accurate)
    const explicitIds = [
      ...new Set(items.map((r) => (r.attributes as any)?.venueId).filter(Boolean)),
    ] as string[];
    const venueById = new Map<string, { id: string; name: string }>();
    if (explicitIds.length) {
      const vs = await this.prisma.listing.findMany({
        where: { id: { in: explicitIds } },
        select: { id: true, name: true },
      });
      for (const v of vs) venueById.set(v.id, v);
    }

    // fallback: any venue that lists this item on its menu
    const itemIds = items.map((r) => r.listing.id);
    const links = await this.prisma.menuLink.findMany({
      where: { itemId: { in: itemIds } },
      include: { venue: true },
    });
    const venueByItem = new Map<string, { id: string; name: string }>();
    for (const l of links) {
      if (l.venue && !venueByItem.has(l.itemId)) {
        venueByItem.set(l.itemId, { id: l.venue.id, name: l.venue.name });
      }
    }

    for (const r of reviews) {
      const vid = (r.attributes as any)?.venueId;
      if (vid && venueById.has(vid)) r.venue = venueById.get(vid);
      else if (r.listing && venueByItem.has(r.listing.id)) r.venue = venueByItem.get(r.listing.id);
    }
  }

  /** Recent posts from people the user follows (for the home feed). */
  async followingFeed(meId: string, take = 20) {
    const ids = (
      await this.prisma.follow.findMany({
        where: { followerId: meId },
        select: { followingId: true },
      })
    ).map((f) => f.followingId);
    if (ids.length === 0) return [];
    // followers see their followees' tastings immediately (moderation still
    // governs public ratings + the general feed, not your own social feed)
    const list = await this.prisma.review.findMany({
      where: { userId: { in: ids } },
      include: { user: true, listing: true },
      orderBy: { createdAt: 'desc' },
      take,
    });
    await this.attachItemVenues(list);
    await this.attachCommentPreview(list);
    await this.attachVoteCounts(list);
    return list;
  }

  /** Adds reaction counts (рџ‘Ќрџ„рџЋрџ™Ђ) to each review for the social feed. */
  async attachVoteCounts(reviews: any[]) {
    const ids = reviews.map((r) => r.id);
    if (!ids.length) return;
    const grouped = await this.prisma.reviewVote.groupBy({
      by: ['reviewId', 'type'],
      where: { reviewId: { in: ids } },
      _count: true,
    });
    const vmap: Record<string, Record<string, number>> = {};
    for (const g of grouped) {
      (vmap[g.reviewId] ??= { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 })[g.type] = g._count;
    }
    for (const r of reviews) {
      r.voteCounts = vmap[r.id] ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 };
    }
  }

  /** commentCount + first comment per review (feed preview). */
  async attachCommentPreview(reviews: any[]) {
    const ids = reviews.map((r) => r.id);
    if (!ids.length) return;
    const comments = await this.prisma.comment.findMany({
      where: { reviewId: { in: ids } },
      include: { user: { select: { id: true, firstName: true, username: true, photoUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const byReview = new Map<string, any[]>();
    for (const c of comments) {
      if (!byReview.has(c.reviewId)) byReview.set(c.reviewId, []);
      byReview.get(c.reviewId)!.push(c);
    }
    for (const r of reviews) {
      const arr = byReview.get(r.id) ?? [];
      r.commentCount = arr.length;
      r.topComment = arr[0] ?? null;
    }
  }

  /**
   * After rating a dish/drink: where it lands in the user's OWN ranking for that
   * category, how it compares to their average, and a not-yet-tried item to taste
   * next. Pure personal data вЂ” works from the very first review, no crowd needed.
   */
  async tasteRanking(userId: string, itemId: string) {
    const item = await this.prisma.listing.findUnique({
      where: { id: itemId },
      for (const l of links) {
        if (l.venue && !venueByItem.has(l.itemId)) {
          venueByItem.set(l.itemId, { id: l.venue.id, name: l.venue.name });
        }
      }
      for (const r of out) if (r.listing && venueByItem.has(r.listing.id)) r.venue = venueByItem.get(r.listing.id);
    }
    return out;
  }

  /** Toggle a useful/funny/cool vote on a review, return fresh counts + mine. */
  async vote(userId: string, reviewId: string, type: VoteType) {
    const where = { reviewId_userId_type: { reviewId, userId, type } };
    const existing = await this.prisma.reviewVote.findUnique({ where });
    if (existing) {
      await this.prisma.reviewVote.delete({ where });
    } else {
      await this.prisma.reviewVote.create({ data: { reviewId, userId, type } });
      // notify the review's author (bell + capped bot push), fire-and-forget
      void (async () => {
        const review = await this.prisma.review.findUnique({
          where: { id: reviewId },
          select: { userId: true, listing: { select: { name: true } } },
        });
        if (!review || review.userId === userId) return;
        const emoji = { USEFUL: 'рџ‘Ќ', FUNNY: 'рџ„', COOL: 'рџЋ', OHNO: 'рџ™Ђ' }[type] ?? 'рџ‘Ќ';
        const name = await this.actorName(userId);
        await this.notifications.add({
          userId: review.userId,
          kind: 'vote',
          actorId: userId,
          actorName: name,
          reviewId,
          text: `${name} РѕС‚РјРµС‚РёР»(Р°) РІР°С€ РѕС‚Р·С‹РІ Рѕ В«${review.listing?.name ?? ''}В» ${emoji}`,
        });
      })().catch(() => {});
    }
    return this.voteState(reviewId, userId);
  }

  async voteState(reviewId: string, userId: string) {
    const votes = await this.prisma.reviewVote.findMany({
      where: { reviewId },
      select: { type: true, userId: true },
    });
    const counts: Record<string, number> = { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 };
    const mine: string[] = [];
    for (const v of votes) {
      counts[v.type]++;
      if (v.userId === userId) mine.push(v.type);
    }
    return { counts, mine };
  }
}
  @@id([venueId, itemId])
  @@map("menu_links")
}

model Review {
  id        String  @id @default(uuid())
  listingId String  @map("listing_id")
  listing   Listing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  userId    String  @map("user_id")
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  rating     Float // 1..5
  text       String?
  status     ReviewStatus @default(APPROVED) // PENDING when not geo-verified в†’ moderation
  ownerReply String? @map("owner_reply") // venue owner's public reply
  // type-specific fields: drinks -> { style, abv, servingStyle }; food -> { visitDate, dishName }
  attributes Json?
  photoUrls  String[] @map("photo_urls")
  videoUrls  String[] @map("video_urls")

  createdAt DateTime @default(now()) @map("created_at")

  votes ReviewVote[]
  comments Comment[]

  @@unique([listingId, userId])
  @@index([userId])
  @@map("reviews")
}

model ReviewVote {
  reviewId  String   @map("review_id")
  userId    String   @map("user_id")
  type      VoteType
  review    Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now()) @map("created_at")

  @@id([reviewId, userId, type])
  @@map("review_votes")
}

model OwnershipClaim {
  id        String      @id @default(uuid())
  listingId String      @map("listing_id")
  userId    String      @map("user_id")
  listing   Listing     @relation(fields: [listingId], references: [id], onDelete: Cascade)
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  status    ClaimStatus @default(PENDING)
  message   String?

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg -n \"const ACCEPT|const norm|let map|withImg|map\\[k\\]|existsSync\\(path.join\\(REF|resize\\(512|position: 'top'|strength', '0.2|professional food|const REF_SIM|textScore|best\\.s|best\\.refSim|DONE_FILE|done\\.add|photoUrl\" backend/prisma/regen-per-venue.mjs; rg -n \"function isJunk|любые пицц|комбо|FOOD_OVERRIDE|sanitizeName|wanted\" backend/prisma/menu-import.mjs backend/prisma/menu-import-remote.mjs; rg -n \"OR: \\[\\{ photoUrls|photoUrls: \\{ isEmpty: false \\}|photo is guaranteed|feedRanked|async feed\\(\" backend/src/listings/listings.service.ts; rg -n \"attachVoteCounts\\(|return this\\.listings\\.feedRanked|byId\\(@|return this\\.listings\\.byId|mine: \\[\\]|voteState\\(review\\.id\\)|api\\.vote\\(\" frontend/src/components/FeedPost.tsx frontend/src/components/PhotoPostModal.tsx frontend/src/components/ListingDetail.tsx backend/src/listings/listings.controller.ts backend/src/listings/listings.service.ts backend/src/social/social.service.ts backend/src/reviews/reviews.service.ts" in D:\Приложения\Yelp
 succeeded in 499ms:
3:// chain's menu links (menuLink.photoUrl). Same dish at a different chain → a
12://   --stage-check  CLIP-verify vs the dish name, upload, set menuLink.photoUrl for
41:const DONE_FILE = path.join(__dirname, 'perv-done.json');
42:const ACCEPT = 0.5;
43:const norm = (s) => (s ?? '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
60:  let map = {};
68:    const withImg = items.filter((it) => it?.name && it?.image && /^https?:/.test(it.image));
69:    if (!withImg.length) continue;
77:    for (const it of withImg) {
82:        select: { venueId: true, itemId: true, photoUrl: true },
86:      map[k] = { domain, name: it.name, image: it.image, links: links.map((l) => [l.venueId, l.itemId]) };
87:      if (fs.existsSync(path.join(REF, k + '.png'))) continue;
96:          .resize(512, 512, { fit: 'cover', position: 'top' })
111:  try { done = new Set(JSON.parse(fs.readFileSync(DONE_FILE, 'utf8'))); } catch { /* none */ }
127:          '-m', 'sd_turbo.safetensors', '-i', ref, '--strength', '0.2',
130:          '-p', `professional food photography, the dish fills most of the frame in the upper part, appetizing, natural light, soft blurred background below, high detail`,
195:  function textScore(imgVec, vecs) {
201:  const REF_SIM = 0.82; // generated image must stay CLOSE to the official reference
209:  try { done = new Set(JSON.parse(fs.readFileSync(DONE_FILE, 'utf8'))); } catch { /* none */ }
214:    const m = map[k];
227:        const s = textScore(imgVec, labels);
229:        if (!best || s + (refSim ?? 0) > best.s + (best.refSim ?? 0)) best = { s, refSim, file };
234:    if (best.s < ACCEPT || (best.refSim != null && best.refSim < REF_SIM)) {
236:      if (best.refSim != null && best.refSim < REF_SIM) console.log(`  reject ${m.name}: ушло от референса (sim=${best.refSim.toFixed(2)})`);
245:        await retryDb(() => p.menuLink.update({ where: { venueId_itemId: { venueId, itemId } }, data: { photoUrl: url } })).catch(() => {});
247:      done.add(k);
249:      if (up % 20 === 0) { fs.writeFileSync(DONE_FILE, JSON.stringify([...done])); console.log(`  залито ${up}`); }
252:  fs.writeFileSync(DONE_FILE, JSON.stringify([...done]));
backend/prisma/menu-import-remote.mjs:35:function sanitizeName(name) {
backend/prisma/menu-import-remote.mjs:45:function isJunk(name) {
backend/prisma/menu-import-remote.mjs:50:  if (/любые пицц|комбо|\bсет\b|\bнабор\b|меню дня|за \d+\s*₽|выгодн|подарок|конструктор|собери|акци|скидк|сертификат|доставк|для офиса|идеальных|\+ ?\d|\d ?\+ ?\d/.test(n)) return true;
backend/prisma/menu-import-remote.mjs:85:  const wanted = new Map(); // key type|lower → {type,name,category,photoUrl,price}
backend/prisma/menu-import-remote.mjs:87:    const name = sanitizeName(String(raw.name ?? '').trim().replace(/\s+/g, ' '));
backend/prisma/menu-import-remote.mjs:93:    if (!wanted.has(key)) wanted.set(key, { type, name, category, photoUrl, price });
backend/prisma/menu-import-remote.mjs:95:  const names = [...wanted.values()].map((w) => w.name);
backend/prisma/menu-import-remote.mjs:105:  const toCreate = [...wanted.entries()]
backend/prisma/menu-import-remote.mjs:117:  for (const [k, w] of wanted) {
backend/prisma/menu-import-remote.mjs:124:  for (const [k, w] of wanted) {
backend/prisma/menu-import-remote.mjs:134:  console.log(`${domain}: ${venues.length} venues, ${wanted.size} items (+${toCreate.length} new), +${links} links`);
backend/prisma/menu-import.mjs:34:const FOOD_OVERRIDE = /пицц|бургер|салат|ролл|спагетти|шаурм|шаверм|стейк|сэндвич|сендвич|донер|кебаб|\bсуп\b|наггетс|картоф|хачапур|хинкал|\bвок\b|боул|поке|том.?ям|лазань|ризотто|карбонар|болонье|тост|брускетт|сырник|блин|паст/i;
backend/prisma/menu-import.mjs:47:  if (!FOOD_OVERRIDE.test(n) && DRINK_RE.test(n)) {
backend/prisma/menu-import.mjs:72:function sanitizeName(name) {
backend/prisma/menu-import.mjs:84:function isJunk(name) {
backend/prisma/menu-import.mjs:88:  if (/^\d+\s*(любые|пицц|штук|шт\b)/.test(n)) return true; // "3 любые пиццы"
backend/prisma/menu-import.mjs:89:  if (/любые пицц|комбо|\bсет\b|\bнабор\b|меню дня|за \d+\s*₽|выгодн|подарок|конструктор|собери|акци|скидк|сертификат|доставк|для офиса|идеальных|\+ ?\d|\d ?\+ ?\d/.test(n)) return true;
backend/prisma/menu-import.mjs:161:      const name = sanitizeName(raw.name.trim().replace(/\s+/g, ' '));
585:  async feedRanked(viewerId: string | null, take = 20) {
596:        OR: [{ photoUrls: { isEmpty: false } }, { text: { gt: '' } }],
616:        where: { status: 'APPROVED', OR: [{ photoUrls: { isEmpty: false } }, { text: { gt: '' } }], userId: viewerId },
687:        const quality = 0.25 + textQ + engQ; // photo is guaranteed here → base 0.25
754:  async feed(take = 20) {
758:        photoUrls: { isEmpty: false },
backend/src/social/social.service.ts:90:    await this.attachVoteCounts(reviewList); // reactions must show real counts
backend/src/social/social.service.ts:170:    await this.attachVoteCounts(list);
backend/src/social/social.service.ts:175:  async attachVoteCounts(reviews: any[]) {
frontend/src/components/ListingDetail.tsx:592:      mine: [],
frontend/src/components/PhotoPostModal.tsx:47:    mine: [],
frontend/src/components/PhotoPostModal.tsx:66:    api.voteState(review.id).then(setVote).catch(() => {});
frontend/src/components/PhotoPostModal.tsx:70:  const doVote = (t: VoteType) => api.vote(review.id, t).then(setVote).catch(() => {});
frontend/src/components/FeedPost.tsx:55:    mine: [],
frontend/src/components/FeedPost.tsx:58:    api.vote(review.id, t).then(setVote).catch(() => {});
backend/src/listings/listings.service.ts:728:    await this.attachVoteCounts(page);
backend/src/listings/listings.service.ts:766:    await this.attachVoteCounts(list);
backend/src/listings/listings.service.ts:771:  async attachVoteCounts(reviews: any[]) {
backend/src/listings/listings.controller.ts:106:    return this.listings.feedRanked(viewer?.id ?? null, take ? Number(take) : undefined);
backend/src/listings/listings.controller.ts:200:  byId(@Param('id') id: string) {
backend/src/listings/listings.controller.ts:201:    return this.listings.byId(id);

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$lines = Get-Content backend/src/listings/listings.service.ts; for($i=1459;$i -lt [Math]::Min($lines.Length,1715);$i++){ '"'{0,5}: {1}' -f ("'$i+1),$lines[$i] }; $lines2 = Get-Content frontend/src/components/ListingDetail.tsx; for($i=400;$i -lt 470;$i++){ '"'{0,5}: {1}' -f ("'$i+1),$lines2[$i] }; for($i=1270;$i -lt 1410;$i++){ '"'{0,5}: {1}' -f ("'$i+1),$lines2[$i] }' in D:\Приложения\Yelp
 succeeded in 1783ms:
 1460:   async byId(id: string) {
 1461:     const listing = await this.prisma.listing.findUnique({
 1462:       where: { id },
 1463:       include: {
 1464:         reviews: {
 1465:           where: { status: 'APPROVED' },
 1466:           include: { user: true },
 1467:           orderBy: { createdAt: 'desc' },
 1468:         },
 1469:       },
 1470:     });
 1471:     if (!listing) return null;
 1472: 
 1473:     // count a profile view (fire-and-forget вЂ” owner analytics)
 1474:     this.prisma.listing
 1475:       .update({ where: { id }, data: { views: { increment: 1 } } })
 1476:       .catch(() => {});
 1477: 
 1478:     // lazily resolve a street address from coords (OSM has only ~10% of them).
 1479:     // Done on open + persisted, so it's policy-friendly (only viewed venues).
 1480:     if (listing.type === 'RESTAURANT' && !listing.address && listing.lat != null && listing.lng != null) {
 1481:       const addr = await this.reverseGeocode(listing.lat, listing.lng);
 1482:       if (addr) {
 1483:         listing.address = addr;
 1484:         this.prisma.listing.update({ where: { id }, data: { address: addr } }).catch(() => {});
 1485:       }
 1486:     }
 1487: 
 1488:     let topDishes: unknown[] = [];
 1489:     let topDrinks: unknown[] = [];
 1490:     let venues: unknown[] = [];
 1491:     let pendingItems: unknown[] = [];
 1492:     let itemLinks: { venueId: string; photoUrl: string | null }[] = [];
 1493: 
 1494:     if (listing.type === 'RESTAURANT') {
 1495:       const links = await this.prisma.menuLink.findMany({
 1496:         where: { venueId: id },
 1497:         include: { item: true },
 1498:       });
 1499:       const approved = links.filter((l) => l.status === 'APPROVED');
 1500:       // a chain shares one menu AND one set of ratings: count reviews tasted at
 1501:       // ANY branch of the chain, not just this point.
 1502:       const chainWhere = listing.groupKey
 1503:         ? { groupKey: listing.groupKey, type: 'RESTAURANT' as const }
 1504:         : { groupKey: null, name: { equals: listing.name, mode: 'insensitive' as const }, type: 'RESTAURANT' as const };
 1505:       const chainVenueIds = new Set(
 1506:         (await this.prisma.listing.findMany({ where: chainWhere, select: { id: true } })).map((b) => b.id),
 1507:       );
 1508:       chainVenueIds.add(id);
 1509:       // community price/count: from APPROVED reviews left at this chain
 1510:       const itemIds = approved.map((l) => l.item.id);
 1511:       const venueReviews = itemIds.length
 1512:         ? await this.prisma.review.findMany({
 1513:             where: { status: 'APPROVED', listingId: { in: itemIds } },
 1514:             select: { listingId: true, attributes: true, rating: true },
 1515:             orderBy: { createdAt: 'desc' },
 1516:           })
 1517:         : [];
 1518:       const priceByItem = new Map<string, number>();
 1519:       const countByItem = new Map<string, number>();
 1520:       const sumByItem = new Map<string, number>();
 1521:       for (const r of venueReviews) {
 1522:         const a = r.attributes as any;
 1523:         if (!chainVenueIds.has(a?.venueId)) continue; // reviews tasted at this chain
 1524:         countByItem.set(r.listingId, (countByItem.get(r.listingId) ?? 0) + 1);
 1525:         sumByItem.set(r.listingId, (sumByItem.get(r.listingId) ?? 0) + (r as any).rating);
 1526:         if (a?.price && !priceByItem.has(r.listingId)) priceByItem.set(r.listingId, Number(a.price));
 1527:       }
 1528:       const linkPrice = new Map(approved.map((l) => [l.item.id, l.price]));
 1529:       const buildItems = async (t: string) => {
 1530:         // pre-trim by global rating, then re-rank by rating AT THIS VENUE
 1531:         const raw = approved
 1532:           .filter((l) => l.item.type === t)
 1533:           .map((l) => l.item)
 1534:           .sort((a, b) => b.avgRating - a.avgRating)
 1535:           .slice(0, 20);
 1536:         const cards = await this.enrichCards(raw);
 1537:         const withRating = cards.map((c) => {
 1538:           const cnt = countByItem.get(c.id) ?? 0;
 1539:           return {
 1540:             ...c,
 1541:             // moderator/owner-set price wins; otherwise community price from reviews
 1542:             price: linkPrice.get(c.id) ?? priceByItem.get(c.id) ?? null,
 1543:             venueReviews: cnt,
 1544:             // average rating of THIS item AT THIS venue (not the global average)
 1545:             venueRating: cnt ? (sumByItem.get(c.id) ?? 0) / cnt : null,
 1546:           };
 1547:         });
 1548:         // carousel sorted by rating вЂ” best on the LEFT, descending (venue rating first,
 1549:         // then the item's global rating as a tiebreaker)
 1550:         withRating.sort(
 1551:           (a, b) => (b.venueRating ?? b.avgRating ?? 0) - (a.venueRating ?? a.avgRating ?? 0),
 1552:         );
 1553:         return withRating.slice(0, 8);
 1554:       };
 1555:       topDishes = await buildItems('DISH');
 1556:       topDrinks = await buildItems('DRINK');
 1557:       // user-proposed items awaiting owner approval (still reviewable)
 1558:       pendingItems = links.filter((l) => l.status === 'PENDING').map((l) => l.item);
 1559:     } else {
 1560:       const links = await this.prisma.menuLink.findMany({
 1561:         where: { itemId: id, status: 'APPROVED' },
 1562:         include: { venue: true },
 1563:       });
 1564:       itemLinks = links; // kept for the venue-photo rule below
 1565:       venues = links
 1566:         // keep the menu price so "Р“РґРµ РїРѕРїСЂРѕР±РѕРІР°С‚СЊ" shows how much the item costs there
 1567:         .map((l) => ({ ...l.venue, menuPrice: l.price }))
 1568:         .sort((a, b) => b.avgRating - a.avgRating)
 1569:         .slice(0, 8);
 1570:     }
 1571: 
 1572:     // attach vote counts (useful/funny/cool) to each review
 1573:     const reviewIds = listing.reviews.map((r) => r.id);
 1574:     const grouped = reviewIds.length
 1575:       ? await this.prisma.reviewVote.groupBy({
 1576:           by: ['reviewId', 'type'],
 1577:           where: { reviewId: { in: reviewIds } },
 1578:           _count: true,
 1579:         })
 1580:       : [];
 1581:     const vmap: Record<string, Record<string, number>> = {};
 1582:     for (const g of grouped) {
 1583:       (vmap[g.reviewId] ??= { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 })[g.type] = g._count;
 1584:     }
 1585:     const reviews: any[] = listing.reviews.map((r) => ({
 1586:       ...r,
 1587:       voteCounts: vmap[r.id] ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
 1588:     }));
 1589:     // the most USEFUL reviews lead (community-curated), recency breaks ties
 1590:     reviews.sort(
 1591:       (a, b) =>
 1592:         b.voteCounts.USEFUL - a.voteCounts.USEFUL ||
 1593:         new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
 1594:     );
 1595: 
 1596:     // for a dish/drink, tag each review with the place the user tasted it at
 1597:     let tastedAt: any[] = [];
 1598:     let bestVenue: { name: string; rating: number; count: number } | null = null;
 1599:     if (listing.type !== 'RESTAURANT') {
 1600:       const venueIds = [
 1601:         ...new Set(reviews.map((r) => (r.attributes as any)?.venueId).filter(Boolean)),
 1602:       ] as string[];
 1603:       const vById = new Map<string, any>();
 1604:       if (venueIds.length) {
 1605:         const vs = await this.prisma.listing.findMany({ where: { id: { in: venueIds } } });
 1606:         for (const v of vs) vById.set(v.id, v);
 1607:       }
 1608:       const onlyVenue = (venues as any[]).length === 1 ? (venues[0] as any) : null;
 1609:       for (const r of reviews) {
 1610:         const vid = (r.attributes as any)?.venueId;
 1611:         const vname = (r.attributes as any)?.venueName;
 1612:         r.venue =
 1613:           (vid && vById.get(vid)) ||
 1614:           (vname ? { id: null, name: vname, pending: true } : null) ||
 1615:           onlyVenue;
 1616:       }
 1617: 
 1618:       // "РџСЂРѕР±РѕРІР°Р»Рё РІ" = full venue cards (rating + address + the price paid)
 1619:       const seenT = new Set<string>();
 1620:       const withId: any[] = [];
 1621:       for (const r of reviews) {
 1622:         const v = r.venue;
 1623:         if (!v) continue;
 1624:         const key = v.id ?? v.name;
 1625:         if (seenT.has(key)) continue;
 1626:         seenT.add(key);
 1627:         const price = (r.attributes as any)?.price ?? null;
 1628:         if (v.id) withId.push({ ...v, menuPrice: price });
 1629:         else tastedAt.push({ ...v, menuPrice: price });
 1630:       }
 1631:       const enriched = await this.enrichCards(withId);
 1632:       tastedAt = [...enriched, ...tastedAt];
 1633:       const tastedIds = new Set(tastedAt.map((v) => v.id).filter(Boolean));
 1634:       venues = (venues as { id: string }[]).filter((v) => !tastedIds.has(v.id));
 1635: 
 1636:       // best place to have this item вЂ” the venue where it's rated highest
 1637:       const byVenue = new Map<string, { sum: number; c: number }>();
 1638:       for (const r of reviews) {
 1639:         const vid = (r.attributes as any)?.venueId;
 1640:         if (!vid) continue;
 1641:         const e = byVenue.get(vid) ?? { sum: 0, c: 0 };
 1642:         e.sum += r.rating;
 1643:         e.c++;
 1644:         byVenue.set(vid, e);
 1645:       }
 1646:       // "Р›СѓС‡С€РёРµ РјРµСЃС‚Р°": rate each venue by THIS item's rating there (not the venue's
 1647:       // general rating) and sort best-first вЂ” the core of the redesigned search.
 1648:       for (const v of tastedAt as any[]) {
 1649:         const e = v.id ? byVenue.get(v.id) : null;
 1650:         v.itemRating = e ? e.sum / e.c : null;
 1651:         v.itemReviewCount = e ? e.c : 0;
 1652:       }
 1653:       (tastedAt as any[]).sort(
 1654:         (a, b) => (b.itemRating ?? -1) - (a.itemRating ?? -1) || (b.itemReviewCount ?? 0) - (a.itemReviewCount ?? 0),
 1655:       );
 1656:       let top: { vid: string; avg: number; c: number } | null = null;
 1657:       for (const [vid, e] of byVenue) {
 1658:         const avg = e.sum / e.c;
 1659:         if (!top || avg > top.avg) top = { vid, avg, c: e.c };
 1660:       }
 1661:       if (top && vById.get(top.vid)) {
 1662:         bestVenue = { name: vById.get(top.vid).name, rating: top.avg, count: top.c };
 1663:       }
 1664:       // fallback: no per-item review data yet в†’ the highest-rated venue serving it
 1665:       if (!bestVenue) {
 1666:         const ranked = [...(venues as any[]), ...tastedAt]
 1667:           .filter((v) => v && v.name && (v.reviewCount ?? 0) > 0)
 1668:           .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
 1669:         if (ranked.length) bestVenue = { name: ranked[0].name, rating: ranked[0].avgRating, count: ranked[0].reviewCount };
 1670:       }
 1671:       // OWNER RULE 16.07.2026: the detail photo is the photo of THIS venue's menu
 1672:       // link вЂ” exactly what the outer card shows. Priority: best venue's link,
 1673:       // then any link with a photo. Different venue в†’ its own photo, by design.
 1674:       const linkByVenue = new Map(itemLinks.map((l) => [l.venueId, l.photoUrl]));
 1675:       const venuePhoto =
 1676:         (top && linkByVenue.get(top.vid)) ||
 1677:         (venues as any[]).map((v) => linkByVenue.get(v.id)).find(Boolean) ||
 1678:         itemLinks.map((l) => l.photoUrl).find(Boolean) ||
 1679:         null;
 1680:       if (venuePhoto) (listing as any).photoUrl = venuePhoto;
 1681:     }
 1682: 
 1683:     let openNow: boolean | null = null;
 1684:     if (listing.hours) {
 1685:       try {
 1686:         const oh = new (OpeningHours as any)(listing.hours);
 1687:         openNow = oh.getState(new Date());
 1688:       } catch {
 1689:         openNow = null;
 1690:       }
 1691:     }
 1692: 
 1693:     // chain aggregate (weighted) вЂ” so a branch can show both its own and the
 1694:     // network rating; the chain rating is the aggregate of all its points.
 1695:     // events: for a venue в†’ its own posts; for a dish/drink в†’ posts (from any
 1696:     // venue) that mention THIS item, shown as a carousel on the item card.
 1697:     let events: any[] = [];
 1698:     if (listing.type === 'RESTAURANT') {
 1699:       events = await this.prisma.venueEvent.findMany({
 1700:         where: { venueId: id },
 1701:         orderBy: { publishedAt: 'desc' },
 1702:         take: 12,
 1703:       });
 1704:     } else {
 1705:       const key = listing.name
 1706:         .split(/\s+/)
 1707:         .sort((a, b) => b.length - a.length)[0]
 1708:         ?.toLowerCase();
 1709:       if (key && key.length >= 4) {
 1710:         events = await this.prisma.venueEvent.findMany({
 1711:           where: {
 1712:             kind: 'dish',
 1713:             aiProcessed: true,
 1714:             // match on the new dish's NAME (title), so the item card only shows
 1715:             // venues where THIS dish is the new menu position вЂ” not any post that
  401:     );
  402:     sections.forEach(([r]) => r.current && obs.observe(r.current));
  403:     return () => obs.disconnect();
  404:   }, [data]);
  405:   const [questions, setQuestions] = useState<Question[] | null>(null);
  406:   const [qDraft, setQDraft] = useState('');
  407:   const [aDraft, setADraft] = useState<Record<string, string>>({});
  408: 
  409:   // reviews just posted from THIS session вЂ” re-merged after every refetch so the
  410:   // user's own review never blinks away while server moderation catches up
  411:   const freshReviews = useRef<any[]>([]);
  412:   const load = useCallback(() => {
  413:     api
  414:       .listing(id)
  415:       .then((d) => {
  416:         if (freshReviews.current.length && d.type !== 'RESTAURANT') {
  417:           const have = new Set((d.reviews ?? []).map((r: any) => r.id));
  418:           const missing = freshReviews.current.filter((r) => !have.has(r.id));
  419:           if (missing.length) {
  420:             d = { ...d, reviews: [...missing, ...(d.reviews ?? [])], reviewCount: (d.reviewCount ?? 0) + missing.length };
  421:           }
  422:         }
  423:         setData(d);
  424:         pushRecent({ ...(d as Listing), placeholderPhoto: d.placeholderPhotos?.[0] ?? null });
  425:         // the card's history: who tasted it first (only when reviews exist)
  426:         setFirstTaster(null);
  427:         if (d.reviewCount > 0 && d.type !== 'RESTAURANT') {
  428:           api.firstTasterOf(id).then(setFirstTaster).catch(() => {});
  429:         }
  430:       })
  431:       .catch(() => {});
  432:   }, [id]);
  433: 
  434:   useEffect(() => {
  435:     setData(null);
  436:     freshReviews.current = []; // fresh reviews belong to the previous card
  437:     setQuestions(null);
  438:     setTab('menu');
  439:     load();
  440:   }, [load]);
  441: 
  442:   useEffect(() => {
  443:     if (questions === null) {
  444:       api.questions(id).then(setQuestions).catch(() => {});
  445:     }
  446:   }, [id, questions]);
  447: 
  448:   // when opened in "rate now" mode, kick off the rate flow once data is in
  449:   const autoRatedRef = useRef(false);
  450:   useEffect(() => {
  451:     if (autoRate == null || !data || autoRatedRef.current) return;
  452:     autoRatedRef.current = true;
  453:     startRate(autoRate || undefined); // 0 = open the flow without a preselected star
  454:     // eslint-disable-next-line react-hooks/exhaustive-deps
  455:   }, [data, autoRate]);
  456: 
  457:   // reflect whether this venue is already in the user's favorites
  458:   useEffect(() => {
  459:     api
  460:       .favorites()
  461:       .then((list) => setFav(list.some((f) => f.listingId === id)))
  462:       .catch(() => {});
  463:   }, [id]);
  464:   const toggleFav = () => {
  465:     const next = !fav;
  466:     setFav(next);
  467:     (next ? api.addFavorite(id) : api.removeFavorite(id)).catch(() => setFav(!next));
  468:     onChanged?.();
  469:   };
  470: 
 1271:           </div>
 1272:         )}
 1273: 
 1274:         {/* рџ¤– РџРѕС…РѕР¶РёРµ вЂ” embedding neighbours; gated (hidden for new users) */}
 1275:         {!isRestaurant && <SimilarItems id={data.id} onOpen={(lid) => setId(lid)} />}
 1276: 
 1277:         <div ref={reviewsRef} className="feed-section">
 1278:           <div className="section-title big">РћС‚Р·С‹РІС‹ ({data.reviews.length})</div>
 1279:           <div className="tab-pane">
 1280:             <div className="rate-block">
 1281:               <div className="rb-head">
 1282:                 {myAvatar ? (
 1283:                   <img className="rb-avatar" src={myAvatar} alt="" style={{ objectFit: 'cover' }} />
 1284:                 ) : (
 1285:                   <div className="rb-avatar">рџ‘¤</div>
 1286:                 )}
 1287:                 <div>
 1288:                   <div className="rb-name">РћС†РµРЅРёС‚Рµ {isRestaurant ? 'Р·Р°РІРµРґРµРЅРёРµ' : 'РїРѕР·РёС†РёСЋ'}</div>
 1289:                   <div className="rb-sub">РќР°Р¶РјРёС‚Рµ РЅР° Р·РІС‘Р·РґС‹ РёР»Рё РґРѕР±Р°РІСЊС‚Рµ С„РѕС‚Рѕ</div>
 1290:                 </div>
 1291:               </div>
 1292:               <div className="rate-stars" onMouseLeave={() => setHoverRate(0)}>
 1293:                 {[1, 2, 3, 4, 5].map((n) => (
 1294:                   <button
 1295:                     key={n}
 1296:                     className={'rate-star' + (n <= hoverRate ? ' on' : '')}
 1297:                     onMouseEnter={() => setHoverRate(n)}
 1298:                     onClick={() => startRate(n)}
 1299:                   >
 1300:                     в…
 1301:                   </button>
 1302:                 ))}
 1303:               </div>
 1304:               <div className="rate-actions">
 1305:                 <button className="rate-act" onClick={() => photoInputRef.current?.click()} disabled={photoBusy}>
 1306:                   {photoBusy ? 'вЏі Р—Р°РіСЂСѓР·РєР°вЂ¦' : 'рџ“· Р”РѕР±Р°РІРёС‚СЊ С„РѕС‚Рѕ'}
 1307:                 </button>
 1308:                 <button className="rate-act primary" onClick={() => startRate()}>
 1309:                   в­ђ РћС†РµРЅРёС‚СЊ
 1310:                 </button>
 1311:               </div>
 1312:               {/* "Р”РѕР±Р°РІРёС‚СЊ С„РѕС‚Рѕ" uploads a photo to this card WITHOUT a review/rating */}
 1313:               <input
 1314:                 ref={photoInputRef}
 1315:                 type="file"
 1316:                 accept="image/*"
 1317:                 multiple
 1318:                 style={{ display: 'none' }}
 1319:                 onChange={async (e) => {
 1320:                   const file = e.target.files?.[0];
 1321:                   e.target.value = '';
 1322:                   if (!file) return;
 1323:                   setPhotoBusy(true);
 1324:                   try {
 1325:                     const url = await api.upload(file);
 1326:                     await api.addPhoto(data.id, url);
 1327:                     load();
 1328:                   } catch { /* ignore */ }
 1329:                   setPhotoBusy(false);
 1330:                 }}
 1331:               />
 1332:             </div>
 1333:             {data.reviews.length > 0 && (
 1334:               <div className="histogram">
 1335:                 {[5, 4, 3, 2, 1].map((star) => {
 1336:                   const count = data.reviews.filter((r) => Math.round(r.rating) === star).length;
 1337:                   const pct = (count / data.reviews.length) * 100;
 1338:                   return (
 1339:                     <div key={star} className="hist-row">
 1340:                       <span className="hist-label">{star}в…</span>
 1341:                       <div className="hist-bar">
 1342:                         <div className="hist-fill" style={{ width: `${pct}%` }} />
 1343:                       </div>
 1344:                       <span className="hist-count">{count}</span>
 1345:                     </div>
 1346:                   );
 1347:                 })}
 1348:               </div>
 1349:             )}
 1350:             {data.reviews.length === 0 ? (
 1351:               <div className="meta" style={{ padding: '6px 2px', color: 'var(--hint)' }}>
 1352:                 РџРѕРєР° РЅРµС‚ РѕС‚Р·С‹РІРѕРІ. Р‘СѓРґСЊС‚Рµ РїРµСЂРІС‹Рј!
 1353:               </div>
 1354:             ) : (
 1355:               data.reviews.map((r) => (
 1356:                 <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
 1357:                   <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
 1358:                     <b>{r.user?.firstName ?? r.user?.username ?? 'Р“РѕСЃС‚СЊ'}</b>
 1359:                     <Stars value={r.rating} />
 1360:                   </div>
 1361:                   {!isRestaurant && r.venue && (
 1362:                     <div style={{ fontSize: 13, color: 'var(--hint)', marginTop: 2 }}>
 1363:                       рџ“Ќ {r.venue.name}
 1364:                     </div>
 1365:                   )}
 1366:                   {r.text && <div style={{ fontSize: 14, marginTop: 2 }}>{r.text}</div>}
 1367:                   <ReviewAttrs attributes={r.attributes} />
 1368:                   {(r.photoUrls?.length > 0 || r.videoUrls?.length > 0) && (
 1369:                     <div className="photo-thumbs">
 1370:                       {r.photoUrls?.map((u) => (
 1371:                         <img key={u} src={u} alt="" />
 1372:                       ))}
 1373:                       {r.videoUrls?.map((u) => (
 1374:                         <video key={u} src={u} controls playsInline />
 1375:                       ))}
 1376:                     </div>
 1377:                   )}
 1378:                   <div className="vote-row">
 1379:                     {(['USEFUL', 'FUNNY', 'COOL', 'OHNO'] as VoteType[]).map((t) => {
 1380:                       const vs = voteState(r);
 1381:                       return (
 1382:                         <button
 1383:                           key={t}
 1384:                           className={'vote-btn' + (vs.mine.includes(t) ? ' active' : '')}
 1385:                           onClick={() => doVote(r.id, t)}
 1386:                         >
 1387:                           {VOTE_LABEL[t]}
 1388:                           {vs.counts[t] ? ` ${vs.counts[t]}` : ''}
 1389:                         </button>
 1390:                       );
 1391:                     })}
 1392:                   </div>
 1393:                   {r.ownerReply && (
 1394:                     <div className="owner-reply">
 1395:                       <b>РћС‚РІРµС‚ Р·Р°РІРµРґРµРЅРёСЏ:</b> {r.ownerReply}
 1396:                     </div>
 1397:                   )}
 1398:                 </div>
 1399:               ))
 1400:             )}
 1401:             {isRestaurant && (
 1402:               <div className="claim-line">
 1403:                 {claimed ? (
 1404:                   <span style={{ color: 'var(--hint)' }}>
 1405:                     Р—Р°СЏРІРєР° РЅР° РІР»Р°РґРµРЅРёРµ РѕС‚РїСЂР°РІР»РµРЅР° РЅР° РїСЂРѕРІРµСЂРєСѓ вњ“
 1406:                   </span>
 1407:                 ) : (
 1408:                   <button className="link-btn" onClick={doClaim}>
 1409:                     Р’С‹ РІР»Р°РґРµР»РµС† СЌС‚РѕРіРѕ РјРµСЃС‚Р°? Р—Р°СЏРІРёС‚СЊ РїСЂР°РІР°
 1410:                   </button>

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$l=Get-Content backend/src/listings/listings.service.ts; for($i=1710;$i -lt [Math]::Min($l.Length,1815);$i++){ '"'{0,5}: {1}' -f ("'$i+1),$l[$i] }; rg -n "reviewCount|avgRating|chain'"\\?|data\\.chain|reviews\\.length|section-title big\" frontend/src/components/ListingDetail.tsx | Select-Object -First 80" in D:\Приложения\Yelp
 succeeded in 2112ms:
 1711:           where: {
 1712:             kind: 'dish',
 1713:             aiProcessed: true,
 1714:             // match on the new dish's NAME (title), so the item card only shows
 1715:             // venues where THIS dish is the new menu position вЂ” not any post that
 1716:             // happens to mention the word somewhere in its text
 1717:             title: { contains: key, mode: 'insensitive' },
 1718:             // only real post photos of the dish, never fetched stock images
 1719:             photoUrl: { not: null },
 1720:             NOT: [
 1721:               { photoUrl: { contains: 'pexels' } },
 1722:               { photoUrl: { contains: 'unsplash' } },
 1723:               { photoUrl: { contains: 'wikimedia' } },
 1724:               { photoUrl: { contains: 'pixabay' } },
 1725:             ],
 1726:           },
 1727:           orderBy: { publishedAt: 'desc' },
 1728:           take: 12,
 1729:           include: { venue: { select: { id: true, name: true, address: true, lat: true, lng: true } } },
 1730:         });
 1731:       }
 1732:     }
 1733:     // short location for each event's venue (address, else "РњРѕСЃРєРІР°") вЂ” the item card
 1734:     // shows WHERE to try it, not the dish name again
 1735:     for (const e of events) {
 1736:       if (e.venue) e.venue.cityLabel = inMoscow(e.venue.lat, e.venue.lng) ? 'РњРѕСЃРєРІР°' : undefined;
 1737:     }
 1738: 
 1739:     let chain: { avgRating: number; reviewCount: number; branchCount: number } | null = null;
 1740:     let branches: any[] = [];
 1741:     if (listing.type === 'RESTAURANT') {
 1742:       // siblings of the chain: by group_key, else by identical name (OSM chains)
 1743:       const where = listing.groupKey
 1744:         ? { groupKey: listing.groupKey }
 1745:         : { groupKey: null, name: { equals: listing.name, mode: 'insensitive' as const } };
 1746:       const all = await this.prisma.listing.findMany({
 1747:         where: { ...where, type: 'RESTAURANT' },
 1748:         orderBy: { reviewCount: 'desc' },
 1749:       });
 1750:       if (all.length > 1) {
 1751:         const rc = all.reduce((s, b) => s + b.reviewCount, 0);
 1752:         const w = all.reduce((s, b) => s + b.avgRating * b.reviewCount, 0);
 1753:         chain = { avgRating: rc ? w / rc : 0, reviewCount: rc, branchCount: all.length };
 1754:         // enrichCards adds cityLabel + placeholder photo so points render as full cards
 1755:         branches = await this.enrichCards(all.filter((b) => b.id !== id));
 1756:         // backfill missing street addresses in the background (throttled, persisted)
 1757:         if (branches.some((b: any) => !b.address)) void this.fillBranchAddresses(branches);
 1758:       }
 1759:     }
 1760: 
 1761:     // tags from category + cuisine (cuisine tokens normalized to readable RU labels)
 1762:     const tags = Array.from(
 1763:       new Set(
 1764:         [
 1765:           listing.category,
 1766:           ...(listing.cuisine
 1767:             ? listing.cuisine.split(',').map((s) => cuisineLabel(s.trim()))
 1768:             : []),
 1769:         ].filter((t): t is string => !!t),
 1770:       ),
 1771:     );
 1772: 
 1773:     // normalize the auto-generated "РљСѓС…РЅСЏ: <token>" description to readable labels
 1774:     let cleanDescription = listing.description;
 1775:     if (cleanDescription) {
 1776:       const m = cleanDescription.match(/^РљСѓС…РЅСЏ:\s*(.+)$/i);
 1777:       if (m) {
 1778:         cleanDescription =
 1779:           'РљСѓС…РЅСЏ: ' + m[1].split(',').map((s) => cuisineLabel(s.trim())).join(', ');
 1780:       }
 1781:     }
 1782: 
 1783:     // city label from coordinates (Moscow bounding box)
 1784:     const isMoscowVenue =
 1785:       listing.lat != null &&
 1786:       listing.lng != null &&
 1787:       listing.lat > 55.4 &&
 1788:       listing.lat < 56.05 &&
 1789:       listing.lng > 37.2 &&
 1790:       listing.lng < 37.95;
 1791:     const cityLabel = isMoscowVenue ? 'РњРѕСЃРєРІР°' : listing.lat != null ? 'РќРµ РњРѕСЃРєРІР°' : null;
 1792: 
 1793:     // lightweight summary from available data (real AI summary = future, needs reviews + LLM)
 1794:     let summary: string | null = null;
 1795:     if (listing.reviewCount > 0) {
 1796:       const kind =
 1797:         listing.type === 'RESTAURANT' ? 'Р—Р°РІРµРґРµРЅРёРµ' : listing.type === 'DRINK' ? 'РќР°РїРёС‚РѕРє' : 'Р‘Р»СЋРґРѕ';
 1798:       summary =
 1799:         `${kind} СЃ РѕС†РµРЅРєРѕР№ ${listing.avgRating.toFixed(1)} РїРѕ ${listing.reviewCount} РѕС‚Р·С‹РІ.` +
 1800:         (tags.length ? ` РџСЂРѕС„РёР»СЊ: ${tags.join(', ')}.` : '');
 1801:     }
 1802: 
 1803:     // check-ins: count + recent real photos (used to replace stock placeholders)
 1804:     const checkinCount = await this.prisma.checkIn.count({ where: { listingId: id } });
 1805:     const checkinPhotoRows = await this.prisma.checkIn.findMany({
 1806:       where: { listingId: id, photoUrl: { not: null } },
 1807:       orderBy: { createdAt: 'desc' },
 1808:       take: 12,
 1809:       select: { photoUrl: true },
 1810:     });
 1811:     const checkinPhotos = checkinPhotoRows
 1812:       .map((r) => r.photoUrl)
 1813:       .filter((u): u is string => !!u);
 1814: 
 1815:     // illustrative stock placeholders вЂ” shown until REAL user photos exist
56:              l.reviewCount > 0 && (
57:                <div className="mini-meta">★ {l.avgRating.toFixed(1)} ({l.reviewCount} {ratingsWord(l.reviewCount)})</div>
420:            d = { ...d, reviews: [...missing, ...(d.reviews ?? [])], reviewCount: (d.reviewCount ?? 0) + missing.length };
427:        if (d.reviewCount > 0 && d.type !== 'RESTAURANT') {
536:    if (!userLoc) return b.reviewCount - a.reviewCount;
739:              {data.reviewCount > 0 ? `★ ${data.avgRating.toFixed(1)} (${data.reviewCount} ${ratingsWord(data.reviewCount)})` : 'Нет оценок'}
792:          {data.reviewCount > 0 ? (
794:              <Stars value={data.avgRating} />
795:              <b>{data.avgRating.toFixed(1)}</b>
801:            {data.reviewCount > 0 ? `(${data.reviewCount} ${ratingsWord(data.reviewCount)})` : ''}
802:            {data.chain ? ' · эта точка' : ''}
806:        {data.chain && (
808:            Рейтинг сети: <b style={{ color: 'var(--text)' }}>{data.chain.avgRating.toFixed(1)}</b> (
809:            {data.chain.reviewCount}) · {data.chain.branchCount} точек
891:            <div className="section-title big" style={{ marginTop: 8, marginBottom: 0 }}>🏆 Лучшие места</div>
1027:              ['reviews', `Отзывы (${data.reviews.length})`],
1099:          <div className="section-title big">Инфо</div>
1219:            <div className="section-title big">Новинки</div>
1242:            <div className="section-title big">Изменения в работе</div>
1258:            <div className="section-title big">Точки сети ({data.branches.length + 1})</div>
1278:          <div className="section-title big">Отзывы ({data.reviews.length})</div>
1333:            {data.reviews.length > 0 && (
1337:                  const pct = (count / data.reviews.length) * 100;
1350:            {data.reviews.length === 0 ? (
1418:          <div className="section-title big">Вопросы</div>
1465:            <div className="section-title big">Похожие места</div>
1499:                const count = (d.reviewCount ?? 0) + 1;
1500:                const avg = ((d.avgRating ?? 0) * (d.reviewCount ?? 0) + rv.rating) / count;
1501:                return { ...d, reviews: [rv, ...(d.reviews ?? [])], reviewCount: count, avgRating: avg };
1505:            const phrase = data.reviewCount === 0

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$l=Get-Content backend/src/listings/listings.service.ts; for($i=190;$i -lt 490;$i++){ '"'{0,5}: {1}' -f ("'$i+1),$l[$i] }' in D:\Приложения\Yelp
 succeeded in 972ms:
  191: 
  192:   /**
  193:    * Search/list with chain grouping: chain branches (same group_key) collapse
  194:    * into ONE representative row carrying branchCount. Independents have
  195:    * branchCount = 1.
  196:    */
  197:   async list(params: {
  198:     type?: ListingType;
  199:     search?: string;
  200:     take?: number;
  201:     sort?: string;
  202:     price?: number;
  203:     openNow?: boolean;
  204:     cuisine?: string;
  205:     category?: string;
  206:     viewerId?: string | null;
  207:   }) {
  208:     const {
  209:       type,
  210:       search,
  211:       take = 50,
  212:       sort = 'recommended',
  213:       price,
  214:       openNow,
  215:       cuisine,
  216:       category,
  217:       viewerId,
  218:     } = params;
  219:     const conds: Prisma.Sql[] = [];
  220:     if (type) conds.push(Prisma.sql`type = ${type}::"ListingType"`);
  221:     // word-aware name match (so "СЂР°С„" won't hit "РіР РђР¤"); fall back to substring
  222:     if (search) {
  223:       const mc = this.matchCond(search, 'AND', false);
  224:       conds.push(mc ?? Prisma.sql`name ILIKE ${'%' + search + '%'}`);
  225:     }
  226:     // OWNER RULE (12.07.2026): dishes/drinks with NO venue link are hidden from the
  227:     // menu/browse (Р‘Р»СЋРґР°/РќР°РїРёС‚РєРё tabs) вЂ” they only surface on a DIRECT search.
  228:     // They stay in the DB and reappear automatically once a parse links a venue.
  229:     if ((type === 'DISH' || type === 'DRINK') && !search) {
  230:       conds.push(
  231:         Prisma.sql`EXISTS (SELECT 1 FROM menu_links ml WHERE ml.item_id = listings.id AND ml.status = 'APPROVED')`,
  232:       );
  233:     }
  234:     if (price) conds.push(Prisma.sql`price_level = ${Number(price)}`);
  235:     if (cuisine) {
  236:       // the OSM `cuisine` field is sparse вЂ” also match the Russian category/name
  237:       // so filtering by "Р“СЂСѓР·РёРЅСЃРєР°СЏ" actually surfaces Georgian spots/dishes
  238:       const ru = CUISINE_TOKEN_RU[cuisine.toLowerCase()];
  239:       conds.push(
  240:         ru
  241:           ? Prisma.sql`(cuisine ILIKE ${'%' + cuisine + '%'} OR category ~* ${ru} OR name ~* ${ru})`
  242:           : Prisma.sql`cuisine ILIKE ${'%' + cuisine + '%'}`,
  243:       );
  244:     }
  245:     if (category) {
  246:       // "РљР°С„Рµ" also surfaces fast-food / shawarma / ice-cream / food-court (casual spots)
  247:       if (/РєР°С„Рµ/i.test(category)) {
  248:         conds.push(
  249:           Prisma.sql`(category ~* 'РєР°С„Рµ|С„Р°СЃС‚С„СѓРґ|С€Р°СѓСЂРј|С€Р°РІРµСЂРј|РјРѕСЂРѕР¶РµРЅРѕРµ|С„СѓРґ.?РєРѕСЂС‚' OR cuisine ~* 'kebab|shawarma')`,
  250:         );
  251:       } else if (/Р±Р°СЂ/i.test(category)) {
  252:         // "Р‘Р°СЂС‹" also includes pubs and beer gardens
  253:         conds.push(Prisma.sql`category ~* 'Р±Р°СЂ|РїР°Р±|pub|РїРёРІРЅРѕР№ СЃР°Рґ'`);
  254:       } else {
  255:         conds.push(Prisma.sql`category ILIKE ${'%' + category + '%'}`);
  256:       }
  257:     }
  258:     const whereSql = conds.length
  259:       ? Prisma.sql`WHERE ${Prisma.join(conds, ' AND ')}`
  260:       : Prisma.empty;
  261: 
  262:     // "Р РµРєРѕРјРµРЅРґСѓРµРјС‹Рµ" is a real TOP ranking: a Bayesian blend so a 5.0 with one
  263:     // review doesn't outrank a 4.6 with fifty (m=global mean 4.0, C=confidence 8).
  264:     const baseOrder =
  265:       sort === 'rating'
  266:         ? Prisma.sql`t."avgRating" DESC, t."reviewCount" DESC`
  267:         : sort === 'reviews'
  268:           ? Prisma.sql`t."reviewCount" DESC, t."avgRating" DESC`
  269:           : Prisma.sql`((t."reviewCount"::float * t."avgRating" + 8 * 4.0) / (t."reviewCount" + 8)) DESC, t."reviewCount" DESC`;
  270:     // В«РќР°РїРёС‚РєРёВ»: coffee first, then the rest of the non-alcoholic drinks, alcohol
  271:     // LAST (owner rule 13.07.2026)
  272:     const orderSql =
  273:       type === 'DRINK'
  274:         ? Prisma.sql`
  275:             CASE
  276:               WHEN t.category ~* 'РєРѕС„Рµ|coffee|Р»Р°С‚С‚Рµ|РєР°РїСѓС‡РёРЅРѕ|СЂР°С„|СЌСЃРїСЂРµСЃСЃРѕ|Р°РјРµСЂРёРєР°РЅРѕ|С„Р»СЌС‚' THEN 0
  277:               WHEN t.category ~* 'РІРёРЅРѕ|wine|РїРёРІРѕ|beer|РєРѕРєС‚РµР№Р»|cocktail|РєСЂРµРїРє|РІРёСЃРєРё|РІРѕРґРє|Р»РёРєС‘СЂ|Р»РёРєРµСЂ|СЂРѕРј|РґР¶РёРЅ|С‚РµРєРёР»|РєРѕРЅСЊСЏРє|Р±СЂРµРЅРґРё|С€Р°РјРїР°РЅСЃРє|РёРіСЂРёСЃС‚|СЃРёРґСЂ|РЅР°Р»РёРІРє|РЅР°СЃС‚РѕР№Рє|Р°РїРµСЂРёС‚РёРІ|РІРµСЂРјСѓС‚|Р±Р°СЂ\b' THEN 2
  278:               ELSE 1
  279:             END ASC, ${baseOrder}`
  280:         : baseOrder;
  281: 
  282:     // when filtering by "open now" we fetch a larger pool, then filter in JS
  283:     const pool = openNow ? 300 : Number(take);
  284: 
  285:     const rows = await this.prisma.$queryRaw<any[]>`
  286:       SELECT * FROM (
  287:         SELECT DISTINCT ON (COALESCE(group_key, id))
  288:           id, name, type, category, cuisine,
  289:           photo_url AS "photoUrl", price_level AS "priceLevel",
  290:           avg_rating AS "avgRating", review_count AS "reviewCount",
  291:           website, address, lat, lng, phone, hours,
  292:           COALESCE(group_key, id) AS "groupKey",
  293:           COUNT(*) OVER (PARTITION BY COALESCE(group_key, id))::int AS "branchCount"
  294:         FROM listings
  295:         ${whereSql}
  296:         ORDER BY COALESCE(group_key, id), review_count DESC, avg_rating DESC
  297:       ) t
  298:       ORDER BY ${orderSql}
  299:       LIMIT ${pool}
  300:     `;
  301: 
  302:     if (openNow) {
  303:       const open = rows.filter((r) => {
  304:         if (!r.hours) return false;
  305:         try {
  306:           return new (OpeningHours as any)(r.hours).getState(new Date());
  307:         } catch {
  308:           return false;
  309:         }
  310:       });
  311:       return this.personalSort(await this.enrichCards(open.slice(0, Number(take))), sort, viewerId, !!search);
  312:     }
  313:     return this.personalSort(await this.enrichCards(rows), sort, viewerId, !!search);
  314:   }
  315: 
  316:   /** В«Р РµРєРѕРјРµРЅРґСѓРµРјС‹РµВ» in EVERY catalog list ranks with the same taste profile as
  317:    *  the feed (owner rule 16.07.2026): category + venue affinity re-rank on top
  318:    *  of the base quality order. Search keeps its relevance order untouched. */
  319:   private async personalSort(cards: any[], sort: string, viewerId?: string | null, isSearch = false) {
  320:     if (sort !== 'recommended' || !viewerId || isSearch || cards.length < 3) return cards;
  321:     try {
  322:       const { catAffinity, venueAffinity } = await buildAffinities(this.prisma, viewerId);
  323:       if (!catAffinity.size && !venueAffinity.size) return cards;
  324:       return cards
  325:         .map((c, i) => {
  326:           const aff = catAffinity.get((c.category ?? '').toLowerCase().trim()) ?? 0;
  327:           const vAff = Math.max(
  328:             venueAffinity.get(c.id) ?? 0, // the venue itself (restaurant lists)
  329:             venueAffinity.get(c.bestVenue?.id) ?? 0,
  330:             venueAffinity.get(c.tryAt?.id) ?? 0,
  331:           );
  332:           // base keeps the original (quality) order as a small stabilizer
  333:           return { c, s: aff * 3 + Math.max(0, vAff) * 2.5 - i * 0.01 };
  334:         })
  335:         .sort((a, b) => b.s - a.s)
  336:         .map((x) => x.c);
  337:     } catch {
  338:       return cards;
  339:     }
  340:   }
  341: 
  342:   /**
  343:    * Adds card extras: ONE highlighted review snippet (best with text) and a stock
  344:    * placeholder photo for venues that have no real photo yet. Used by all the
  345:    * list/card endpoints so the home feed looks populated.
  346:    */
  347:   async enrichCards<T extends { id: string; type?: string; category?: string | null; photoUrl?: string | null }>(
  348:     rows: T[],
  349:   ): Promise<T[]> {
  350:     if (rows.length === 0) return rows;
  351:     const ids = rows.map((r) => r.id);
  352:     const reviews = await this.prisma.review.findMany({
  353:       where: { listingId: { in: ids }, text: { not: null }, status: 'APPROVED' },
  354:       orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
  355:       select: { listingId: true, text: true, rating: true },
  356:     });
  357:     const snippetByListing = new Map<string, { text: string; rating: number }>();
  358:     for (const r of reviews) {
  359:       if (!snippetByListing.has(r.listingId) && r.text) {
  360:         snippetByListing.set(r.listingId, { text: r.text, rating: r.rating });
  361:       }
  362:     }
  363: 
  364:     // for dishes/drinks: the venue where this item scores highest вЂ” shown on the
  365:     // card WITH that venue's own photo (the image follows В«Р›СѓС‡С€РµРµ РІ:В» too)
  366:     const itemIds = rows.filter((r) => r.type === 'DISH' || r.type === 'DRINK').map((r) => r.id);
  367:     const bestByItem = new Map<string, { id: string; name: string; rating: number; photoUrl?: string | null }>();
  368:     if (itemIds.length) {
  369:       const agg = await this.prisma.$queryRaw<
  370:         { listing_id: string; vid: string; avg: number }[]
  371:       >`
  372:         SELECT listing_id, attributes->>'venueId' AS vid, AVG(rating)::float AS avg
  373:         FROM reviews
  374:         WHERE status = 'APPROVED' AND listing_id IN (${Prisma.join(itemIds)})
  375:           AND attributes->>'venueId' IS NOT NULL
  376:         GROUP BY listing_id, attributes->>'venueId'
  377:       `;
  378:       const topByItem = new Map<string, { vid: string; avg: number }>();
  379:       for (const a of agg) {
  380:         const cur = topByItem.get(a.listing_id);
  381:         if (!cur || a.avg > cur.avg) topByItem.set(a.listing_id, { vid: a.vid, avg: a.avg });
  382:       }
  383:       const vids = [...new Set([...topByItem.values()].map((v) => v.vid))];
  384:       if (vids.length) {
  385:         const vs = await this.prisma.listing.findMany({
  386:           where: { id: { in: vids } },
  387:           select: { id: true, name: true },
  388:         });
  389:         const nameById = new Map(vs.map((v) => [v.id, v.name]));
  390:         // the best (venue, item)'s own generated photo, if any
  391:         const bestLinks = await this.prisma.menuLink.findMany({
  392:           where: { OR: [...topByItem.entries()].map(([lid, t]) => ({ itemId: lid, venueId: t.vid })) },
  393:           select: { itemId: true, venueId: true, photoUrl: true },
  394:         });
  395:         const linkPhoto = new Map(bestLinks.map((l) => [`${l.itemId}|${l.venueId}`, l.photoUrl]));
  396:         for (const [lid, t] of topByItem) {
  397:           const name = nameById.get(t.vid);
  398:           if (name) bestByItem.set(lid, { id: t.vid, name, rating: t.avg, photoUrl: linkPhoto.get(`${lid}|${t.vid}`) });
  399:         }
  400:       }
  401:     }
  402: 
  403:     // social proof for cards with NO reviews yet: how many people are watching /
  404:     // want to try it ("РІС‹ РЅРµ РїРµСЂРІС‹Р№, РєС‚Рѕ РїСЂРёСЃРјР°С‚СЂРёРІР°РµС‚СЃСЏ")
  405:     const zeroIds = rows.filter((r) => (r as any).reviewCount === 0).map((r) => r.id);
  406:     // В«РџРѕРїСЂРѕР±СѓР№С‚Рµ РІ:В» вЂ” any dish WITHOUT a computed best venue names a RANDOM
  407:     // venue that serves it (rated-but-venueless reviews included)
  408:     const tryAtIds = rows
  409:       .filter((r) => (r.type === 'DISH' || r.type === 'DRINK') && !bestByItem.has(r.id))
  410:       .map((r) => r.id);
  411:     // В«РџРѕРїСЂРѕР±СѓР№С‚Рµ РІ:В» carries the venue AND that venue's own AI photo of the
  412:     // dish вЂ” rotating the venue rotates the photo (owner rule 12.07.2026)
  413:     const tryAtByItem = new Map<string, { id: string; name: string; photoUrl?: string | null }>();
  414:     if (tryAtIds.length) {
  415:       const linkRows = await this.prisma.menuLink.findMany({
  416:         where: { itemId: { in: tryAtIds }, status: 'APPROVED' },
  417:         select: { itemId: true, photoUrl: true, price: true, venue: { select: { id: true, name: true } } },
  418:       });
  419:       const byItem = new Map<string, { id: string; name: string; photoUrl?: string | null; price?: number | null }[]>();
  420:       for (const l of linkRows) {
  421:         if (!l.venue) continue;
  422:         if (!byItem.has(l.itemId)) byItem.set(l.itemId, []);
  423:         byItem.get(l.itemId)!.push({ ...l.venue, photoUrl: l.photoUrl, price: l.price });
  424:       }
  425:       for (const [itemId, vs] of byItem) {
  426:         // prefer a venue that actually HAS its own generated photo, so the card
  427:         // shows a venue-specific image rather than the generic shared one
  428:         const withPhoto = vs.filter((v) => v.photoUrl);
  429:         const pool = withPhoto.length ? withPhoto : vs;
  430:         tryAtByItem.set(itemId, pool[Math.floor(Math.random() * pool.length)]);
  431:       }
  432:     }
  433:     const wantByListing = new Map<string, number>();
  434:     const viewsByListing = new Map<string, number>();
  435:     if (zeroIds.length) {
  436:       const favs = await this.prisma.favorite.groupBy({
  437:         by: ['listingId'],
  438:         where: { listingId: { in: zeroIds } },
  439:         _count: true,
  440:       });
  441:       for (const f of favs) wantByListing.set(f.listingId, f._count);
  442:       const views = await this.prisma.interaction.groupBy({
  443:         by: ['listingId'],
  444:         where: { listingId: { in: zeroIds }, type: 'VIEW' },
  445:         _count: true,
  446:       });
  447:       for (const v of views) viewsByListing.set(v.listingId, v._count);
  448:     }
  449: 
  450:     return rows.map((r) => {
  451:       const best = bestByItem.get(r.id);
  452:       const tryAt = tryAtByItem.get(r.id);
  453:       // the photo follows the venue the card is attributed to: В«Р›СѓС‡С€РµРµ РІ:В» first,
  454:       // then В«РџРѕРїСЂРѕР±СѓР№С‚Рµ РІ:В». User photos always win; venue photo only when no
  455:       // real user photo exists yet.
  456:       const isUserPhoto = (r as any).photoUrl?.startsWith('/api/files/') && !(r as any).photoUrl?.startsWith('/api/files/aigen-');
  457:       const venuePhoto = !isUserPhoto ? (best?.photoUrl || tryAt?.photoUrl || null) : null;
  458:       return {
  459:       ...r,
  460:       photoUrl: venuePhoto ?? (r as any).photoUrl,
  461:       snippet: snippetByListing.get(r.id) ?? null,
  462:       bestVenue: best ?? null,
  463:       wantCount: wantByListing.get(r.id) ?? undefined,
  464:       viewCount: viewsByListing.get(r.id) ?? undefined,
  465:       tryAt: tryAt ?? undefined,
  466:       // show at least the city when there's no street address yet
  467:       cityLabel: inMoscow((r as any).lat, (r as any).lng) ? 'РњРѕСЃРєРІР°' : undefined,
  468:       metro: nearestMetro((r as any).lat, (r as any).lng), // nearest metro в†’ "Рј. вЂ¦" label
  469:       // always provide a stock fallback so even a broken/missing photoUrl shows
  470:       // an appetizing photo instead of a monogram tile.
  471:       placeholderPhoto: `/api/stock/${placeholderKeys(r.type ?? 'RESTAURANT', r.category, (r as any).name, r.id, 1)[0]}`,
  472:       };
  473:     });
  474:   }
  475: 
  476:   /** All branches of a chain (by group_key) + aggregated rating, for the map. */
  477:   async group(key: string, type?: ListingType) {
  478:     const branches = await this.prisma.listing.findMany({
  479:       // match by group_key, or (for OSM chains w/o a key) by identical name
  480:       where: {
  481:         OR: [{ groupKey: key }, { groupKey: null, name: { equals: key, mode: 'insensitive' } }],
  482:         ...(type ? { type } : {}),
  483:       },
  484:       select: {
  485:         id: true,
  486:         name: true,
  487:         address: true,
  488:         lat: true,
  489:         lng: true,
  490:         avgRating: true,

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'npx tsc --noEmit --pretty false' in D:\Приложения\Yelp\frontend
2026-07-17T13:55:34.561141Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 1.7 seconds
Output:
npx : Невозможно загрузить файл C:\Users\rezni\nodejs\npx.ps1, так как выполнение сценариев отключено в этой системе. Д
ля получения дополнительных сведений см. about_Execution_Policies по адресу https:/go.microsoft.com/fwlink/?LinkID=1351
70.
строка:2 знак:1
+ npx tsc --noEmit --pretty false
+ ~~~
    + CategoryInfo          : Ошибка безопасности: (:) [], PSSecurityException
    + FullyQualifiedErrorId : UnauthorizedAccess

 exited 1 in 1732ms:
npx : Невозможно загрузить файл C:\Users\rezni\nodejs\npx.ps1, так как выполнение сценариев отключено в этой системе. Д
ля получения дополнительных сведений см. about_Execution_Policies по адресу https:/go.microsoft.com/fwlink/?LinkID=1351
70.
строка:2 знак:1
+ npx tsc --noEmit --pretty false
+ ~~~
    + CategoryInfo          : Ошибка безопасности: (:) [], PSSecurityException
    + FullyQualifiedErrorId : UnauthorizedAccess

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'npx.cmd tsc --noEmit --pretty false' in D:\Приложения\Yelp\frontend
2026-07-17T13:56:09.350350Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 30.4 seconds
Output:
src/components/CategoryCelebration.tsx(10,19): error TS2322: Type '() => boolean' is not assignable to type 'void | Destructor'.
  Type '() => boolean' is not assignable to type 'Destructor'.
    Type 'boolean' is not assignable to type 'void | { [UNDEFINED_VOID_ONLY]: never; }'.
src/components/ListingDetail.tsx(241,10): error TS6133: 'firstTaster' is declared but its value is never read.
src/components/ListingDetail.tsx(612,12): error TS18047: 'data' is possibly 'null'.
src/components/ListingDetail.tsx(612,24): error TS18047: 'data' is possibly 'null'.
src/components/ListingDetail.tsx(613,9): error TS18047: 'data' is possibly 'null'.
src/components/ListingDetail.tsx(614,14): error TS18047: 'data' is possibly 'null'.
src/components/ListingDetail.tsx(673,27): error TS18047: 'data' is possibly 'null'.
src/components/ListingDetail.tsx(685,16): error TS18047: 'data' is possibly 'null'.
src/components/ListingDetail.tsx(691,29): error TS18047: 'data' is possibly 'null'.
src/components/ListingDetail.tsx(691,44): error TS18047: 'data' is possibly 'null'.
src/components/ListingDetail.tsx(706,26): error TS18047: 'data' is possibly 'null'.
src/components/ListingDetail.tsx(709,91): error TS18047: 'data' is possibly 'null'.
src/components/ListingDetail.tsx(767,25): error TS2322: Type 'ListingDetail' is not assignable to type 'Listing'.
  Types of property 'cityLabel' are incompatible.
    Type 'string | null | undefined' is not assignable to type 'string | undefined'.
      Type 'null' is not assignable to type 'string | undefined'.
src/components/ListingDetail.tsx(786,25): error TS2322: Type 'ListingDetail' is not assignable to type 'Listing'.
  Types of property 'cityLabel' are incompatible.
    Type 'string | null | undefined' is not assignable to type 'string | undefined'.
      Type 'null' is not assignable to type 'string | undefined'.
src/components/ListingDetail.tsx(918,84): error TS2339: Property 'cityLabel' does not exist on type '{ id: string; name: string; photoUrl?: string | null | undefined; category?: string | null | undefined; address?: string | null | undefined; }'.
src/components/ListingDetail.tsx(1368,48): error TS18048: 'r.videoUrls.length' is possibly 'undefined'.
src/components/ListingDetail.tsx(1479,11): error TS2322: Type 'Listing | ListingDetail' is not assignable to type 'Listing'.
  Type 'ListingDetail' is not assignable to type 'Listing'.
    Types of property 'cityLabel' are incompatible.
      Type 'string | null | undefined' is not assignable to type 'string | undefined'.
        Type 'null' is not assignable to type 'string | undefined'.
src/components/ListRow.tsx(10,7): error TS6133: 'TYPE_LABEL' is declared but its value is never read.
src/components/ListRow.tsx(35,9): error TS6133: 'isUnlocked' is declared but its value is never read.
src/screens/Home.tsx(6,1): error TS6133: 'Stars' is declared but its value is never read.
src/screens/Home.tsx(7,32): error TS6133: 'VenuePhoto' is declared but its value is never read.
src/screens/Home.tsx(799,41): error TS2345: Argument of type 'string | null | undefined' is not assignable to parameter of type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.
src/screens/MyRatings.tsx(12,1): error TS6133: 'Stars' is declared but its value is never read.
src/screens/MyRatings.tsx(36,10): error TS6133: 'stats' is declared but its value is never read.
src/screens/MyRatings.tsx(36,17): error TS6133: 'setStats' is declared but its value is never read.
src/types.ts(123,18): error TS2430: Interface 'ListingDetail' incorrectly extends interface 'Listing'.
  Types of property 'cityLabel' are incompatible.
    Type 'string | null | undefined' is not assignable to type 'string | undefined'.
      Type 'null' is not assignable to type 'string | undefined'.

 exited 1 in 30406ms:
src/components/CategoryCelebration.tsx(10,19): error TS2322: Type '() => boolean' is not assignable to type 'void | Destructor'.
  Type '() => boolean' is not assignable to type 'Destructor'.
    Type 'boolean' is not assignable to type 'void | { [UNDEFINED_VOID_ONLY]: never; }'.
src/components/ListingDetail.tsx(241,10): error TS6133: 'firstTaster' is declared but its value is never read.
src/components/ListingDetail.tsx(612,12): error TS18047: 'data' is possibly 'null'.
src/components/ListingDetail.tsx(612,24): error TS18047: 'data' is possibly 'null'.
src/components/ListingDetail.tsx(613,9): error TS18047: 'data' is possibly 'null'.
src/components/ListingDetail.tsx(614,14): error TS18047: 'data' is possibly 'null'.
src/components/ListingDetail.tsx(673,27): error TS18047: 'data' is possibly 'null'.
src/components/ListingDetail.tsx(685,16): error TS18047: 'data' is possibly 'null'.
src/components/ListingDetail.tsx(691,29): error TS18047: 'data' is possibly 'null'.
src/components/ListingDetail.tsx(691,44): error TS18047: 'data' is possibly 'null'.
src/components/ListingDetail.tsx(706,26): error TS18047: 'data' is possibly 'null'.
src/components/ListingDetail.tsx(709,91): error TS18047: 'data' is possibly 'null'.
src/components/ListingDetail.tsx(767,25): error TS2322: Type 'ListingDetail' is not assignable to type 'Listing'.
  Types of property 'cityLabel' are incompatible.
    Type 'string | null | undefined' is not assignable to type 'string | undefined'.
      Type 'null' is not assignable to type 'string | undefined'.
src/components/ListingDetail.tsx(786,25): error TS2322: Type 'ListingDetail' is not assignable to type 'Listing'.
  Types of property 'cityLabel' are incompatible.
    Type 'string | null | undefined' is not assignable to type 'string | undefined'.
      Type 'null' is not assignable to type 'string | undefined'.
src/components/ListingDetail.tsx(918,84): error TS2339: Property 'cityLabel' does not exist on type '{ id: string; name: string; photoUrl?: string | null | undefined; category?: string | null | undefined; address?: string | null | undefined; }'.
src/components/ListingDetail.tsx(1368,48): error TS18048: 'r.videoUrls.length' is possibly 'undefined'.
src/components/ListingDetail.tsx(1479,11): error TS2322: Type 'Listing | ListingDetail' is not assignable to type 'Listing'.
  Type 'ListingDetail' is not assignable to type 'Listing'.
    Types of property 'cityLabel' are incompatible.
      Type 'string | null | undefined' is not assignable to type 'string | undefined'.
        Type 'null' is not assignable to type 'string | undefined'.
src/components/ListRow.tsx(10,7): error TS6133: 'TYPE_LABEL' is declared but its value is never read.
src/components/ListRow.tsx(35,9): error TS6133: 'isUnlocked' is declared but its value is never read.
src/screens/Home.tsx(6,1): error TS6133: 'Stars' is declared but its value is never read.
src/screens/Home.tsx(7,32): error TS6133: 'VenuePhoto' is declared but its value is never read.
src/screens/Home.tsx(799,41): error TS2345: Argument of type 'string | null | undefined' is not assignable to parameter of type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.
src/screens/MyRatings.tsx(12,1): error TS6133: 'Stars' is declared but its value is never read.
src/screens/MyRatings.tsx(36,10): error TS6133: 'stats' is declared but its value is never read.
src/screens/MyRatings.tsx(36,17): error TS6133: 'setStats' is declared but its value is never read.
src/types.ts(123,18): error TS2430: Interface 'ListingDetail' incorrectly extends interface 'Listing'.
  Types of property 'cityLabel' are incompatible.
    Type 'string | null | undefined' is not assignable to type 'string | undefined'.
      Type 'null' is not assignable to type 'string | undefined'.

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content backend/src/reviews/reviews.service.ts | Select-Object -First 410; rg -n \"linkChain|reviewCount|avgRating|status:|APPROVED|PENDING|@@unique\" backend/src/reviews/reviews.service.ts; rg -n \"firstTaster|CategoryCelebration|subscribe|return \\(\\) =>\" frontend/src/components/ListingDetail.tsx frontend/src/components/CategoryCelebration.tsx frontend/src -g '*.ts' -g '*.tsx' | Select-Object -First 100" in D:\Приложения\Yelp
 succeeded in 1026ms:
import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, Role, VoteType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { ClipService } from '../vision/clip.service';

// auto-moderation: obvious profanity / spam is rejected before a comment is saved
const PROFANITY = /(?:\bС…СѓР№|С…СѓС‘|С…СѓСЏ|РїРёР·Рґ|\bРµР±Р°С‚СЊ|РµР±Р°РЅ|С‘Р±Р°РЅ|Р±Р»СЏРґ|\bСЃСѓРє[Р°Рё]\b|РјСѓРґР°Рє|РґРѕР»Р±РѕС‘Р±|РїРёРґРѕСЂ|РіР°РЅРґРѕРЅ|Р·Р°Р»СѓРї|С…РµСЂ\b|С…СѓРµ|РјСЂР°Р·СЊ|С‚РІР°СЂСЊ|С€Р»СЋС…|СѓС‘Р±РѕРє|СѓРµР±РѕРє|РЅРёРіРіРµСЂ|РґР°СѓРЅ\b|РґРµР±РёР»)/i;
// NB: outer group is non-capturing so the `(.)\1{6,}` backreference points at the
// `(.)` (group 1) вЂ” with a capturing outer group `\1` was empty and matched EVERY char.
const SPAM = /(?:https?:\/\/|www\.|t\.me\/|@[a-z0-9_]{4,}|\b\d{10,}\b|(.)\1{6,})/i;
// CRUDE / non-constructive: not literal profanity, but disgusting/toxic language
// that adds no signal ("РїР°СЂР°С€Р°", "Р±Р»РµРІР°Р»", "РіРѕРІРЅРѕ", "Р¶СЂР°С‚СЊ РЅРµРІРѕР·РјРѕР¶РЅРѕ"). A review
// hitting this goes to human moderation instead of auto-publishing. Extend freely.
const CRUDE = /РїР°СЂР°С€|Р±Р»РµРІ(Р°Р»|Р°С‚СЊ|РѕС‚Р°|РѕС‚РЅ)|СЃР±Р»РµРІ|СЃС‚РѕС€РЅРёР»|РіРѕРІРЅ|РґРµСЂСЊРј|РіР°РІРЅ|РѕР±РѕСЃСЂР°|Р·Р°СЃСЃР°РЅ|РїРѕРјРѕ[Р№Рё]|РѕС‚СЂР°РІ(РёР»СЃСЏ|РёС‚СЊСЃСЏ|Р°)|РїРѕС‚СЂР°РІ|С‚РѕС€РЅРѕС‚|РјРµСЂР·РѕСЃС‚|РѕС‚РІСЂР°С‚|РіР°РґРѕСЃС‚|СѓС‘Р±РёС‰|СѓРµР±РёС‰|РєРѕРЅС‡(РµРЅС‹Р№|Р°РЅС‹Р№)|Р±С‹РґР»|СЃРєРѕС‚РёРЅ|Р¶РёРІРѕС‚РЅРѕРµ\b|Р¶СЂ(Р°С‚СЊ|Р°Р»Рё) РЅРµРІРѕР·РјРѕР¶РЅРѕ|РµСЃС‚СЊ РЅРµРІРѕР·РјРѕР¶РЅРѕ|РЅР°С…РµСЂ|РЅР°С…СЂРµРЅ|РїРѕС…РµСЂ|РїРѕС…СЂРµРЅ|РґРЅРёС‰Рµ|Р·Р°С€РєРІР°СЂРЅ?/i;
// GIBBERISH: repeated 2-3 char syllables ("С‚СЂР°Р»СЏР»СЏ", "С‚СЂСѓР»СЋР»СЋ", "Р±Р»Р° Р±Р»Р° Р±Р»Р°",
// "Р»СЏР»СЏР»СЏ") or a single-char run вЂ” no informational content в†’ human moderation
const GIBBERISH = /([Р°-СЏС‘a-z]{2,3})\1{2,}|(.)\2{5,}|^(?:(\w+)\s+)\3{2,}$/i;

// RU dish/drink name в†’ a short English CLIP query, so the photo-name check works
// (CLIP ViT-B/32 reads English). Dictionary of classics first, then category.
const FOOD_DICT: [RegExp, string][] = [
  [/РїРёС†С†/i, 'pizza'], [/РєР»СѓР±РЅРёРє/i, 'fresh strawberries'], [/РјР°Р»РёРЅ/i, 'raspberries'],
  [/РїРµР»СЊРјРµРЅ/i, 'pelmeni dumplings'], [/СЃС‹СЂРЅРёРє/i, 'cottage cheese pancakes'], [/Р±РѕСЂС‰/i, 'borscht beet soup'],
  [/Р±Р»РёРЅ/i, 'russian crepes'], [/РѕР»РёРІСЊРµ/i, 'olivier salad'], [/С…Р°С‡Р°РїСѓСЂ/i, 'khachapuri cheese bread'],
  [/С…РёРЅРєР°Р»/i, 'khinkali dumplings'], [/РїРёС†С†/i, 'pizza'], [/Р±СѓСЂРіРµСЂ/i, 'burger'], [/РїР°СЃС‚Р°|СЃРїР°РіРµС‚С‚Рё|РєР°СЂР±РѕРЅР°СЂР°|Р±РѕР»РѕРЅСЊРµ/i, 'pasta'],
  [/СЃСѓС€Рё|СЂРѕР»Р»/i, 'sushi rolls'], [/СЃС‚РµР№Рє|СЂРёР±Р°Р№/i, 'steak'], [/СЃР°Р»Р°С‚|С†РµР·Р°СЂСЊ|РіСЂРµС‡РµСЃРє|РґРµС‚РѕРєСЃ/i, 'salad'],
  [/СЃСѓРї|СЂР°РјРµРЅ|С‚РѕРј СЏРј|РіР°СЃРїР°С‡Рѕ/i, 'soup'], [/С‚РёСЂР°РјРёСЃСѓ|С‡РёР·РєРµР№Рє|С‚РѕСЂС‚|РјРµРґРѕРІРёРє|РґРµСЃРµСЂС‚|СЌРєР»РµСЂ|С€С‚СЂСѓРґРµР»СЊ|С‚Р°СЂС‚Р°Р»РµС‚Рє/i, 'cake dessert'],
  [/РјРѕСЂРѕР¶РµРЅРѕРµ|РїР»РѕРјР±РёСЂ|СЃРѕСЂР±РµС‚|РґР¶РµР»Р°С‚Рѕ/i, 'ice cream'], [/РєСЂСѓР°СЃСЃР°РЅ/i, 'croissant'], [/С…Р»РµР±/i, 'bread'],
  [/РєРѕС„Рµ|Р»Р°С‚С‚Рµ|РєР°РїСѓС‡РёРЅРѕ|СЂР°С„|СЌСЃРїСЂРµСЃСЃРѕ|Р°РјРµСЂРёРєР°РЅРѕ|С„Р»СЌС‚/i, 'coffee cup'], [/С‡Р°Р№|РјР°С‚С‡Р°/i, 'tea cup'],
  [/СЃРјСѓР·Рё/i, 'smoothie'], [/Р»РёРјРѕРЅР°Рґ|РјРѕСЂСЃ|СЃРѕРє|РєРѕРјРїРѕС‚/i, 'cold drink glass'], [/РєРѕРєС‚РµР№Р»/i, 'cocktail'],
  [/РїР°СЂРјРµР·Р°РЅ|СЃС‹СЂ\b|РјРѕС†Р°СЂРµР»Р»|РіРѕСЂРіРѕРЅР·РѕР»/i, 'cheese'], [/РєСЂРµРІРµС‚Рє/i, 'shrimp'], [/Р»РѕСЃРѕСЃ|СЃС‘РјРі|СЃРµРјРі|СЂС‹Р±|РїР°Р»С‚СѓСЃ|С‚СѓРЅРµС†/i, 'fish'],
  [/РєСѓСЂРёРЅ|РєСѓСЂРёС†Р°|С†С‹РїР»|РЅР°РіРіРµС‚СЃ/i, 'chicken dish'], [/РєР°СЂС‚РѕС„РµР»СЊ С„СЂРё|С„СЂРё\b/i, 'french fries'], [/РєРѕС‚Р»РµС‚/i, 'cutlet'],
  [/СЏРёС‡|РѕРјР»РµС‚|Р±РµРЅРµРґРёРєС‚/i, 'eggs'], [/РІРѕРє|Р»Р°РїС€Р°|СѓРґРѕРЅ/i, 'noodles'], [/РѕРІРѕС‰|Р±СЂРѕРєРєРѕР»Рё|С†СѓРєРёРЅРё|Р°РІРѕРєР°РґРѕ/i, 'vegetables'],
];
function toFoodQuery(name: string, category?: string | null): string | null {
  for (const [re, q] of FOOD_DICT) if (re.test(name)) return q;
  const c = (category ?? '').toLowerCase();
  if (/РєРѕС„Рµ/.test(c)) return 'coffee cup';
  if (/С‡Р°Р№/.test(c)) return 'tea cup';
  if (/РґРµСЃРµСЂС‚|РІС‹РїРµС‡Рє/.test(c)) return 'dessert';
  if (/СЃСѓРї/.test(c)) return 'soup';
  if (/СЃР°Р»Р°С‚/.test(c)) return 'salad';
  if (/РїРёС†С†/.test(c)) return 'pizza';
  if (/РЅР°РїРёС‚|Р»РёРјРѕРЅР°Рґ|СЃРѕРє/.test(c)) return 'drink in a glass';
  // generic food fallback вЂ” still rejects graphs/screenshots/unrelated objects
  return 'food or a drink';
}

export interface CreateReviewDto {
  rating: number;
  text?: string;
  attributes?: Prisma.InputJsonValue;
  photoUrls?: string[];
  videoUrls?: string[];
}

@Injectable()
export class ReviewsService {
  private readonly log = new Logger('Reviews');
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
    private readonly clip: ClipService,
    private readonly notifications: NotificationsService,
  ) {}

  private async actorName(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, username: true } });
    return u?.firstName || u?.username || 'РљС‚Рѕ-С‚Рѕ';
  }

  /** CLIP zero-shot check of an uploaded review photo.
   *  Returns { block } for explicit content (photo is dropped entirely) and
   *  { promote } вЂ” whether it may become the ITEM CARD photo (must look like
   *  food/drink; faces, screenshots and diagrams stay inside the review only). */
  private async checkReviewPhoto(
    url: string,
    itemName?: string | null,
    category?: string | null,
  ): Promise<{ block: boolean; promote: boolean; reason?: string }> {
    const key = url.match(/\/api\/files\/([\w-]+)/)?.[1];
    if (!key) return { block: false, promote: false }; // external/unknown в†’ never promote
    try {
      const obj = await this.uploads.get(key);
      const chunks: Buffer[] = [];
      for await (const c of obj.body) chunks.push(c as Buffer);
      const buf = Buffer.concat(chunks);
      // hard cap: moderation may NEVER hold a review save hostage
      const m = await Promise.race([
        this.clip.moderatePhoto(buf),
        new Promise<null>((res) => setTimeout(() => res(null), 8000)),
      ]);
      if (!m) return { block: false, promote: true }; // moderation down в†’ don't punish users
      if (m.nsfw > 0.5) return { block: true, promote: false, reason: 'nsfw' };
      // screenshots / charts / documents are NOT a review photo of a dish вЂ” block
      // (a spline-interpolation graph is not food). 'other' = screenshot/diagram.
      if (m.other > 0.4 && m.other >= m.food) return { block: true, promote: false, reason: 'screenshot' };
      // NAME MATCH (owner rule): the photo must actually depict the dish/drink in
      // the card name. CLIP zero-shot the photo against "<dish>" vs an unrelated
      // object вЂ” reject when the dish label loses (<50%).
      const en = itemName ? toFoodQuery(itemName, category) : null;
      if (en) {
        const probs = await Promise.race([
          this.clip.classify(buf, [`a photo of ${en}`, 'a photo of an unrelated object, screenshot or chart']),
          new Promise<number[] | null>((res) => setTimeout(() => res(null), 6000)),
        ]);
        if (probs && probs[0] < 0.5) return { block: true, promote: false, reason: `name-mismatch(${probs[0].toFixed(2)})` };
      }
      // card faces must clearly be food/drink вЂ” selfies and screenshots stay in the review
      return { block: false, promote: m.food >= 0.5 && m.person < 0.35 };
    } catch {
      return { block: false, promote: true };
    }
  }

  /** All comments on a review (flat, oldest first) вЂ” frontend builds the tree. */
  async comments(reviewId: string) {
    return this.prisma.comment.findMany({
      where: { reviewId },
      include: { user: { select: { id: true, firstName: true, username: true, photoUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Add a comment (or a reply when parentId is set) to a review. Auto-moderated. */
  async addComment(userId: string, reviewId: string, text: string, parentId?: string) {
    const t = (text ?? '').trim();
    if (!t) return null;
    if (PROFANITY.test(t) || CRUDE.test(t)) throw new BadRequestException('РљРѕРјРјРµРЅС‚Р°СЂРёР№ СЃРѕРґРµСЂР¶РёС‚ РЅРµРґРѕРїСѓСЃС‚РёРјСѓСЋ Р»РµРєСЃРёРєСѓ');
    if (SPAM.test(t)) throw new BadRequestException('РџРѕС…РѕР¶Рµ РЅР° СЃРїР°Рј вЂ” СЃСЃС‹Р»РєРё Рё РєРѕРЅС‚Р°РєС‚С‹ Р·Р°РїСЂРµС‰РµРЅС‹');
    const created = await this.prisma.comment.create({
      data: { reviewId, userId, text: t.slice(0, 1000), parentId: parentId ?? null },
      include: { user: { select: { id: true, firstName: true, username: true, photoUrl: true } } },
    });
    // notify the review's author (bell + capped bot push), fire-and-forget
    void (async () => {
      const review = await this.prisma.review.findUnique({
        where: { id: reviewId },
        select: { userId: true, listing: { select: { name: true } } },
      });
      if (!review || review.userId === userId) return;
      const name = created.user?.firstName || created.user?.username || 'РљС‚Рѕ-С‚Рѕ';
      await this.notifications.add({
        userId: review.userId,
        kind: 'comment',
        actorId: userId,
        actorName: name,
        reviewId,
        text: `${name} РїСЂРѕРєРѕРјРјРµРЅС‚РёСЂРѕРІР°Р»(Р°) РІР°С€ РѕС‚Р·С‹РІ Рѕ В«${review.listing?.name ?? ''}В»: ${t.slice(0, 60)}`,
      });
    })().catch(() => {});
    return created;
  }

  /** Delete a comment. Allowed for its author, or for an admin (@reznik_kir1ll).
   *  A user can never delete someone else's comment. */
  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId }, select: { userId: true } });
    if (!comment) throw new NotFoundException('РљРѕРјРјРµРЅС‚Р°СЂРёР№ РЅРµ РЅР°Р№РґРµРЅ');
    const me = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const isAdmin = me?.role === Role.ADMIN;
    if (comment.userId !== userId && !isAdmin) {
      throw new ForbiddenException('РќРµР»СЊР·СЏ СѓРґР°Р»РёС‚СЊ С‡СѓР¶РѕР№ РєРѕРјРјРµРЅС‚Р°СЂРёР№');
    }
    await this.prisma.comment.delete({ where: { id: commentId } }); // replies cascade
    return { ok: true };
  }

  /** Prepare a rich Telegram message to send to a friend: the check-in PHOTO +
   *  the user's note as caption + a single "Open in app" button (no raw long link).
   *  Returns a prepared_message_id the Mini App passes to tg.shareMessage(). */
  async preparePost(tgUserId: number, listingId: string, text?: string, photoUrl?: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || !tgUserId) throw new BadRequestException('share unavailable');
    const APP = (process.env.PUBLIC_APP_URL || 'https://togomoscow-production.up.railway.app').replace(/\/$/, '');
    const deepLink = `https://t.me/togomoscow_bot?startapp=l_${listingId}`;
    const reply_markup = { inline_keyboard: [[{ text: 'рџЌЅ РћС‚РєСЂС‹С‚СЊ РІ togomoscow', url: deepLink }]] };
    const caption = (text ?? '').trim().slice(0, 1000);
    const abs = photoUrl ? (/^https?:\/\//.test(photoUrl) ? photoUrl : APP + photoUrl) : null;
    const result = abs
      ? { type: 'photo', id: 'p' + Date.now(), photo_url: abs, thumbnail_url: abs, caption, reply_markup }
      : { type: 'article', id: 'a' + Date.now(), title: 'togomoscow', description: caption.slice(0, 80), input_message_content: { message_text: caption || 'Р—Р°С†РµРЅРё РІ togomoscow рџЌЅ' }, reply_markup };
    const r = await fetch(`https://api.telegram.org/bot${token}/savePreparedInlineMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: tgUserId, result, allow_user_chats: true, allow_group_chats: false }),
    });
    const d: any = await r.json();
    if (!d.ok) throw new BadRequestException(d.description || 'prepare failed');
    return { id: d.result.id };
  }

  /** Add a photo to a listing WITHOUT a rating/review. ACCUMULATES into the gallery
   *  (a 2nd/3rd photo adds, never replaces) and sets the card face if there's none yet. */
  async addPhoto(_userId: string, listingId: string, url: string) {
    if (!url || !/^https?:\/\/|^\//.test(url)) throw new BadRequestException('bad url');
    // same gate as review photos: no explicit content, only food lands on the card
    const check = await this.checkReviewPhoto(url);
    if (check.block) throw new BadRequestException('Р¤РѕС‚Рѕ РЅРµ РїСЂРѕС€Р»Рѕ РјРѕРґРµСЂР°С†РёСЋ');
    if (!check.promote) throw new BadRequestException('РќР° С„РѕС‚Рѕ РЅРµ РїРѕС…РѕР¶Рµ РЅР° Р±Р»СЋРґРѕ РёР»Рё РЅР°РїРёС‚РѕРє');
    const l = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { photoUrl: true, photos: true },
    });
    const photos = [...new Set([...(l?.photos ?? []), url])];
    const faceIsUgc = !!l?.photoUrl?.startsWith('/api/files/');
    await this.prisma.listing
      .update({ where: { id: listingId }, data: { photos, ...(faceIsUgc ? {} : { photoUrl: url }) } })
      .catch(() => {});
    return { ok: true };
  }

  async create(userId: string, listingId: string, dto: CreateReviewDto) {
    const rating = Math.max(1, Math.min(5, Number(dto.rating) || 0));
    // AI moderation gate: clean reviews auto-publish instantly; ONLY violations
    // land in the admin cabinet (profanity/spam text throws above, an explicit
    // photo sends the review to PENDING for a human look)
    let status: 'APPROVED' | 'PENDING' = 'APPROVED';
    const reviewText = (dto.text ?? '').trim();
    if (reviewText && (PROFANITY.test(reviewText) || SPAM.test(reviewText) || CRUDE.test(reviewText) || GIBBERISH.test(reviewText))) {
      status = 'PENDING'; // crude / gibberish / non-constructive в†’ the cabinet, not the feed
    }
    // toxic low-rating rant with no substance (e.g. "1в…, РѕС‚СЃС‚РѕР№, РЅРµ Р±РµСЂРёС‚Рµ"):
    // a 1-2в… review under ~20 chars and no useful noun is held for a human look
    if (rating <= 2 && reviewText && reviewText.length < 20 && !/[Р°-СЏС‘]{5,}\s+[Р°-СЏС‘]{4,}/i.test(reviewText)) {
      status = 'PENDING';
    }
    // photo moderation: explicit content is dropped entirely; the photo must ALSO
    // actually depict the dish/drink in the card name (AI check, >50% match) вЂ”
    // a graph/screenshot or an unrelated object is rejected from the review
    let promoteToCard = false;
    if (dto.photoUrls?.length) {
      const item = await this.prisma.listing.findUnique({ where: { id: listingId }, select: { name: true, category: true } });
      const check = await this.checkReviewPhoto(dto.photoUrls[0], item?.name, item?.category);
      if (check.block) {
        this.log.warn(`review photo blocked (${check.reason}) user=${userId} listing=${listingId}`);
        dto.photoUrls = [];
        status = 'PENDING'; // violation в†’ human moderation
      } else {
        promoteToCard = check.promote;
      }
    }
    const review = await this.prisma.review.upsert({
      where: { listingId_userId: { listingId, userId } },
      create: {
        listingId,
        userId,
        rating,
        text: dto.text ?? null,
        attributes: dto.attributes ?? Prisma.JsonNull,
        photoUrls: dto.photoUrls ?? [],
        videoUrls: dto.videoUrls ?? [],
        status,
      },
      update: {
        rating,
        text: dto.text ?? null,
        attributes: dto.attributes ?? Prisma.JsonNull,
        photoUrls: dto.photoUrls ?? [],
        videoUrls: dto.videoUrls ?? [],
        status,
      },
    });
    // review photos ACCUMULATE into the listing gallery (deduped); the first real
    // photo also becomes the card face if there isn't one yet вЂ” but ONLY photos
    // that passed the food check (faces/screenshots never surface on catalog cards)
    if (dto.photoUrls?.length && promoteToCard) {
      const l = await this.prisma.listing.findUnique({
        where: { id: listingId },
        select: { photoUrl: true, photos: true },
      });
      const photos = [...new Set([...(l?.photos ?? []), ...dto.photoUrls])];
      const faceIsUgc = !!l?.photoUrl?.startsWith('/api/files/');
      await this.prisma.listing
        .update({
          where: { id: listingId },
          // a real user FOOD photo beats a licensed/stock card face
          data: { photos, ...(faceIsUgc ? {} : { photoUrl: dto.photoUrls[0] }) },
        })
        .catch(() => {});
    }
    // a dish/drink review carries the venue it was tasted at в†’ make sure the item
    // is on that venue's menu (and on every branch of the chain). Done server-side
    // so it works no matter which rating path the client used.
    const venueId = (dto.attributes as any)?.venueId;
    // sane price cap: a dish/drink over 100 000 в‚Ѕ is a typo/troll в†’ clamp so the
    // catalog never shows "1000000 в‚Ѕ"
    let price = (dto.attributes as any)?.price;
    if (price != null) {
      price = Math.max(0, Math.min(100000, Math.round(Number(price) || 0))) || undefined;
      if (dto.attributes && typeof dto.attributes === 'object') (dto.attributes as any).price = price;
    }
    if (venueId) await this.linkChain(userId, listingId, venueId, price);
    // implicit-feedback signal for the recommender (high ratings = strong positive)
    const recType = rating >= 5 ? 'RATE_HIGH' : rating >= 4 ? 'RATE_GOOD' : null;
    if (recType) {
      await this.prisma.interaction
        .create({ data: { userId, listingId, type: recType, weight: rating >= 5 ? 5 : 4 } })
        .catch(() => {});
    }
    await this.recompute(listingId);
    // notify FOLLOWERS about the new post (bell + capped push), fire-and-forget
    void (async () => {
      const followers = await this.prisma.follow.findMany({ where: { followingId: userId }, select: { followerId: true } });
      if (!followers.length) return;
      const listing = await this.prisma.listing.findUnique({ where: { id: listingId }, select: { name: true } });
      const name = await this.actorName(userId);
      for (const f of followers) {
        await this.notifications.add({
          userId: f.followerId,
          kind: 'friend_post',
          actorId: userId,
          actorName: name,
          reviewId: review.id,
          text: `${name} РѕСЃС‚Р°РІРёР»(Р°) РЅРѕРІС‹Р№ РѕС‚Р·С‹РІ вЂ” В«${listing?.name ?? ''}В» ${rating}в…`,
        });
      }
    })().catch(() => {});
    return review;
  }

  /** Link an item to a venue and ALL branches of its chain (shared menu). */
  private async linkChain(userId: string, itemId: string, venueId: string, price?: number) {
    const venue = await this.prisma.listing.findUnique({
      where: { id: venueId },
      select: { groupKey: true, name: true },
    });
    if (!venue) return;
    const where = venue.groupKey
      ? { groupKey: venue.groupKey, type: 'RESTAURANT' as const }
      : { name: { equals: venue.name ?? '', mode: 'insensitive' as const }, type: 'RESTAURANT' as const };
    const branchIds = (await this.prisma.listing.findMany({ where, select: { id: true } })).map(
      (b) => b.id,
    );
    if (!branchIds.includes(venueId)) branchIds.push(venueId);
    for (const vid of branchIds) {
      await this.prisma.menuLink.upsert({
        where: { venueId_itemId: { venueId: vid, itemId } },
        // price only on the branch it was actually tasted at
        create: {
          venueId: vid,
          itemId,
          status: 'APPROVED',
          addedByUserId: userId,
          ...(vid === venueId && price != null ? { price: Number(price) } : {}),
        },
        update: vid === venueId && price != null ? { price: Number(price) } : {},
      });
    }
  }

  /** Delete the user's own review and recompute the listing rating. */
  async remove(userId: string, reviewId: string) {
    const r = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!r || r.userId !== userId) return { ok: false };
    await this.prisma.review.delete({ where: { id: reviewId } });
    await this.recompute(r.listingId);
    return { ok: true };
  }

  /** Keep denormalized avgRating/reviewCount on the listing in sync (approved only). */
  private async recompute(listingId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { listingId, status: 'APPROVED' },
      _avg: { rating: true },
      _count: true,
    });
    await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        avgRating: agg._avg.rating ?? 0,
        reviewCount: agg._count,
      },
    });
  }

  async myReviews(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      include: { listing: true },
      orderBy: { createdAt: 'desc' },
    });
    const ids = reviews.map((r) => r.id);
    const grouped = ids.length
      ? await this.prisma.reviewVote.groupBy({
          by: ['reviewId', 'type'],
          where: { reviewId: { in: ids } },
          _count: true,
        })
      : [];
    const vmap: Record<string, Record<string, number>> = {};
    for (const g of grouped) {
      (vmap[g.reviewId] ??= { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 })[g.type] = g._count;
    }
    const out = reviews.map((r) => ({
      ...r,
      voteCounts: vmap[r.id] ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
    })) as any[];
    // attach the venue for dish/drink reviews
    const itemIds = out
      .filter((r) => r.listing && r.listing.type !== 'RESTAURANT')
      .map((r) => r.listing.id);
    if (itemIds.length) {
      const links = await this.prisma.menuLink.findMany({
        where: { itemId: { in: itemIds } },
        include: { venue: true },
      });
      const venueByItem = new Map<string, { id: string; name: string }>();
219:    // photo sends the review to PENDING for a human look)
220:    let status: 'APPROVED' | 'PENDING' = 'APPROVED';
223:      status = 'PENDING'; // crude / gibberish / non-constructive → the cabinet, not the feed
228:      status = 'PENDING';
240:        status = 'PENDING'; // violation → human moderation
295:    if (venueId) await this.linkChain(userId, listingId, venueId, price);
325:  private async linkChain(userId: string, itemId: string, venueId: string, price?: number) {
345:          status: 'APPROVED',
363:  /** Keep denormalized avgRating/reviewCount on the listing in sync (approved only). */
366:      where: { listingId, status: 'APPROVED' },
373:        avgRating: agg._avg.rating ?? 0,
374:        reviewCount: agg._count,
frontend/src/components/CategoryCelebration.tsx:7:export function CategoryCelebration() {
frontend/src/components/ListingDetail.tsx:105:    return () => clearTimeout(t);
frontend/src/components/ListingDetail.tsx:241:  const [firstTaster, setFirstTaster] = useState<{ user: { id: string; firstName?: string | null; username?: string | null }; at: string } | null>(null);
frontend/src/components/ListingDetail.tsx:285:    return () => clearTimeout(t);
frontend/src/components/ListingDetail.tsx:367:    return () => {
frontend/src/components/ListingDetail.tsx:403:    return () => obs.disconnect();
frontend/src/components/ListingDetail.tsx:428:          api.firstTasterOf(id).then(setFirstTaster).catch(() => {});
frontend/src\categoryGate.ts:25:  return () => unlockListeners.delete(fn);
frontend/src\categoryGate.ts:65:    return () => {
frontend/src\App.tsx:7:import { CategoryCelebration } from './components/CategoryCelebration';
frontend/src\App.tsx:34:    return () => { stop = true; clearInterval(iv); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('alerts-read', onRead); };
frontend/src\App.tsx:80:    return () => {
frontend/src\App.tsx:100:      <CategoryCelebration />
frontend/src\api.ts:262:  firstTasterItems: (take = 8) => getPublic<Listing[]>(`/listings/first-taster?take=${take}`),
frontend/src\api.ts:263:  firstTasterOf: (listingId: string) =>
frontend/src\modalEsc.ts:84:    return () => {
frontend/src\swipeBack.ts:103:      return () => {
frontend/src\swipeBack.ts:111:    return () => {
frontend/src\swipeDismiss.ts:102:    return () => {
frontend/src\swipeDismiss.ts:110:    return () => {
frontend/src\screens\Favorites.tsx:32:    return () => {
frontend/src\screens\MyRatings.tsx:81:    return () => {
frontend/src\components\CategoryCelebration.tsx:7:export function CategoryCelebration() {
frontend/src\components\GameProgress.tsx:31:    return () => clearTimeout(t);
frontend/src\screens\Home.tsx:174:    return () => window.removeEventListener('scroll', onScroll);
frontend/src\screens\Home.tsx:189:  const [firstTaster, setFirstTaster] = useState<Listing[]>([]);
frontend/src\screens\Home.tsx:255:    cachedLoad('firstTaster', () => api.firstTasterItems(8), setFirstTaster);
frontend/src\screens\Home.tsx:324:    return () => {
frontend/src\screens\Home.tsx:341:    return () => clearTimeout(t);
frontend/src\screens\Home.tsx:450:    return () => clearTimeout(t);
frontend/src\screens\Home.tsx:546:    return () => clearTimeout(t);
frontend/src\screens\Home.tsx:816:            const ft = firstTaster.filter((l) => (l as any).recVenue && !skipped.has(l.id) && !NONSTD.test(l.name ?? ''));
frontend/src\components\GroupModal.tsx:39:    return () => {
frontend/src\components\MapBrowse.tsx:129:    return () => clearTimeout(t);
frontend/src\screens\Business.tsx:70:    return () => {
frontend/src\components\NotInterested.tsx:14:    return () => document.removeEventListener('pointerdown', away, true);
frontend/src\components\MapView.tsx:43:    return () => {
frontend/src\components\ListingDetail.tsx:105:    return () => clearTimeout(t);
frontend/src\components\ListingDetail.tsx:241:  const [firstTaster, setFirstTaster] = useState<{ user: { id: string; firstName?: string | null; username?: string | null }; at: string } | null>(null);
frontend/src\components\ListingDetail.tsx:285:    return () => clearTimeout(t);
frontend/src\components\ListingDetail.tsx:367:    return () => {
frontend/src\components\ListingDetail.tsx:403:    return () => obs.disconnect();
frontend/src\components\ListingDetail.tsx:428:          api.firstTasterOf(id).then(setFirstTaster).catch(() => {});
frontend/src\components\People.tsx:86:    return () => clearTimeout(t);
frontend/src\components\ScanFab.tsx:40:    return () => clearTimeout(t);
frontend/src\components\ScanFab.tsx:167:    return () => clearTimeout(t);
frontend/src\components\SimilarItems.tsx:20:    return () => { alive = false; };
frontend/src\components\TasteHero.tsx:39:      return () => clearTimeout(t);
frontend/src\components\TasteHero.tsx:97:    return () => {
frontend/src\components\VenuePicker.tsx:55:    return () => clearTimeout(t);

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg -n \"faceIsUgc|a real user FOOD photo beats|isUserPhoto\" backend/src/reviews/reviews.service.ts backend/src/listings/listings.service.ts; rg -n \"photos\\?|photoUrls|gallery|галер|data\\.photos|data\\.photoUrl\" frontend/src/components/ListingDetail.tsx frontend/src/types.ts | Select-Object -First 100; rg -n \"photos\" backend/prisma/schema.prisma frontend/src/types.ts backend/src/listings/listings.service.ts | Select-Object -First 80" in D:\Приложения\Yelp
 succeeded in 1070ms:
backend/src/listings/listings.service.ts:456:      const isUserPhoto = (r as any).photoUrl?.startsWith('/api/files/') && !(r as any).photoUrl?.startsWith('/api/files/aigen-');
backend/src/listings/listings.service.ts:457:      const venuePhoto = !isUserPhoto ? (best?.photoUrl || tryAt?.photoUrl || null) : null;
backend/src/reviews/reviews.service.ts:208:    const faceIsUgc = !!l?.photoUrl?.startsWith('/api/files/');
backend/src/reviews/reviews.service.ts:210:      .update({ where: { id: listingId }, data: { photos, ...(faceIsUgc ? {} : { photoUrl: url }) } })
backend/src/reviews/reviews.service.ts:275:      const faceIsUgc = !!l?.photoUrl?.startsWith('/api/files/');
backend/src/reviews/reviews.service.ts:279:          // a real user FOOD photo beats a licensed/stock card face
backend/src/reviews/reviews.service.ts:280:          data: { photos, ...(faceIsUgc ? {} : { photoUrl: dto.photoUrls[0] }) },
frontend/src/types.ts:18:  photos?: string[] | null; // accumulating gallery (card + review uploads)
frontend/src/types.ts:90:  photoUrls: string[];
frontend/src/components/ListingDetail.tsx:312:  // complements the photo-handle drag below (which stays for gallery-area gestures)
frontend/src/components/ListingDetail.tsx:352:      if (Math.abs(dx) > Math.abs(dy)) return; // horizontal → leave for gallery
frontend/src/components/ListingDetail.tsx:555:  // Only REAL user photos populate the hero gallery; the seeded brand logo
frontend/src/components/ListingDetail.tsx:556:  // (data.photoUrl) stays as the list thumbnail via VenuePhoto. When there are
frontend/src/components/ListingDetail.tsx:561:  const galleryPhotos = Array.from(
frontend/src/components/ListingDetail.tsx:564:      ...(data.photos ?? []),
frontend/src/components/ListingDetail.tsx:567:  const galleryVideos = Array.from(new Set(data.reviews.flatMap((r) => r.videoUrls ?? [])));
frontend/src/components/ListingDetail.tsx:572:    for (const u of r.photoUrls ?? []) {
frontend/src/components/ListingDetail.tsx:577:    ...galleryPhotos.map((u) => ({ t: 'img' as const, u })),
frontend/src/components/ListingDetail.tsx:578:    ...galleryVideos.map((u) => ({ t: 'video' as const, u })),
frontend/src/components/ListingDetail.tsx:764:        ) : data.photoUrl ? (
frontend/src/components/ListingDetail.tsx:777:          <div className="gallery">
frontend/src/components/ListingDetail.tsx:780:                <img className="gallery-img" src={u} alt="" loading="lazy" />
frontend/src/components/ListingDetail.tsx:1368:                  {(r.photoUrls?.length > 0 || r.videoUrls?.length > 0) && (
frontend/src/components/ListingDetail.tsx:1370:                      {r.photoUrls?.map((u) => (
frontend/src/components/ListingDetail.tsx:1542:                  const second = media.photos?.[1];
frontend/src/types.ts:18:  photos?: string[] | null; // accumulating gallery (card + review uploads)
frontend/src/types.ts:146:  placeholderPhotos?: string[]; // illustrative stock, shown only when no real photos
backend/src/listings/listings.service.ts:454:      // then «Попробуйте в:». User photos always win; venue photo only when no
backend/src/listings/listings.service.ts:1718:            // only real post photos of the dish, never fetched stock images
backend/src/listings/listings.service.ts:1803:    // check-ins: count + recent real photos (used to replace stock placeholders)
backend/src/listings/listings.service.ts:1815:    // illustrative stock placeholders — shown until REAL user photos exist
backend/src/listings/listings.service.ts:1995:      const p = data.photos?.[0];
backend/prisma/schema.prisma:143:  photos      String[]    @default([]) // accumulating gallery: every added photo (card + reviews)

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$l=Get-Content frontend/src/components/ListingDetail.tsx; for($i=545;$i -lt 585;$i++){ '"'{0,5}: {1}' -f ("'$i+1),$l[$i] }; for($i=730;$i -lt 820;$i++){ '"'{0,5}: {1}' -f ("'$i+1),$l[$i] }; $t=Get-Content frontend/src/types.ts; for($i=0;$i -lt 45;$i++){ '"'{0,5}: {1}' -f ("'$i+1),$t[$i] }' in D:\Приложения\Yelp
 succeeded in 1057ms:
  546:   // context-aware place word for the "rate" CTA (coffee в†’ РєРѕС„РµР№РЅСЋ, beer/wine в†’ Р±Р°СЂ)
  547:   const venueWord = (() => {
  548:     const c = (data.category ?? '').toLowerCase();
  549:     if (/РєРѕС„Рµ|coffee|СЌСЃРїСЂРµСЃСЃРѕ|Р»Р°С‚С‚Рµ|С‡Р°Р№|tea/.test(c)) return 'РєРѕС„РµР№РЅСЋ';
  550:     if (/РїРёРІ|beer|ipa|Р»Р°РіРµСЂ|СЌР»СЊ|СЃС‚Р°СѓС‚|РїРѕСЂС‚РµСЂ|РІРёРЅРѕ|wine|РєРѕРєС‚РµР№Р»|cocktail|С€Р°РјРїР°РЅ|РёРіСЂРёСЃС‚/.test(c))
  551:       return 'Р±Р°СЂ';
  552:     return 'СЂРµСЃС‚РѕСЂР°РЅ';
  553:   })();
  554: 
  555:   // Only REAL user photos populate the hero gallery; the seeded brand logo
  556:   // (data.photoUrl) stays as the list thumbnail via VenuePhoto. When there are
  557:   // no user photos, the backend supplies labeled stock placeholders instead.
  558:   // the shared-card carousel shows ONLY food-verified photos (checkins + photos
  559:   // promoted by moderation) вЂ” a selfie/face review photo stays inside its own
  560:   // review but never leads the dish card (owner rule 12.07.2026)
  561:   const galleryPhotos = Array.from(
  562:     new Set([
  563:       ...(data.checkinPhotos ?? []),
  564:       ...(data.photos ?? []),
  565:     ]),
  566:   );
  567:   const galleryVideos = Array.from(new Set(data.reviews.flatMap((r) => r.videoUrls ?? [])));
  568:   // every review photo remembers WHERE it was tasted and by whom вЂ” the carousel
  569:   // captions come from here (photo в†’ dish at a specific venue в†’ shared card)
  570:   const mediaMeta = new Map<string, { venue?: string; user?: string }>();
  571:   for (const r of data.reviews) {
  572:     for (const u of r.photoUrls ?? []) {
  573:       if (!mediaMeta.has(u)) mediaMeta.set(u, { venue: (r as any).venue?.name, user: r.user?.firstName ?? undefined });
  574:     }
  575:   }
  576:   const media: { t: 'img' | 'video'; u: string }[] = [
  577:     ...galleryPhotos.map((u) => ({ t: 'img' as const, u })),
  578:     ...galleryVideos.map((u) => ({ t: 'video' as const, u })),
  579:   ];
  580: 
  581:   const thumbUrl = (u: string) => thumb(u, 600) ?? u;
  582: 
  583:   const VOTE_LABEL: Record<VoteType, string> = {
  584:     USEFUL: 'рџ‘Ќ РџРѕР»РµР·РЅРѕ',
  585:     FUNNY: 'рџ„ РЎРјРµС€РЅРѕ',
  731:           </button>
  732:           {/* price of this item at the venue в†’ on the photo, bottom-left */}
  733:           {!isRestaurant && venuePrice != null && (
  734:             <span className="newdish-price detail-price-badge">{venuePrice} в‚Ѕ</span>
  735:           )}
  736:           {/* rating right on the photo в†’ visible without scrolling */}
  737:           {!isRestaurant && (
  738:             <div className="detail-rating-badge">
  739:               {data.reviewCount > 0 ? `в… ${data.avgRating.toFixed(1)} (${data.reviewCount} ${ratingsWord(data.reviewCount)})` : 'РќРµС‚ РѕС†РµРЅРѕРє'}
  740:             </div>
  741:           )}
  742:           {media.length > 1 ? (
  743:           /* CAROUSEL: full-width snap slides; each photo names its venue */
  744:           <div className="carousel">
  745:             {media.map((m, i) => {
  746:               return (
  747:                 <div key={i} className="carousel-slide">
  748:                   {m.t === 'img' ? (
  749:                     <img className="detail-photo" src={thumbUrl(m.u)} alt="" loading={i > 0 ? 'lazy' : 'eager'} />
  750:                   ) : (
  751:                     <video className="detail-photo" src={m.u} controls playsInline />
  752:                   )}
  753: 
  754:                 </div>
  755:               );
  756:             })}
  757:           </div>
  758:         ) : media.length === 1 ? (
  759:           media[0].t === 'img' ? (
  760:             <img className="detail-photo" src={media[0].u} alt={data.name} />
  761:           ) : (
  762:             <video className="detail-photo" src={media[0].u} controls playsInline />
  763:           )
  764:         ) : data.photoUrl ? (
  765:           // no user photos yet в†’ venue's own photo, marked illustrative (only here, inside the card)
  766:           <div className={'stock-wrap' + (venuePrice != null ? ' has-price' : '')}>
  767:             <VenuePhoto listing={data} className="detail-photo" allowVenuePhoto />
  768:             <span className="stock-badge">рџ“· Р¤РѕС‚Рѕ РёР»Р»СЋСЃС‚СЂР°С‚РёРІРЅРѕРµ В· РѕР±РЅРѕРІРёС‚СЃСЏ РїРѕСЃР»Рµ РѕС‚Р·С‹РІР° СЃ С„РѕС‚Рѕ</span>
  769:           </div>
  770:         ) : data.placeholderPhotos && data.placeholderPhotos.length === 1 ? (
  771:           // single illustrative photo в†’ fill the whole card width (equal margins)
  772:           <div className={'stock-wrap' + (venuePrice != null ? ' has-price' : '')}>
  773:             <img className="detail-photo" src={data.placeholderPhotos[0]} alt="" loading="lazy" />
  774:             <span className="stock-badge">рџ“· Р¤РѕС‚Рѕ РёР»Р»СЋСЃС‚СЂР°С‚РёРІРЅРѕРµ В· РѕР±РЅРѕРІРёС‚СЃСЏ РїРѕСЃР»Рµ РѕС‚Р·С‹РІР° СЃ С„РѕС‚Рѕ</span>
  775:           </div>
  776:         ) : data.placeholderPhotos && data.placeholderPhotos.length > 0 ? (
  777:           <div className="gallery">
  778:             {data.placeholderPhotos.map((u, i) => (
  779:               <div key={i} className="stock-wrap">
  780:                 <img className="gallery-img" src={u} alt="" loading="lazy" />
  781:                 <span className="stock-badge">рџ“· Р¤РѕС‚Рѕ РёР»Р»СЋСЃС‚СЂР°С‚РёРІРЅРѕРµ В· РѕР±РЅРѕРІРёС‚СЃСЏ РїРѕСЃР»Рµ РѕС‚Р·С‹РІР° СЃ С„РѕС‚Рѕ</span>
  782:               </div>
  783:             ))}
  784:           </div>
  785:           ) : (
  786:             <VenuePhoto listing={data} className="detail-photo" />
  787:           )}
  788:         </div>
  789:         <h3 style={{ marginTop: 12, fontSize: 24 }}>{data.name}</h3>
  790: 
  791:         <div className="rating-head">
  792:           {data.reviewCount > 0 ? (
  793:             <>
  794:               <Stars value={data.avgRating} />
  795:               <b>{data.avgRating.toFixed(1)}</b>
  796:             </>
  797:           ) : (
  798:             <span className="no-rating">РќРµС‚ РѕС†РµРЅРѕРє</span>
  799:           )}
  800:           <span className="meta" style={{ color: 'var(--hint)' }}>
  801:             {data.reviewCount > 0 ? `(${data.reviewCount} ${ratingsWord(data.reviewCount)})` : ''}
  802:             {data.chain ? ' В· СЌС‚Р° С‚РѕС‡РєР°' : ''}
  803:             {data.checkinCount ? ` В· рџ“Ќ ${data.checkinCount} С‡РµРє-РёРЅРѕРІ` : ''}
  804:           </span>
  805:         </div>
  806:         {data.chain && (
  807:           <div className="meta" style={{ color: 'var(--hint)', marginTop: 4, fontSize: 13 }}>
  808:             Р РµР№С‚РёРЅРі СЃРµС‚Рё: <b style={{ color: 'var(--text)' }}>{data.chain.avgRating.toFixed(1)}</b> (
  809:             {data.chain.reviewCount}) В· {data.chain.branchCount} С‚РѕС‡РµРє
  810:           </div>
  811:         )}
  812: 
  813:         <div className="info-line">
  814:           {data.priceLevel ? <span>{'в‚Ѕ'.repeat(data.priceLevel)}</span> : null}
  815:           <span>
  816:             {[
  817:               // "Р‘Р»СЋРґРѕ"/"РќР°РїРёС‚РѕРє" is implied вЂ” show the cuisine/category instead
  818:               isRestaurant ? TYPE_LABEL[data.type] : null,
  819:               ...cuisineTags(data.cuisine),
  820:               !isRestaurant && data.category && !/Р±Р»СЋРґРѕ|РЅР°РїРёС‚РѕРє/i.test(data.category)
    1: export type ListingType = 'RESTAURANT' | 'DISH' | 'DRINK';
    2: 
    3: export interface Amenities {
    4:   accessibility?: string[];
    5:   payments?: string[];
    6:   features?: string[];
    7:   diet?: string[];
    8: }
    9: 
   10: export interface Listing {
   11:   id: string;
   12:   type: ListingType;
   13:   name: string;
   14:   description?: string | null;
   15:   category?: string | null;
   16:   address?: string | null;
   17:   photoUrl?: string | null;
   18:   photos?: string[] | null; // accumulating gallery (card + review uploads)
   19:   priceLevel?: number | null;
   20:   lat?: number | null;
   21:   lng?: number | null;
   22:   phone?: string | null;
   23:   website?: string | null;
   24:   brand?: string | null;
   25:   hours?: string | null;
   26:   cuisine?: string | null;
   27:   groupKey?: string | null;
   28:   amenities?: Amenities | null;
   29:   branchCount?: number; // >1 means it's a chain (set by grouped search)
   30:   deliveryYandex?: string | null;
   31:   deliverySamokat?: string | null;
   32:   deliveryVk?: string | null;
   33:   avgRating: number;
   34:   reviewCount: number;
   35:   snippet?: { text: string; rating: number } | null; // one review shown on cards
   36:   bestVenue?: { name: string; rating: number } | null; // for dish/drink: best place to have it
   37:   recVenue?: { id: string; name: string; price?: number | null } | null; // recommended place (+ its price for this item)
   38:   recReason?: string; // why recommended (taste match) вЂ” shown on feed rec cards
   39:   matchPct?: number; // % taste match (unlocked after 10 ratings)
   40:   placeholderPhoto?: string | null; // stock photo when no real photo
   41:   cityLabel?: string; // shown when there's no street address yet
   42:   metro?: string | null; // nearest metro station в†’ "Рј. вЂ¦"
   43: }
   44: 
   45: export interface Branch {

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content backend/src/notifications/notifications.service.ts; rg -n "bot|sendMessage|push|Telegram|TELEGRAM" backend/src/notifications backend/src/reviews backend/src/social | Select-Object -First 150; rg -n "attributes|price" frontend/src/components/ReviewForm.tsx frontend/src/components/ListingDetail.tsx frontend/src/tasting.ts | Select-Object -First 120' in D:\Приложения\Yelp
 succeeded in 1183ms:
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Notification center + bot push (owner spec 16.07.2026):
// events вЂ” vote on my review, comment on my review, new follower, new post by
// someone I follow. Every event lands in the bell center; the BOT PUSH is capped
// at ONE per user per day вЂ” extra events that day are push-cleared (in-app only).
@Injectable()
export class NotificationsService {
  private readonly log = new Logger('Notifications');
  constructor(private readonly prisma: PrismaService) {}

  async add(opts: {
    userId: string;
    kind: 'vote' | 'comment' | 'follow' | 'friend_post' | 'rating_up';
    text: string;
    actorId?: string | null;
    actorName?: string | null;
    reviewId?: string | null;
  }) {
    const { userId, kind, text, actorId, actorName, reviewId } = opts;
    if (!userId || (actorId && actorId === userId)) return; // never notify about yourself
    try {
      // near-duplicate guard: the same actor+kind+review within an hour is one event
      const dupe = await this.prisma.notification.findFirst({
        where: {
          userId, kind, actorId: actorId ?? undefined, reviewId: reviewId ?? undefined,
          createdAt: { gte: new Date(Date.now() - 3_600_000) },
        },
      });
      if (dupe) return;
      const created = await this.prisma.notification.create({
        data: { userId, kind, text, actorId, actorName, reviewId },
      });
      // keep the center tidy вЂ” last 50 per user
      const excess = await this.prisma.notification.findMany({
        where: { userId }, orderBy: { createdAt: 'desc' }, skip: 50, select: { id: true },
      });
      if (excess.length) await this.prisma.notification.deleteMany({ where: { id: { in: excess.map((e) => e.id) } } });
      await this.maybePush(userId, created.id, text);
    } catch (e) {
      this.log.warn(`add failed: ${(e as Error).message}`);
    }
  }

  /** Bot push, HARD-capped at 1 per user per day. Beyond that вЂ” bell-only. */
  private async maybePush(userId: string, notificationId: string, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const pushedToday = await this.prisma.notification.count({
      where: { userId, pushed: true, createdAt: { gte: dayStart } },
    });
    if (pushedToday >= 1) return;
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { telegramId: true } });
    if (!user?.telegramId) return;
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: String(user.telegramId), text: `рџ”” ${text}\n\nРћС‚РєСЂРѕР№С‚Рµ РїСЂРёР»РѕР¶РµРЅРёРµ вЂ” РІ РєРѕР»РѕРєРѕР»СЊС‡РёРєРµ РІСЃС‘ РЅРѕРІРѕРµ.` }),
        signal: AbortSignal.timeout(10_000),
      });
      if (r.ok) {
        await this.prisma.notification.update({ where: { id: notificationId }, data: { pushed: true } });
        // OWNER RULE 18.07.2026: the push pops up as a banner but must NOT stay
        // in the chat вЂ” self-delete after a beat; the bell keeps the history
        const j = (await r.json().catch(() => null)) as any;
        const messageId = j?.result?.message_id;
        if (messageId) {
          setTimeout(() => {
            fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: String(user.telegramId), message_id: messageId }),
            }).catch(() => {});
          }, 20_000);
        }
      }
    } catch { /* user may have blocked the bot вЂ” fine */ }
  }

  async list(userId: string) {
    const items = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    // tap в†’ the source review's card: attach the listing behind each review;
    // the row also shows the ACTOR's avatar (left) and the review photo (right)
    const reviewIds = [...new Set(items.map((n) => n.reviewId).filter(Boolean))] as string[];
    const actorIds = [...new Set(items.map((n) => n.actorId).filter(Boolean))] as string[];
    const [reviews, actors] = await Promise.all([
      reviewIds.length
        ? this.prisma.review.findMany({
            where: { id: { in: reviewIds } },
            select: { id: true, listingId: true, photoUrls: true, listing: { select: { name: true, photoUrl: true } } },
          })
        : [],
      actorIds.length
        ? this.prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, photoUrl: true } })
        : [],
    ]);
    const byReview = new Map(reviews.map((r) => [r.id, r]));
    const actorPhoto = new Map(actors.map((a) => [a.id, a.photoUrl]));
    const enriched = items.map((n) => {
      const r = n.reviewId ? byReview.get(n.reviewId) : null;
      return {
        ...n,
        listingId: r?.listingId ?? null,
        listingName: r?.listing?.name ?? null,
        reviewPhoto: r?.photoUrls?.[0] ?? r?.listing?.photoUrl ?? null,
        actorPhoto: n.actorId ? actorPhoto.get(n.actorId) ?? null : null,
      };
    });
    const unread = items.filter((n) => !n.readAt).length;
    return { items: enriched, unread };
  }

  async unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return { ok: true };
  }
}
backend/src/notifications\notifications.controller.ts:2:import { TelegramAuthGuard } from '../common/telegram-auth.guard';
backend/src/notifications\notifications.controller.ts:7:@UseGuards(TelegramAuthGuard)
backend/src/notifications\notifications.controller.ts:16:    const u = await this.users.upsertFromTelegram(req.telegramUser);
backend/src/notifications\notifications.controller.ts:22:    const u = await this.users.upsertFromTelegram(req.telegramUser);
backend/src/notifications\notifications.controller.ts:28:    const u = await this.users.upsertFromTelegram(req.telegramUser);
backend/src/reviews\reviews.service.ts:88:      for await (const c of obj.body) chunks.push(c as Buffer);
backend/src/reviews\reviews.service.ts:137:    // notify the review's author (bell + capped bot push), fire-and-forget
backend/src/reviews\reviews.service.ts:171:  /** Prepare a rich Telegram message to send to a friend: the check-in PHOTO +
backend/src/reviews\reviews.service.ts:175:    const token = process.env.TELEGRAM_BOT_TOKEN;
backend/src/reviews\reviews.service.ts:178:    const deepLink = `https://t.me/togomoscow_bot?startapp=l_${listingId}`;
backend/src/reviews\reviews.service.ts:185:    const r = await fetch(`https://api.telegram.org/bot${token}/savePreparedInlineMessage`, {
backend/src/reviews\reviews.service.ts:304:    // notify FOLLOWERS about the new post (bell + capped push), fire-and-forget
backend/src/reviews\reviews.service.ts:337:    if (!branchIds.includes(venueId)) branchIds.push(venueId);
backend/src/reviews\reviews.service.ts:429:      // notify the review's author (bell + capped bot push), fire-and-forget
backend/src/reviews\reviews.service.ts:460:      if (v.userId === userId) mine.push(v.type);
backend/src/notifications\notifications.service.ts:4:// Notification center + bot push (owner spec 16.07.2026):
backend/src/notifications\notifications.service.ts:7:// at ONE per user per day — extra events that day are push-cleared (in-app only).
backend/src/notifications\notifications.service.ts:46:  /** Bot push, HARD-capped at 1 per user per day. Beyond that — bell-only. */
backend/src/notifications\notifications.service.ts:48:    const token = process.env.TELEGRAM_BOT_TOKEN;
backend/src/notifications\notifications.service.ts:52:    const pushedToday = await this.prisma.notification.count({
backend/src/notifications\notifications.service.ts:53:      where: { userId, pushed: true, createdAt: { gte: dayStart } },
backend/src/notifications\notifications.service.ts:55:    if (pushedToday >= 1) return;
backend/src/notifications\notifications.service.ts:59:      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
backend/src/notifications\notifications.service.ts:66:        await this.prisma.notification.update({ where: { id: notificationId }, data: { pushed: true } });
backend/src/notifications\notifications.service.ts:67:        // OWNER RULE 18.07.2026: the push pops up as a banner but must NOT stay
backend/src/notifications\notifications.service.ts:73:            fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
backend/src/notifications\notifications.service.ts:81:    } catch { /* user may have blocked the bot — fine */ }
backend/src/reviews\reviews.controller.ts:3:import { TelegramAuthGuard } from '../common/telegram-auth.guard';
backend/src/reviews\reviews.controller.ts:8:@UseGuards(TelegramAuthGuard)
backend/src/reviews\reviews.controller.ts:21:    const user = await this.users.upsertFromTelegram(req.telegramUser);
backend/src/reviews\reviews.controller.ts:27:    const user = await this.users.upsertFromTelegram(req.telegramUser);
backend/src/reviews\reviews.controller.ts:33:    const user = await this.users.upsertFromTelegram(req.telegramUser);
backend/src/reviews\reviews.controller.ts:39:    const user = await this.users.upsertFromTelegram(req.telegramUser);
backend/src/reviews\reviews.controller.ts:46:    const user = await this.users.upsertFromTelegram(req.telegramUser);
backend/src/reviews\reviews.controller.ts:62:    const user = await this.users.upsertFromTelegram(req.telegramUser);
backend/src/reviews\reviews.controller.ts:68:    const user = await this.users.upsertFromTelegram(req.telegramUser);
backend/src/reviews\reviews.controller.ts:81:    const user = await this.users.upsertFromTelegram(req.telegramUser);
backend/src/social\social.controller.ts:12:import { TelegramAuthGuard } from '../common/telegram-auth.guard';
backend/src/social\social.controller.ts:17:@UseGuards(TelegramAuthGuard)
backend/src/social\social.controller.ts:25:    return this.users.upsertFromTelegram(req.telegramUser);
backend/src/social\social.service.ts:204:      byReview.get(c.reviewId)!.push(c);
backend/src/social\social.service.ts:543:    // bell notification + capped bot push (owner re-enabled 16.07.2026)
backend/src/social\social.service.ts:560:  /** Push "На вас подписался {name}" to the followed user via the bot. */
backend/src/social\social.service.ts:562:    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
backend/src/social\social.service.ts:570:    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
frontend/src/tasting.ts:3:// Stored into Review.attributes (Json) — no schema change.
frontend/src/components/ReviewForm.tsx:25:  knownPrice?: number | null; // item already has a price here → don't ask for it
frontend/src/components/ReviewForm.tsx:30:  const prev = (existing?.attributes ?? {}) as Record<string, any>;
frontend/src/components/ReviewForm.tsx:47:  const [price, setPrice] = useState<string>(prev.price ? String(prev.price) : '');
frontend/src/components/ReviewForm.tsx:112:      const priceNum = price ? Math.max(0, Math.round(Number(price))) : 0;
frontend/src/components/ReviewForm.tsx:116:      const attributes: Record<string, any> = {
frontend/src/components/ReviewForm.tsx:122:        ...(priceNum ? { price: priceNum } : {}),
frontend/src/components/ReviewForm.tsx:126:      const saved = await api.createReview(listing.id, { rating, text, attributes, photoUrls, videoUrls });
frontend/src/components/ReviewForm.tsx:269:        {/* price already known for this item at this venue → don't ask again */}
frontend/src/components/ReviewForm.tsx:278:              value={price}
frontend/src/components/ListingDetail.tsx:48:              <div className="mini-price">{(l as any).menuPrice} ₽</div>
frontend/src/components/ListingDetail.tsx:236:  originVenue?: { id: string; name: string; price?: number | null } | null; // recommended place → check-in attaches here
frontend/src/components/ListingDetail.tsx:266:  const [originVenue, setOriginVenue] = useState<{ id: string; name: string; price?: number | null } | null>(
frontend/src/components/ListingDetail.tsx:526:  // price of this item at the venue we'd rate it in (came from the card / recommendation,
frontend/src/components/ListingDetail.tsx:527:  // or where the user tasted it) → shown on the photo + skips the price question in review
frontend/src/components/ListingDetail.tsx:529:    originVenue?.price ??
frontend/src/components/ListingDetail.tsx:530:    (data.recVenue as any)?.price ??
frontend/src/components/ListingDetail.tsx:644:  // Yelp-style menu card: big photo + price overlay + name + rating count
frontend/src/components/ListingDetail.tsx:649:        {it.price ? <span className="menu-card-price">{it.price} ₽</span> : null}
frontend/src/components/ListingDetail.tsx:732:          {/* price of this item at the venue → on the photo, bottom-left */}
frontend/src/components/ListingDetail.tsx:734:            <span className="newdish-price detail-price-badge">{venuePrice} ₽</span>
frontend/src/components/ListingDetail.tsx:766:          <div className={'stock-wrap' + (venuePrice != null ? ' has-price' : '')}>
frontend/src/components/ListingDetail.tsx:772:          <div className={'stock-wrap' + (venuePrice != null ? ' has-price' : '')}>
frontend/src/components/ListingDetail.tsx:814:          {data.priceLevel ? <span>{'₽'.repeat(data.priceLevel)}</span> : null}
frontend/src/components/ListingDetail.tsx:914:                    {ev.price ? <span className="newdish-price">{ev.price} ₽</span> : null}
frontend/src/components/ListingDetail.tsx:1231:                      {ev.price ? <span className="menu-card-price">{ev.price} ₽</span> : null}
frontend/src/components/ListingDetail.tsx:1367:                  <ReviewAttrs attributes={r.attributes} />
frontend/src/components/ListingDetail.tsx:1482:          // item already has a price at this venue → don't ask for it again in the review

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$l=Get-Content backend/src/social/social.service.ts; for($i=520;$i -lt 590;$i++){ '"'{0,5}: {1}' -f ("'$i+1),$l[$i] }; rg -n "maybePush|sendMessage|owner re-enabled|notifyFollow" backend/src/notifications/notifications.service.ts backend/src/social/social.service.ts' in D:\Приложения\Yelp
 succeeded in 1021ms:
  521:   /** Instagram-style profile header: the user + their counts. */
  522:   async profile(userId: string) {
  523:     const [user, reviews, followers, following, favorites] = await Promise.all([
  524:       this.prisma.user.findUnique({ where: { id: userId } }),
  525:       this.prisma.review.count({ where: { userId } }),
  526:       this.prisma.follow.count({ where: { followingId: userId } }),
  527:       this.prisma.follow.count({ where: { followerId: userId } }),
  528:       this.prisma.favorite.count({ where: { userId } }),
  529:     ]);
  530:     return { user, counts: { reviews, followers, following, favorites } };
  531:   }
  532: 
  533:   async follow(userId: string, targetId: string) {
  534:     if (userId === targetId) return { ok: false };
  535:     const existing = await this.prisma.follow.findUnique({
  536:       where: { followerId_followingId: { followerId: userId, followingId: targetId } },
  537:     });
  538:     await this.prisma.follow.upsert({
  539:       where: { followerId_followingId: { followerId: userId, followingId: targetId } },
  540:       create: { followerId: userId, followingId: targetId },
  541:       update: {},
  542:     });
  543:     // bell notification + capped bot push (owner re-enabled 16.07.2026)
  544:     if (!existing) {
  545:       void (async () => {
  546:         const me = await this.prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, username: true } });
  547:         const name = me?.firstName || me?.username || 'РљС‚Рѕ-С‚Рѕ';
  548:         await this.notifications.add({
  549:           userId: targetId,
  550:           kind: 'follow',
  551:           actorId: userId,
  552:           actorName: name,
  553:           text: `${name} РїРѕРґРїРёСЃР°Р»СЃСЏ(Р»Р°СЃСЊ) РЅР° РІР°СЃ`,
  554:         });
  555:       })().catch(() => {});
  556:     }
  557:     return { ok: true };
  558:   }
  559: 
  560:   /** Push "РќР° РІР°СЃ РїРѕРґРїРёСЃР°Р»СЃСЏ {name}" to the followed user via the bot. */
  561:   private async notifyFollow(userId: string, targetId: string) {
  562:     const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
  563:     if (!token) return;
  564:     const [me, target] = await Promise.all([
  565:       this.prisma.user.findUnique({ where: { id: userId } }),
  566:       this.prisma.user.findUnique({ where: { id: targetId } }),
  567:     ]);
  568:     if (!target?.telegramId) return;
  569:     const name = me?.firstName ?? me?.username ?? 'РљС‚Рѕ-С‚Рѕ';
  570:     await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
  571:       method: 'POST',
  572:       headers: { 'Content-Type': 'application/json' },
  573:       body: JSON.stringify({ chat_id: String(target.telegramId), text: `рџ‘¤ РќР° РІР°СЃ РїРѕРґРїРёСЃР°Р»СЃСЏ ${name}` }),
  574:     }).catch(() => {});
  575:   }
  576: 
  577:   async unfollow(userId: string, targetId: string) {
  578:     await this.prisma.follow.deleteMany({
  579:       where: { followerId: userId, followingId: targetId },
  580:     });
  581:     return { ok: true };
  582:   }
  583: }
  584: 
  585: 
  586: 
  587: 
  588: 
  589: 
  590: 
backend/src/social/social.service.ts:543:    // bell notification + capped bot push (owner re-enabled 16.07.2026)
backend/src/social/social.service.ts:561:  private async notifyFollow(userId: string, targetId: string) {
backend/src/social/social.service.ts:570:    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
backend/src/notifications/notifications.service.ts:40:      await this.maybePush(userId, created.id, text);
backend/src/notifications/notifications.service.ts:47:  private async maybePush(userId: string, notificationId: string, text: string) {
backend/src/notifications/notifications.service.ts:59:      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content frontend/src/components/ScanFab.tsx; rg -n \"recogn|Попробовать|Переснять|retry|useEscClose|setFile|inputRef|camera\" frontend/src/components/ScanFab.tsx frontend/src -g '*.tsx'; rg -n \"cache|headers|preview|configurePreview|no-store|immutable\" frontend/vite.config.ts frontend/index.html" in D:\Приложения\Yelp
 succeeded in 797ms:
import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useEscClose } from '../modalEsc';
import { haptic } from '../telegram';
import type { Listing, RecognizeResult } from '../types';
import { ReviewForm } from './ReviewForm';
import { VenuePicker } from './VenuePicker';

function CamIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

// Search inside the recognition sheet: when the AI didn't guess it, the user finds
// the item manually вЂ” that correction is the strongest training signal we get.
function ScanSearch({ onPick, initial }: { onPick: (l: Listing) => void; initial?: string }) {
  const [q, setQ] = useState(initial ?? '');
  const [found, setFound] = useState<Listing[]>([]);
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) { setFound([]); return; }
    const t = setTimeout(() => {
      api.searchAll(query)
        .then((list) => setFound(list.filter((l) => l.type === 'DISH' || l.type === 'DRINK').slice(0, 5)))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="scan-search">
      <input
        placeholder="РќРµ С‚Рѕ? РќР°Р№РґРёС‚Рµ РІСЂСѓС‡РЅСѓСЋвЂ¦"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {found.length > 0 && (
        <div className="scan-list">
          {found.map((l) => (
            <button key={l.id} className="scan-cand" onClick={() => onPick(l)}>
              <div className="scan-cand-thumb">
                {l.photoUrl ? <img src={l.photoUrl} alt="" loading="lazy" /> : <span>рџЌЅ</span>}
              </div>
              <div className="scan-cand-body">
                <b>{l.name}</b>
                <span className="scan-cand-meta">{l.category ?? ''}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ScanDialog({
  busy,
  result,
  preview,
  onClose,
  onRetake,
  onRetryAnalysis,
  onPickCandidate,
  onPickSearch,
}: {
  busy: boolean;
  result: RecognizeResult | null;
  preview: string | null;
  onClose: () => void;
  onRetake: () => void;
  onRetryAnalysis: () => void;
  onPickCandidate: (id: string, result: RecognizeResult) => void;
  onPickSearch: (l: Listing) => void;
}) {
  useEscClose(onClose);

  return (
    <div className="modal-backdrop scan-backdrop" style={{ zIndex: 3600 }} onClick={() => !busy && onClose()}>
      <div className="scan-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="scan-back" onClick={onClose} aria-label="Р—Р°РєСЂС‹С‚СЊ">
          <BackIcon />
        </button>
        {preview && <img className="scan-preview" src={preview} alt="" />}
        {busy ? (
          <div className="scan-loading">
            <span className="scan-spinner" />
            РР Р°РЅР°Р»РёР·РёСЂСѓРµС‚ С„РѕС‚Рѕ...
          </div>
        ) : result && result.candidates.length ? (
          <>
            {result.labelText && <div className="scan-label-badge">рџЌ· Р­С‚РёРєРµС‚РєР°: {result.labelText}</div>}
            <div className="scan-title">Р§С‚Рѕ РёРјРµРЅРЅРѕ РЅР° С„РѕС‚Рѕ? РџРѕРґС‚РІРµСЂРґРёС‚Рµ</div>
            <div className="scan-list">
              {result.candidates.map((c, i) => (
                <button
                  key={c.id}
                  className={'scan-cand' + (i === 0 && result.topConfident ? ' top' : '')}
                  onClick={() => onPickCandidate(c.id, result)}
                >
                  <div className="scan-cand-thumb">
                    {c.photoUrl ? <img src={c.photoUrl} alt="" /> : <span>рџЌЅ</span>}
                  </div>
                  <div className="scan-cand-body">
                    <b>{c.name}</b>
                    <span className="scan-cand-meta">
                      {i === 0 && result.topConfident ? 'вњ“ СЃРєРѕСЂРµРµ РІСЃРµРіРѕ СЌС‚Рѕ' : c.reviewCount > 0 ? `в… ${c.avgRating.toFixed(1)} В· ${c.reviewCount}` : 'РќРµС‚ РѕС†РµРЅРѕРє'}
                    </span>
                  </div>
                  <span className="scan-conf">{Math.round(c.confidence * 100)}%</span>
                </button>
              ))}
            </div>
            <ScanSearch onPick={onPickSearch} initial={result.labelText} />
            <button className="scan-retry" onClick={onRetryAnalysis}>
              РџРѕРїСЂРѕР±РѕРІР°С‚СЊ РµС‰Рµ СЂР°Р·
            </button>
            <button className="scan-retry scan-retake" onClick={onRetake}>
              РЎРґРµР»Р°С‚СЊ С„РѕС‚Рѕ Р·Р°РЅРѕРІРѕ
            </button>
          </>
        ) : (
          <div className="scan-empty">
            {result?.labelText ? (
              <div>рџЌ· Р­С‚РёРєРµС‚РєР°: <b>{result.labelText}</b></div>
            ) : (
              <div>РќРµ СѓРґР°Р»РѕСЃСЊ СЂР°СЃРїРѕР·РЅР°С‚СЊ рџ¤”</div>
            )}
            {result?.diagnostic && !result?.labelText && <small>{result.diagnostic}</small>}
            <ScanSearch onPick={onPickSearch} initial={result?.labelText} />
            <button className="scan-retry" onClick={onRetryAnalysis}>
              РџРѕРїСЂРѕР±РѕРІР°С‚СЊ РµС‰Рµ СЂР°Р·
            </button>
            <button className="scan-retry scan-retake" onClick={onRetake}>
              РЎРґРµР»Р°С‚СЊ С„РѕС‚Рѕ Р·Р°РЅРѕРІРѕ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ScanFab() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [srcMenu, setSrcMenu] = useState(false);
  // one soft pulse per session draws the eye to the key action (UX Core: anchoring
  // attention with motion вЂ” once, not constantly)
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem('fabPulsed')) return;
    sessionStorage.setItem('fabPulsed', '1');
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 3600);
    return () => clearTimeout(t);
  }, []);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RecognizeResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Listing | null>(null);
  const [venue, setVenue] = useState<{ id?: string; name: string; pending?: boolean } | null>(null);
  const [stage, setStage] = useState<'idle' | 'pickVenue' | 'rate'>('idle');
  const uploadedUrl = useRef<string | undefined>(undefined);
  const lastFile = useRef<File | null>(null);

  const reset = () => {
    setResult(null);
    setBusy(false);
    setChosen(null);
    setVenue(null);
    setStage('idle');
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p);
      return null;
    });
    uploadedUrl.current = undefined;
    lastFile.current = null;
  };

  const runRecognition = async (file: File) => {
    setBusy(true);
    setResult(null);
    try {
      const r = await api.recognize(file, 'auto');
      // NEVER auto-open (owner rule): always show the choices and let the user
      // confirm вЂ” even when the AI is 100% sure. The top match is pre-highlighted.
      setResult(r);
      setBusy(false);
    } catch (e) {
      setResult({
        caption: '',
        mode: 'auto',
        candidates: [],
        autoOpen: false,
        diagnostic: e instanceof Error ? e.message : 'recognize failed',
      });
      setBusy(false);
    }
  };

  const pickCandidate = async (id: string, r: RecognizeResult) => {
    api
      .visionFeedback({
        photoUrl: uploadedUrl.current,
        caption: r.caption,
        mode: r.mode,
        predictedIds: r.candidates.map((c) => c.id),
        topConfidence: r.candidates[0]?.confidence,
        chosenId: id,
      })
      .catch(() => {});
    haptic('medium');
    setResult(null);
    setBusy(false);
    try {
      const full = await api.listing(id);
      setChosen(full as unknown as Listing);
      setStage('pickVenue');
    } catch {
      reset();
    }
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    lastFile.current = file;
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    uploadedUrl.current = undefined;
    api.upload(file).then((u) => (uploadedUrl.current = u)).catch(() => {});
    await runRecognition(file);
  };

  const retryAnalysis = () => {
    if (!lastFile.current || busy) return;
    void runRecognition(lastFile.current);
  };

  const retakePhoto = () => {
    if (busy) return;
    setResult(null);
    setSrcMenu(true);
  };

  // manual search pick = a CORRECTION: negative signal for the shown top-5,
  // positive for the chosen item вЂ” the strongest training example we get
  const pickFromSearch = (l: Listing) => {
    const r: RecognizeResult =
      result ?? { caption: '', mode: 'auto', candidates: [], autoOpen: false };
    void pickCandidate(l.id, r);
  };

  // "РЎРєР°РЅ" caption under the FAB for the first 2 sessions вЂ” after that the
  // camera icon is assumed learned (obviousness without permanent clutter)
  const [fabLabel] = useState(() => {
    try {
      const n = Number(localStorage.getItem('scanFabSeen') || '0');
      if (n < 2) { localStorage.setItem('scanFabSeen', String(n + 1)); return true; }
    } catch { /* private mode */ }
    return false;
  });

  return (
    <>
      <button className={'scan-fab' + (pulse ? ' pulse' : '')} onClick={() => galleryRef.current?.click()} aria-label="РЎРєР°РЅРёСЂРѕРІР°С‚СЊ Р±Р»СЋРґРѕ РёР»Рё РЅР°РїРёС‚РѕРє">
        <CamIcon />
        {fabLabel && <span className="scan-fab-label">РЎРєР°РЅ</span>}
      </button>
      {/* camera input: straight to the native camera.
          gallery input: `multiple` makes iOS SKIP its source menu and open the photo
          picker directly (we still use only the first file) вЂ” no "Р¤Р°Р№Р»С‹" step. */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onPick} />
      <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={onPick} />

      {srcMenu && (
        <div className="modal-backdrop" style={{ zIndex: 3590 }} onClick={() => setSrcMenu(false)}>
          <div className="scan-src" onClick={(e) => e.stopPropagation()}>
            <button className="scan-src-btn" onClick={() => { setSrcMenu(false); cameraRef.current?.click(); }}>
              рџ“· РЎРґРµР»Р°С‚СЊ С„РѕС‚Рѕ
            </button>
            <button className="scan-src-btn" onClick={() => { setSrcMenu(false); galleryRef.current?.click(); }}>
              рџ–ј РР· РіР°Р»РµСЂРµРё
            </button>
            <button className="scan-src-btn cancel" onClick={() => setSrcMenu(false)}>
              РћС‚РјРµРЅР°
            </button>
          </div>
        </div>
      )}

      {(busy || result) && (
        <ScanDialog
          busy={busy}
          result={result}
          preview={preview}
          onClose={reset}
          onRetake={retakePhoto}
          onRetryAnalysis={retryAnalysis}
          onPickCandidate={pickCandidate}
          onPickSearch={pickFromSearch}
        />
      )}

      {stage === 'pickVenue' && chosen && (
        <VenuePicker
          itemId={chosen.id}
          onPick={(v) => {
            setVenue({ id: v.id, name: v.name });
            setStage('rate');
          }}
          onAdded={(name) => {
            setVenue({ name, pending: true });
            setStage('rate');
          }}
          onClose={() => setStage('rate')}
        />
      )}

      {stage === 'rate' && chosen && (
        <ReviewForm
          listing={chosen}
          venue={venue}
          initialPhotoUrls={uploadedUrl.current ? [uploadedUrl.current] : []}
          onClose={reset}
          onSaved={() => {
            haptic('medium');
            reset();
          }}
        />
      )}
    </>
  );
}
frontend/src/components/ScanFab.tsx:3:import { useEscClose } from '../modalEsc';
frontend/src/components/ScanFab.tsx:27:// Search inside the recognition sheet: when the AI didn't guess it, the user finds
frontend/src/components/ScanFab.tsx:87:  useEscClose(onClose);
frontend/src/components/ScanFab.tsx:126:            <button className="scan-retry" onClick={onRetryAnalysis}>
frontend/src/components/ScanFab.tsx:127:              Попробовать еще раз
frontend/src/components/ScanFab.tsx:129:            <button className="scan-retry scan-retake" onClick={onRetake}>
frontend/src/components/ScanFab.tsx:142:            <button className="scan-retry" onClick={onRetryAnalysis}>
frontend/src/components/ScanFab.tsx:143:              Попробовать еще раз
frontend/src/components/ScanFab.tsx:145:            <button className="scan-retry scan-retake" onClick={onRetake}>
frontend/src/components/ScanFab.tsx:156:  const cameraRef = useRef<HTMLInputElement>(null);
frontend/src/components/ScanFab.tsx:196:      const r = await api.recognize(file, 'auto');
frontend/src/components/ScanFab.tsx:207:        diagnostic: e instanceof Error ? e.message : 'recognize failed',
frontend/src/components/ScanFab.tsx:250:  const retryAnalysis = () => {
frontend/src/components/ScanFab.tsx:270:  // camera icon is assumed learned (obviousness without permanent clutter)
frontend/src/components/ScanFab.tsx:285:      {/* camera input: straight to the native camera.
frontend/src/components/ScanFab.tsx:288:      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onPick} />
frontend/src/components/ScanFab.tsx:294:            <button className="scan-src-btn" onClick={() => { setSrcMenu(false); cameraRef.current?.click(); }}>
frontend/src/components/ScanFab.tsx:314:          onRetryAnalysis={retryAnalysis}
frontend/src\screens\Favorites.tsx:25:    // cold launch / tunnel warm-up can miss the first fetch → retry, and refetch
frontend/src\screens\MyRatings.tsx:60:  // keep a live ref so the retry loop knows when the data has actually arrived:
frontend/src\screens\MyRatings.tsx:68:    // Mobile through the tunnel is slow/flaky — keep retrying (with backoff) until the
frontend/src\screens\Home.tsx:895:      {/* frosted "up" button above the camera fab: auto-appears in the feed,
frontend/src\components\Filters.tsx:2:import { useEscClose } from '../modalEsc';
frontend/src\components\Filters.tsx:184:  useEscClose(onClose);
frontend/src\components\FeedPost.tsx:15:// cache-busted retry. Only after all three fail does the area collapse.
frontend/src\components\CommentsModal.tsx:3:import { useEscClose } from '../modalEsc';
frontend/src\components\CommentsModal.tsx:148:  useEscClose(reqClose);
frontend/src\components\ListingDetail.tsx:16:import { useEscClose } from '../modalEsc';
frontend/src\components\ListingDetail.tsx:304:  useEscClose(requestClose);
frontend/src\components\MapBrowse.tsx:9:import { useEscClose } from '../modalEsc';
frontend/src\components\MapBrowse.tsx:58:  useEscClose(close);
frontend/src\components\People.tsx:3:import { useEscClose } from '../modalEsc';
frontend/src\components\People.tsx:151:  useEscClose(requestClose);
frontend/src\components\PhotoPostModal.tsx:3:import { useEscClose } from '../modalEsc';
frontend/src\components\PhotoPostModal.tsx:58:  useEscClose(reqClose);
frontend/src\components\ReviewForm.tsx:5:import { useEscClose } from '../modalEsc';
frontend/src\components\ReviewForm.tsx:76:  useEscClose(onClose);
frontend/src\components\ScanFab.tsx:3:import { useEscClose } from '../modalEsc';
frontend/src\components\ScanFab.tsx:27:// Search inside the recognition sheet: when the AI didn't guess it, the user finds
frontend/src\components\ScanFab.tsx:87:  useEscClose(onClose);
frontend/src\components\ScanFab.tsx:126:            <button className="scan-retry" onClick={onRetryAnalysis}>
frontend/src\components\ScanFab.tsx:127:              Попробовать еще раз
frontend/src\components\ScanFab.tsx:129:            <button className="scan-retry scan-retake" onClick={onRetake}>
frontend/src\components\ScanFab.tsx:142:            <button className="scan-retry" onClick={onRetryAnalysis}>
frontend/src\components\ScanFab.tsx:143:              Попробовать еще раз
frontend/src\components\ScanFab.tsx:145:            <button className="scan-retry scan-retake" onClick={onRetake}>
frontend/src\components\ScanFab.tsx:156:  const cameraRef = useRef<HTMLInputElement>(null);
frontend/src\components\ScanFab.tsx:196:      const r = await api.recognize(file, 'auto');
frontend/src\components\ScanFab.tsx:207:        diagnostic: e instanceof Error ? e.message : 'recognize failed',
frontend/src\components\ScanFab.tsx:250:  const retryAnalysis = () => {
frontend/src\components\ScanFab.tsx:270:  // camera icon is assumed learned (obviousness without permanent clutter)
frontend/src\components\ScanFab.tsx:285:      {/* camera input: straight to the native camera.
frontend/src\components\ScanFab.tsx:288:      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onPick} />
frontend/src\components\ScanFab.tsx:294:            <button className="scan-src-btn" onClick={() => { setSrcMenu(false); cameraRef.current?.click(); }}>
frontend/src\components\ScanFab.tsx:314:          onRetryAnalysis={retryAnalysis}
frontend/src\components\VenuePicker.tsx:3:import { useEscClose } from '../modalEsc';
frontend/src\components\VenuePicker.tsx:39:  useEscClose(onClose);
frontend/index.html:10:    <meta http-equiv="Cache-Control" content="no-store, max-age=0" />
frontend/index.html:11:    <meta http-equiv="Pragma" content="no-cache" />
frontend/index.html:71:        // if React hasn't mounted in 12s → the page is wedged (stale cache / failed
frontend/index.html:72:        // asset / blocked script). Auto-recover ONCE with a cache-busting reload;
frontend/vite.config.ts:14:const cacheHeaders = () => ({
frontend/vite.config.ts:15:  name: 'preview-cache-headers',
frontend/vite.config.ts:16:  configurePreviewServer(server: any) {
frontend/vite.config.ts:20:        res.setHeader('Cache-Control', 'no-store, max-age=0');
frontend/vite.config.ts:22:        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
frontend/vite.config.ts:24:        res.setHeader('Cache-Control', 'no-cache, max-age=0');
frontend/vite.config.ts:32:  plugins: [react(), cacheHeaders()],
frontend/vite.config.ts:40:  // production preview — served to real users (hashed assets = cache-proof)
frontend/vite.config.ts:41:  preview: {

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content backend/prisma/purge-retail-items.mjs -TotalCount 100; Get-Content backend/prisma/dedup-items.mjs -TotalCount 100; Get-Content backend/prisma/dedup-coffee-names.mjs -TotalCount 100; rg -n "purge-retail|dedup-items|dedup-coffee|regen-per-venue" backend/prisma/*.mjs backend/package.json package.json' in D:\Приложения\Yelp
2026-07-17T13:57:11.745265Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.8 seconds
Output:
// Removes RETAIL / grocery products that don't belong in a tasting catalog вЂ” raw
// ingredients and packaged goods you buy to cook/brew at home, not order at a venue:
//   вЂў coffee "РІ Р·С‘СЂРЅР°С… / РјРѕР»РѕС‚С‹Р№ / РІ РєР°РїСЃСѓР»Р°С… / РґСЂРёРї-РїР°РєРµС‚ / С‡Р°Р»РґР°"
//   вЂў raw patties / semi-finished meat ("РєРѕС‚Р»РµС‚С‹ РґР»СЏ Р±СѓСЂРіРµСЂРѕРІ", "РїРѕР»СѓС„Р°Р±СЂРёРєР°С‚")
//   вЂў "РґР»СЏ Р·Р°РїРµРєР°РЅРёСЏ / РґР»СЏ Р¶Р°СЂРєРё / Р·Р°РіРѕС‚РѕРІРєР° / РЅР°Р±РѕСЂ РґР»СЏ"
// Cleans up menu links / reviews / favorites / dislikes / interactions, then deletes.
// Re-run after every parse вЂ” this is the standing rule for catalog hygiene.
// Run: node prisma/purge-retail-items.mjs [--dry]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

// precise retail markers (kept tight so real dishes like "Р‘Р»РёРЅ СЃ С„Р°СЂС€РµРј" survive)
const RETAIL = /РІ Р·С‘СЂРЅР°С…|РІ Р·РµСЂРЅР°С…|РєРѕС‚Р»РµС‚С‹ РґР»СЏ Р±СѓСЂРіРµСЂРѕРІ|РґР»СЏ Р±СѓСЂРіРµСЂРѕРІ|РїРѕР»СѓС„Р°Р±СЂРёРєР°С‚|РґСЂРёРї[- ]?РїР°РєРµС‚|РІ РєР°РїСЃСѓР»|РєР°РїСЃСѓР»[Р°С‹]|С‡Р°Р»Рґ|РјРѕР»РѕС‚С‹Р№ РєРѕС„Рµ|РєРѕС„Рµ РјРѕР»РѕС‚С‹Р№|РґР»СЏ Р·Р°РїРµРєР°РЅРёСЏ|РґР»СЏ Р¶Р°СЂРєРё|РґР»СЏ РіСЂРёР»СЏ|Р·Р°РіРѕС‚РѕРІРє|РЅР°Р±РѕСЂ РґР»СЏ|РјСЏСЃРѕ РґР»СЏ|(^|[^Р°-СЏС‘a-z0-9])РєРі([^Р°-СЏС‘a-z0-9]|$)|\d+[.,]?\d*\s*РєРі|Р·Р°РјРѕСЂРѕР¶РµРЅРЅ|РѕС…Р»Р°Р¶РґС‘РЅРЅ|РѕС…Р»Р°Р¶РґРµРЅРЅ|РІРµСЃРѕРІ(РѕР№|Р°СЏ|РѕРµ)|С„Р°СЃРѕРІР°РЅ|РЅР°СЃС‚РѕР»СЊРЅР°СЏ РёРіСЂР°|СЃРјРµС‚Р°РЅР° d+%|РєР°Р±РµСЂРЅРµ С„СЂР°РЅ|РёРіСЂР°/i;

// menu MODIFIERS / add-ons ("РЇР№С†Рѕ РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ", "РЎРѕСѓСЃ РЅР° РІС‹Р±РѕСЂ", "РџСЂРёР±РѕСЂС‹",
// "РЈРїР°РєРѕРІРєР°") вЂ” parsed from delivery menus but not tasteable dishes. Standing
// parsing rule: run this purge after every import.
const MODIFIER = /РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅ|РґРѕРї\.|РґРѕР±Р°РІРєР°|С‚РѕРїРїРёРЅРі|РЅР° РІС‹Р±РѕСЂ|РїСЂРёР±РѕСЂ(С‹|\b)|СѓРїР°РєРѕРІРє|РїР°РєРµС‚\b|РґРѕСЃС‚Р°РІРє|СЃРµСЂРІРёСЃРЅС‹Р№ СЃР±РѕСЂ|РєРѕРЅС‚РµР№РЅРµСЂ|СЃС‚Р°РєР°РЅС‡РёРє РїСѓСЃС‚/i;

const dry = process.argv.includes('--dry');
const items = await p.listing.findMany({
  where: { type: { in: ['DISH', 'DRINK'] } },
  select: { id: true, name: true, category: true },
});
const junk = items.filter((it) => RETAIL.test(it.name) || MODIFIER.test(it.name));
console.log(`${dry ? '[DRY] ' : ''}РќР°Р№РґРµРЅРѕ СЂРѕР·РЅРёС‡РЅРѕРіРѕ РјСѓСЃРѕСЂР°: ${junk.length}`);
for (const j of junk) console.log(`  вњ— ${j.name}  [${j.category ?? 'вЂ”'}]`);
if (dry) { await p.$disconnect(); process.exit(0); }

let removed = 0;
for (const j of junk) {
  await p.menuLink.deleteMany({ where: { itemId: j.id } }).catch(() => {});
  await p.review.deleteMany({ where: { listingId: j.id } }).catch(() => {});
  await p.favorite.deleteMany({ where: { listingId: j.id } }).catch(() => {});
  await p.dislike.deleteMany({ where: { itemId: j.id } }).catch(() => {});
  await p.interaction.deleteMany({ where: { listingId: j.id } }).catch(() => {});
  await p.listing.delete({ where: { id: j.id } }).catch(() => {});
  removed++;
}
console.log(`\nРЈРґР°Р»РµРЅРѕ: ${removed}`);
await p.$disconnect();
// Collapses duplicate dish/drink items that are the same thing with extra/reordered
// words or size variants вЂ” e.g. "Р›Р°С‚С‚Рµ 300РјР»", "Р›Р°С‚С‚Рµ 400РјР»", "РњР°С‚С‡Р° Р»Р°С‚С‚Рµ",
// "Р›Р°С‚С‚Рµ РњР°С‚С‡Р°" в†’ one item. Re-points menu links / reviews / favorites to the
// keeper, then deletes the duplicates.   Run: node prisma/dedup-items.mjs [--dry]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

const SIZE = /\b\d+([.,]\d+)?\s*(РјР»|ml|Р»|l|РіСЂ|Рі|g|РєРі|kg|С€С‚|oz)\b|\b\d{2,4}\b|\b0[.,]\d\b/gi;
const SIZEWORD = /\b(Р±РѕР»СЊС€\w*|РјР°Р»РµРЅСЊРє\w*|СЃСЂРµРґРЅ\w*|РіСЂР°РЅРґ\w*|grande|venti|РІРµРЅС‚Рё|tall|РјРёРЅРё|РјР°РєСЃРё|РїРѕСЂС†\w*|РґРІРѕР№РЅ\w*)\b/gi;

// generic dish-TYPE words: "РџР°СЃС‚Р° Р‘РѕР»РѕРЅСЊРµР·Рµ" в‰Ў "Р‘РѕР»РѕРЅСЊРµР·Рµ", "РЎР°Р»Р°С‚ Р¦РµР·Р°СЂСЊ" в‰Ў "Р¦РµР·Р°СЂСЊ".
// Dropped from the canonical key (grouping only) so the same dish under a bare name
// and under a "С‚РёРї + РЅР°Р·РІР°РЅРёРµ" name collapse into one. The distinctive word stays.
const GENERIC = new Set([
  'РїР°СЃС‚Р°', 'РїРёС†С†Р°', 'СЃР°Р»Р°С‚', 'СЃСѓРї', 'Р±РѕСѓР»', 'РїРѕРєРµ', 'СЂРѕР»Р»', 'СЂРѕР»Р»С‹', 'СЃРµС‚', 'СЃСЌРЅРґРІРёС‡',
  'СЃРµРЅРґРІРёС‡', 'Р±СѓСЂРіРµСЂ', 'РґРµСЃРµСЂС‚', 'РєР°С€Р°', 'СЃРјСѓР·Рё', 'Р»РёРјРѕРЅР°Рґ', 'РїРёСЂРѕРі', 'РїРёСЂРѕР¶РѕРє',
  'РЅР°РїРёС‚РѕРє', 'Р±Р»СЋРґРѕ', 'РіРѕСЂСЏС‡РµРµ', 'Р·Р°РєСѓСЃРєР°',
]);

// canonical key: lowercase, strip sizes, drop generic type-words, sort (order-independent)
function canon(name) {
  const n = name
    .toLowerCase()
    .replace(SIZE, ' ')
    .replace(SIZEWORD, ' ')
    .replace(/С‘/g, 'Рµ')
    .replace(/[^Р°-СЏa-z0-9 ]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // keep multi-letter words and any number token (so "РњРѕР»РѕРєРѕ 8%" в‰  "РњРѕР»РѕРєРѕ 3,6%"),
  // drop lone single letters (noise)
  const words = n.split(' ').filter((w) => w.length > 1 || /\d/.test(w));
  // drop generic type-words вЂ” but only if a distinctive word remains ("РџР°СЃС‚Р°" alone stays)
  const distinctive = words.filter((w) => !GENERIC.has(w));
  return (distinctive.length ? distinctive : words).sort().join(' ');
}
// display name with size noise stripped (keeps word order)
function cleanName(name) {
  return name.replace(SIZE, ' ').replace(SIZEWORD, ' ').replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim() || name;
}

const dry = process.argv.includes('--dry');
const items = await p.listing.findMany({
  where: { type: { in: ['DISH', 'DRINK'] } },
  select: { id: true, type: true, name: true, category: true, reviewCount: true, photoUrl: true },
});
const groups = new Map();
for (const it of items) {
  const c = canon(it.name);
  if (!c) continue;
  // GUARD: the category is part of the key, so a bare name only merges with a
  // "С‚РёРї + РЅР°Р·РІР°РЅРёРµ" variant of the SAME category. This is what keeps В«РџР°СЃС‚Р°
  // Р‘РѕР»РѕРЅСЊРµР·РµВ»в‰ЎВ«Р‘РѕР»РѕРЅСЊРµР·РµВ» (both РС‚Р°Р»СЊСЏРЅСЃРєР°СЏ) while В«РџРёС†С†Р° РўРѕРј СЏРјВ» (РџРёС†С†Р°) /
  // В«РџР°СЃС‚Р° РўРѕРј СЏРјВ» (РџР°СЃС‚Р°) / В«РўРѕРј СЏРјВ» (РўР°Р№СЃРєР°СЏ) stay three distinct dishes.
  const key = it.type + '|' + (it.category ?? '') + '|' + c;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(it);
}

let merged = 0, removed = 0;
for (const [, arr] of groups) {
  if (arr.length < 2) continue;
  arr.sort((a, b) => b.reviewCount - a.reviewCount || (b.photoUrl ? 1 : 0) - (a.photoUrl ? 1 : 0) || a.name.length - b.name.length);
  const keeper = arr[0];
  const dups = arr.slice(1);
  if (dry) {
    console.log(`KEEP В«${cleanName(keeper.name)}В»  в‡ђ  ${dups.map((d) => `В«${d.name}В»`).join(', ')}`);
    merged++; removed += dups.length;
    continue;
  }
  for (const d of dups) {
    const links = await p.menuLink.findMany({ where: { itemId: d.id } });
    for (const l of links) {
      await p.menuLink.upsert({
        where: { venueId_itemId: { venueId: l.venueId, itemId: keeper.id } },
        create: { venueId: l.venueId, itemId: keeper.id, status: l.status, price: l.price, addedByUserId: l.addedByUserId },
        update: { price: l.price ?? undefined },
      }).catch(() => {});
    }
    const revs = await p.review.findMany({ where: { listingId: d.id }, select: { id: true, userId: true } });
    for (const r of revs) {
      const clash = await p.review.findUnique({ where: { listingId_userId: { listingId: keeper.id, userId: r.userId } } }).catch(() => null);
      if (clash) await p.review.delete({ where: { id: r.id } }).catch(() => {});
      else await p.review.update({ where: { id: r.id }, data: { listingId: keeper.id } }).catch(() => {});
    }
    await p.favorite.updateMany({ where: { listingId: d.id }, data: { listingId: keeper.id } }).catch(() => {});
    await p.dislike.updateMany({ where: { itemId: d.id }, data: { itemId: keeper.id } }).catch(() => {});
    await p.listing.delete({ where: { id: d.id } }).catch(() => {});
    removed++;
  }
  const rc = await p.review.count({ where: { listingId: keeper.id, status: 'APPROVED' } });
  await p.listing.update({ where: { id: keeper.id }, data: { name: cleanName(keeper.name), reviewCount: rc } }).catch(() => {});
  merged++;
// "Р Р°С„ РєРѕС„Рµ" == "Р Р°С„": strips a REDUNDANT trailing "РєРѕС„Рµ" from drink names
// ("Р Р°С„ РєРѕС„Рµ"в†’"Р Р°С„", "Р›Р°С‚С‚Рµ РєРѕС„Рµ"в†’"Р›Р°С‚С‚Рµ", "Р¤Р»СЌС‚ СѓР°Р№С‚ РєРѕС„Рµ"в†’"Р¤Р»СЌС‚ СѓР°Р№С‚") and merges
// the resulting duplicates into one item (re-points menu links / reviews / favorites /
// dislikes / interactions to the keeper, then deletes the dupes).
//
// Only the TRAILING word is stripped вЂ” a leading "РљРѕС„Рµ вЂ¦" ("РљРѕС„Рµ РїРѕ-РІРµРЅСЃРєРё", "РљРѕС„Рµ
// Р“Р»СЏСЃСЃРµ", or the plain "РљРѕС„Рµ") is a real name and is left untouched.
//
// Safe to re-run after every future parse (idempotent). Run: node prisma/dedup-coffee-names.mjs [--dry]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

// strip a redundant trailing "РєРѕС„Рµ" (repeatedly, e.g. "Р Р°С„ РєРѕС„Рµ РєРѕС„Рµ"); never empty,
// never touches a leading "РљРѕС„Рµ вЂ¦".
function stripKofe(name) {
  let n = (name ?? '').trim();
  let prev;
  do { prev = n; n = n.replace(/[\s,]+РєРѕС„Рµ\s*$/i, '').trim(); } while (n !== prev && n);
  return n || (name ?? '').trim();
}

const dry = process.argv.includes('--dry');
const items = await p.listing.findMany({
  where: { type: 'DRINK' },
  select: { id: true, name: true, reviewCount: true, photoUrl: true },
});

// group by the cleaned (lowercased) name вЂ” only where cleaning actually changes something,
// or where a same-clean-name duplicate already exists.
const groups = new Map();
for (const it of items) {
  const clean = stripKofe(it.name);
  const key = clean.toLowerCase().replace(/С‘/g, 'Рµ');
  if (!groups.has(key)) groups.set(key, { clean, arr: [] });
  groups.get(key).arr.push(it);
}

// SAFETY: only act when the group has в‰Ґ2 items вЂ” i.e. an item WITHOUT the trailing
// "РєРѕС„Рµ" already exists ("Р Р°С„" for "Р Р°С„ РєРѕС„Рµ"). That's the only reliable signal that
// "РєРѕС„Рµ" is redundant. A lone "РђР№СЂРёС€ РєРѕС„Рµ" / "РњР°Р»РёРЅРѕРІС‹Р№ РєРѕС„Рµ" (no plain twin) is a real
// name and is left untouched.
let renamed = 0, merged = 0, removed = 0;
for (const [, { clean, arr }] of groups) {
  if (arr.length < 2) continue;

  arr.sort((a, b) => b.reviewCount - a.reviewCount || (b.photoUrl ? 1 : 0) - (a.photoUrl ? 1 : 0) || a.name.length - b.name.length);
  const keeper = arr[0];
  const dups = arr.slice(1);

  if (dry) {
    console.log(`KEEP В«${clean}В»  в‡ђ  ${dups.map((d) => `В«${d.name}В»`).join(', ')}`);
    merged++; removed += dups.length; renamed += keeper.name !== clean ? 1 : 0;
    continue;
  }

  for (const d of dups) {
    const links = await p.menuLink.findMany({ where: { itemId: d.id } });
    for (const l of links) {
      await p.menuLink.upsert({
        where: { venueId_itemId: { venueId: l.venueId, itemId: keeper.id } },
        create: { venueId: l.venueId, itemId: keeper.id, status: l.status, price: l.price, addedByUserId: l.addedByUserId },
        update: { price: l.price ?? undefined },
      }).catch(() => {});
    }
    const revs = await p.review.findMany({ where: { listingId: d.id }, select: { id: true, userId: true } });
    for (const r of revs) {
      const clash = await p.review.findUnique({ where: { listingId_userId: { listingId: keeper.id, userId: r.userId } } }).catch(() => null);
      if (clash) await p.review.delete({ where: { id: r.id } }).catch(() => {});
      else await p.review.update({ where: { id: r.id }, data: { listingId: keeper.id } }).catch(() => {});
    }
    await p.favorite.updateMany({ where: { listingId: d.id }, data: { listingId: keeper.id } }).catch(() => {});
    await p.dislike.updateMany({ where: { itemId: d.id }, data: { itemId: keeper.id } }).catch(() => {});
    await p.interaction.updateMany({ where: { listingId: d.id }, data: { listingId: keeper.id } }).catch(() => {});
    await p.listing.delete({ where: { id: d.id } }).catch(() => {});
    removed++;
  }
  const rc = await p.review.count({ where: { listingId: keeper.id, status: 'APPROVED' } });
  const data = { reviewCount: rc };
  if (keeper.name !== clean) { data.name = clean; renamed++; }
  await p.listing.update({ where: { id: keeper.id }, data }).catch(() => {});
  if (dups.length) merged++;
}
console.log(`\n${dry ? '[DRY] ' : ''}renamed: ${renamed}, groups merged: ${merged}, duplicates removed: ${removed}`);
await p.$disconnect();
rg: backend/prisma/*.mjs: Синтаксическая ошибка в имени файла, имени папки или метке тома. (os error 123)

 exited 1 in 826ms:
// Removes RETAIL / grocery products that don't belong in a tasting catalog вЂ” raw
// ingredients and packaged goods you buy to cook/brew at home, not order at a venue:
//   вЂў coffee "РІ Р·С‘СЂРЅР°С… / РјРѕР»РѕС‚С‹Р№ / РІ РєР°РїСЃСѓР»Р°С… / РґСЂРёРї-РїР°РєРµС‚ / С‡Р°Р»РґР°"
//   вЂў raw patties / semi-finished meat ("РєРѕС‚Р»РµС‚С‹ РґР»СЏ Р±СѓСЂРіРµСЂРѕРІ", "РїРѕР»СѓС„Р°Р±СЂРёРєР°С‚")
//   вЂў "РґР»СЏ Р·Р°РїРµРєР°РЅРёСЏ / РґР»СЏ Р¶Р°СЂРєРё / Р·Р°РіРѕС‚РѕРІРєР° / РЅР°Р±РѕСЂ РґР»СЏ"
// Cleans up menu links / reviews / favorites / dislikes / interactions, then deletes.
// Re-run after every parse вЂ” this is the standing rule for catalog hygiene.
// Run: node prisma/purge-retail-items.mjs [--dry]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

// precise retail markers (kept tight so real dishes like "Р‘Р»РёРЅ СЃ С„Р°СЂС€РµРј" survive)
const RETAIL = /РІ Р·С‘СЂРЅР°С…|РІ Р·РµСЂРЅР°С…|РєРѕС‚Р»РµС‚С‹ РґР»СЏ Р±СѓСЂРіРµСЂРѕРІ|РґР»СЏ Р±СѓСЂРіРµСЂРѕРІ|РїРѕР»СѓС„Р°Р±СЂРёРєР°С‚|РґСЂРёРї[- ]?РїР°РєРµС‚|РІ РєР°РїСЃСѓР»|РєР°РїСЃСѓР»[Р°С‹]|С‡Р°Р»Рґ|РјРѕР»РѕС‚С‹Р№ РєРѕС„Рµ|РєРѕС„Рµ РјРѕР»РѕС‚С‹Р№|РґР»СЏ Р·Р°РїРµРєР°РЅРёСЏ|РґР»СЏ Р¶Р°СЂРєРё|РґР»СЏ РіСЂРёР»СЏ|Р·Р°РіРѕС‚РѕРІРє|РЅР°Р±РѕСЂ РґР»СЏ|РјСЏСЃРѕ РґР»СЏ|(^|[^Р°-СЏС‘a-z0-9])РєРі([^Р°-СЏС‘a-z0-9]|$)|\d+[.,]?\d*\s*РєРі|Р·Р°РјРѕСЂРѕР¶РµРЅРЅ|РѕС…Р»Р°Р¶РґС‘РЅРЅ|РѕС…Р»Р°Р¶РґРµРЅРЅ|РІРµСЃРѕРІ(РѕР№|Р°СЏ|РѕРµ)|С„Р°СЃРѕРІР°РЅ|РЅР°СЃС‚РѕР»СЊРЅР°СЏ РёРіСЂР°|СЃРјРµС‚Р°РЅР° d+%|РєР°Р±РµСЂРЅРµ С„СЂР°РЅ|РёРіСЂР°/i;

// menu MODIFIERS / add-ons ("РЇР№С†Рѕ РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ", "РЎРѕСѓСЃ РЅР° РІС‹Р±РѕСЂ", "РџСЂРёР±РѕСЂС‹",
// "РЈРїР°РєРѕРІРєР°") вЂ” parsed from delivery menus but not tasteable dishes. Standing
// parsing rule: run this purge after every import.
const MODIFIER = /РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅ|РґРѕРї\.|РґРѕР±Р°РІРєР°|С‚РѕРїРїРёРЅРі|РЅР° РІС‹Р±РѕСЂ|РїСЂРёР±РѕСЂ(С‹|\b)|СѓРїР°РєРѕРІРє|РїР°РєРµС‚\b|РґРѕСЃС‚Р°РІРє|СЃРµСЂРІРёСЃРЅС‹Р№ СЃР±РѕСЂ|РєРѕРЅС‚РµР№РЅРµСЂ|СЃС‚Р°РєР°РЅС‡РёРє РїСѓСЃС‚/i;

const dry = process.argv.includes('--dry');
const items = await p.listing.findMany({
  where: { type: { in: ['DISH', 'DRINK'] } },
  select: { id: true, name: true, category: true },
});
const junk = items.filter((it) => RETAIL.test(it.name) || MODIFIER.test(it.name));
console.log(`${dry ? '[DRY] ' : ''}РќР°Р№РґРµРЅРѕ СЂРѕР·РЅРёС‡РЅРѕРіРѕ РјСѓСЃРѕСЂР°: ${junk.length}`);
for (const j of junk) console.log(`  вњ— ${j.name}  [${j.category ?? 'вЂ”'}]`);
if (dry) { await p.$disconnect(); process.exit(0); }

let removed = 0;
for (const j of junk) {
  await p.menuLink.deleteMany({ where: { itemId: j.id } }).catch(() => {});
  await p.review.deleteMany({ where: { listingId: j.id } }).catch(() => {});
  await p.favorite.deleteMany({ where: { listingId: j.id } }).catch(() => {});
  await p.dislike.deleteMany({ where: { itemId: j.id } }).catch(() => {});
  await p.interaction.deleteMany({ where: { listingId: j.id } }).catch(() => {});
  await p.listing.delete({ where: { id: j.id } }).catch(() => {});
  removed++;
}
console.log(`\nРЈРґР°Р»РµРЅРѕ: ${removed}`);
await p.$disconnect();
// Collapses duplicate dish/drink items that are the same thing with extra/reordered
// words or size variants вЂ” e.g. "Р›Р°С‚С‚Рµ 300РјР»", "Р›Р°С‚С‚Рµ 400РјР»", "РњР°С‚С‡Р° Р»Р°С‚С‚Рµ",
// "Р›Р°С‚С‚Рµ РњР°С‚С‡Р°" в†’ one item. Re-points menu links / reviews / favorites to the
// keeper, then deletes the duplicates.   Run: node prisma/dedup-items.mjs [--dry]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

const SIZE = /\b\d+([.,]\d+)?\s*(РјР»|ml|Р»|l|РіСЂ|Рі|g|РєРі|kg|С€С‚|oz)\b|\b\d{2,4}\b|\b0[.,]\d\b/gi;
const SIZEWORD = /\b(Р±РѕР»СЊС€\w*|РјР°Р»РµРЅСЊРє\w*|СЃСЂРµРґРЅ\w*|РіСЂР°РЅРґ\w*|grande|venti|РІРµРЅС‚Рё|tall|РјРёРЅРё|РјР°РєСЃРё|РїРѕСЂС†\w*|РґРІРѕР№РЅ\w*)\b/gi;

// generic dish-TYPE words: "РџР°СЃС‚Р° Р‘РѕР»РѕРЅСЊРµР·Рµ" в‰Ў "Р‘РѕР»РѕРЅСЊРµР·Рµ", "РЎР°Р»Р°С‚ Р¦РµР·Р°СЂСЊ" в‰Ў "Р¦РµР·Р°СЂСЊ".
// Dropped from the canonical key (grouping only) so the same dish under a bare name
// and under a "С‚РёРї + РЅР°Р·РІР°РЅРёРµ" name collapse into one. The distinctive word stays.
const GENERIC = new Set([
  'РїР°СЃС‚Р°', 'РїРёС†С†Р°', 'СЃР°Р»Р°С‚', 'СЃСѓРї', 'Р±РѕСѓР»', 'РїРѕРєРµ', 'СЂРѕР»Р»', 'СЂРѕР»Р»С‹', 'СЃРµС‚', 'СЃСЌРЅРґРІРёС‡',
  'СЃРµРЅРґРІРёС‡', 'Р±СѓСЂРіРµСЂ', 'РґРµСЃРµСЂС‚', 'РєР°С€Р°', 'СЃРјСѓР·Рё', 'Р»РёРјРѕРЅР°Рґ', 'РїРёСЂРѕРі', 'РїРёСЂРѕР¶РѕРє',
  'РЅР°РїРёС‚РѕРє', 'Р±Р»СЋРґРѕ', 'РіРѕСЂСЏС‡РµРµ', 'Р·Р°РєСѓСЃРєР°',
]);

// canonical key: lowercase, strip sizes, drop generic type-words, sort (order-independent)
function canon(name) {
  const n = name
    .toLowerCase()
    .replace(SIZE, ' ')
    .replace(SIZEWORD, ' ')
    .replace(/С‘/g, 'Рµ')
    .replace(/[^Р°-СЏa-z0-9 ]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // keep multi-letter words and any number token (so "РњРѕР»РѕРєРѕ 8%" в‰  "РњРѕР»РѕРєРѕ 3,6%"),
  // drop lone single letters (noise)
  const words = n.split(' ').filter((w) => w.length > 1 || /\d/.test(w));
  // drop generic type-words вЂ” but only if a distinctive word remains ("РџР°СЃС‚Р°" alone stays)
  const distinctive = words.filter((w) => !GENERIC.has(w));
  return (distinctive.length ? distinctive : words).sort().join(' ');
}
// display name with size noise stripped (keeps word order)
function cleanName(name) {
  return name.replace(SIZE, ' ').replace(SIZEWORD, ' ').replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim() || name;
}

const dry = process.argv.includes('--dry');
const items = await p.listing.findMany({
  where: { type: { in: ['DISH', 'DRINK'] } },
  select: { id: true, type: true, name: true, category: true, reviewCount: true, photoUrl: true },
});
const groups = new Map();
for (const it of items) {
  const c = canon(it.name);
  if (!c) continue;
  // GUARD: the category is part of the key, so a bare name only merges with a
  // "С‚РёРї + РЅР°Р·РІР°РЅРёРµ" variant of the SAME category. This is what keeps В«РџР°СЃС‚Р°
  // Р‘РѕР»РѕРЅСЊРµР·РµВ»в‰ЎВ«Р‘РѕР»РѕРЅСЊРµР·РµВ» (both РС‚Р°Р»СЊСЏРЅСЃРєР°СЏ) while В«РџРёС†С†Р° РўРѕРј СЏРјВ» (РџРёС†С†Р°) /
  // В«РџР°СЃС‚Р° РўРѕРј СЏРјВ» (РџР°СЃС‚Р°) / В«РўРѕРј СЏРјВ» (РўР°Р№СЃРєР°СЏ) stay three distinct dishes.
  const key = it.type + '|' + (it.category ?? '') + '|' + c;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(it);
}

let merged = 0, removed = 0;
for (const [, arr] of groups) {
  if (arr.length < 2) continue;
  arr.sort((a, b) => b.reviewCount - a.reviewCount || (b.photoUrl ? 1 : 0) - (a.photoUrl ? 1 : 0) || a.name.length - b.name.length);
  const keeper = arr[0];
  const dups = arr.slice(1);
  if (dry) {
    console.log(`KEEP В«${cleanName(keeper.name)}В»  в‡ђ  ${dups.map((d) => `В«${d.name}В»`).join(', ')}`);
    merged++; removed += dups.length;
    continue;
  }
  for (const d of dups) {
    const links = await p.menuLink.findMany({ where: { itemId: d.id } });
    for (const l of links) {
      await p.menuLink.upsert({
        where: { venueId_itemId: { venueId: l.venueId, itemId: keeper.id } },
        create: { venueId: l.venueId, itemId: keeper.id, status: l.status, price: l.price, addedByUserId: l.addedByUserId },
        update: { price: l.price ?? undefined },
      }).catch(() => {});
    }
    const revs = await p.review.findMany({ where: { listingId: d.id }, select: { id: true, userId: true } });
    for (const r of revs) {
      const clash = await p.review.findUnique({ where: { listingId_userId: { listingId: keeper.id, userId: r.userId } } }).catch(() => null);
      if (clash) await p.review.delete({ where: { id: r.id } }).catch(() => {});
      else await p.review.update({ where: { id: r.id }, data: { listingId: keeper.id } }).catch(() => {});
    }
    await p.favorite.updateMany({ where: { listingId: d.id }, data: { listingId: keeper.id } }).catch(() => {});
    await p.dislike.updateMany({ where: { itemId: d.id }, data: { itemId: keeper.id } }).catch(() => {});
    await p.listing.delete({ where: { id: d.id } }).catch(() => {});
    removed++;
  }
  const rc = await p.review.count({ where: { listingId: keeper.id, status: 'APPROVED' } });
  await p.listing.update({ where: { id: keeper.id }, data: { name: cleanName(keeper.name), reviewCount: rc } }).catch(() => {});
  merged++;
// "Р Р°С„ РєРѕС„Рµ" == "Р Р°С„": strips a REDUNDANT trailing "РєРѕС„Рµ" from drink names
// ("Р Р°С„ РєРѕС„Рµ"в†’"Р Р°С„", "Р›Р°С‚С‚Рµ РєРѕС„Рµ"в†’"Р›Р°С‚С‚Рµ", "Р¤Р»СЌС‚ СѓР°Р№С‚ РєРѕС„Рµ"в†’"Р¤Р»СЌС‚ СѓР°Р№С‚") and merges
// the resulting duplicates into one item (re-points menu links / reviews / favorites /
// dislikes / interactions to the keeper, then deletes the dupes).
//
// Only the TRAILING word is stripped вЂ” a leading "РљРѕС„Рµ вЂ¦" ("РљРѕС„Рµ РїРѕ-РІРµРЅСЃРєРё", "РљРѕС„Рµ
// Р“Р»СЏСЃСЃРµ", or the plain "РљРѕС„Рµ") is a real name and is left untouched.
//
// Safe to re-run after every future parse (idempotent). Run: node prisma/dedup-coffee-names.mjs [--dry]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

// strip a redundant trailing "РєРѕС„Рµ" (repeatedly, e.g. "Р Р°С„ РєРѕС„Рµ РєРѕС„Рµ"); never empty,
// never touches a leading "РљРѕС„Рµ вЂ¦".
function stripKofe(name) {
  let n = (name ?? '').trim();
  let prev;
  do { prev = n; n = n.replace(/[\s,]+РєРѕС„Рµ\s*$/i, '').trim(); } while (n !== prev && n);
  return n || (name ?? '').trim();
}

const dry = process.argv.includes('--dry');
const items = await p.listing.findMany({
  where: { type: 'DRINK' },
  select: { id: true, name: true, reviewCount: true, photoUrl: true },
});

// group by the cleaned (lowercased) name вЂ” only where cleaning actually changes something,
// or where a same-clean-name duplicate already exists.
const groups = new Map();
for (const it of items) {
  const clean = stripKofe(it.name);
  const key = clean.toLowerCase().replace(/С‘/g, 'Рµ');
  if (!groups.has(key)) groups.set(key, { clean, arr: [] });
  groups.get(key).arr.push(it);
}

// SAFETY: only act when the group has в‰Ґ2 items вЂ” i.e. an item WITHOUT the trailing
// "РєРѕС„Рµ" already exists ("Р Р°С„" for "Р Р°С„ РєРѕС„Рµ"). That's the only reliable signal that
// "РєРѕС„Рµ" is redundant. A lone "РђР№СЂРёС€ РєРѕС„Рµ" / "РњР°Р»РёРЅРѕРІС‹Р№ РєРѕС„Рµ" (no plain twin) is a real
// name and is left untouched.
let renamed = 0, merged = 0, removed = 0;
for (const [, { clean, arr }] of groups) {
  if (arr.length < 2) continue;

  arr.sort((a, b) => b.reviewCount - a.reviewCount || (b.photoUrl ? 1 : 0) - (a.photoUrl ? 1 : 0) || a.name.length - b.name.length);
  const keeper = arr[0];
  const dups = arr.slice(1);

  if (dry) {
    console.log(`KEEP В«${clean}В»  в‡ђ  ${dups.map((d) => `В«${d.name}В»`).join(', ')}`);
    merged++; removed += dups.length; renamed += keeper.name !== clean ? 1 : 0;
    continue;
  }

  for (const d of dups) {
    const links = await p.menuLink.findMany({ where: { itemId: d.id } });
    for (const l of links) {
      await p.menuLink.upsert({
        where: { venueId_itemId: { venueId: l.venueId, itemId: keeper.id } },
        create: { venueId: l.venueId, itemId: keeper.id, status: l.status, price: l.price, addedByUserId: l.addedByUserId },
        update: { price: l.price ?? undefined },
      }).catch(() => {});
    }
    const revs = await p.review.findMany({ where: { listingId: d.id }, select: { id: true, userId: true } });
    for (const r of revs) {
      const clash = await p.review.findUnique({ where: { listingId_userId: { listingId: keeper.id, userId: r.userId } } }).catch(() => null);
      if (clash) await p.review.delete({ where: { id: r.id } }).catch(() => {});
      else await p.review.update({ where: { id: r.id }, data: { listingId: keeper.id } }).catch(() => {});
    }
    await p.favorite.updateMany({ where: { listingId: d.id }, data: { listingId: keeper.id } }).catch(() => {});
    await p.dislike.updateMany({ where: { itemId: d.id }, data: { itemId: keeper.id } }).catch(() => {});
    await p.interaction.updateMany({ where: { listingId: d.id }, data: { listingId: keeper.id } }).catch(() => {});
    await p.listing.delete({ where: { id: d.id } }).catch(() => {});
    removed++;
  }
  const rc = await p.review.count({ where: { listingId: keeper.id, status: 'APPROVED' } });
  const data = { reviewCount: rc };
  if (keeper.name !== clean) { data.name = clean; renamed++; }
  await p.listing.update({ where: { id: keeper.id }, data }).catch(() => {});
  if (dups.length) merged++;
}
console.log(`\n${dry ? '[DRY] ' : ''}renamed: ${renamed}, groups merged: ${merged}, duplicates removed: ${removed}`);
await p.$disconnect();
rg: backend/prisma/*.mjs: Синтаксическая ошибка в имени файла, имени папки или метке тома. (os error 123)

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg -n \"reviewCount: rc|_avg|avgRating|review\\.update|review\\.delete\" backend/prisma/dedup-items.mjs backend/prisma/dedup-coffee-names.mjs; rg -n \"purge-retail|dedup-items|dedup-coffee|== ФОТО|regen-per-venue\" backend/prisma/menu-pipeline.mjs" in D:\Приложения\Yelp
 succeeded in 302ms:
backend/prisma/dedup-items.mjs:90:      if (clash) await p.review.delete({ where: { id: r.id } }).catch(() => {});
backend/prisma/dedup-items.mjs:91:      else await p.review.update({ where: { id: r.id }, data: { listingId: keeper.id } }).catch(() => {});
backend/prisma/dedup-items.mjs:99:  await p.listing.update({ where: { id: keeper.id }, data: { name: cleanName(keeper.name), reviewCount: rc } }).catch(() => {});
backend/prisma/dedup-coffee-names.mjs:75:      if (clash) await p.review.delete({ where: { id: r.id } }).catch(() => {});
backend/prisma/dedup-coffee-names.mjs:76:      else await p.review.update({ where: { id: r.id }, data: { listingId: keeper.id } }).catch(() => {});
backend/prisma/dedup-coffee-names.mjs:85:  const data = { reviewCount: rc };
45:  console.log('== ФОТО: dl → gen(0.2) → check');
46:  run(['prisma/regen-per-venue.mjs', '--stage-dl']);
47:  run(['prisma/regen-per-venue.mjs', '--stage-gen']);
48:  run(['prisma/regen-per-venue.mjs', '--stage-check']);

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg -n -i '\"name\"\\s*:\\s*\"(Шардоне|Каберне|Мерло|Совиньон|Рислинг|Пино|Мальбек)(\\s|\"|,)' backend/prisma/menu-out; rg -n \"const WINE_RE|шардоне|каберне|мерло|совиньон|рислинг|мальбек\" backend/prisma/menu-import.mjs" in D:\Приложения\Yelp
 succeeded in 319ms:
27:const WINE_RE = new RegExp(['вино', 'шардоне', 'каберне', 'мерло', 'совиньон', 'просекко', 'игрист', 'рислинг', B('пино'), 'санджовезе', 'мальбек', 'ламбруско', 'портвейн', 'шампанск', 'просек', 'sauvignon', 'savignon', 'chardonnay', 'merlot', 'cabernet', 'riesling', B('blanc'), B('rose')].join('|'), 'i');

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg -n \"if \\("'!m'"\\)|catch \\{|dto\\.photoUrls\\[0\\]|\\.\\.\\.dto\\.photoUrls|promoteToCard|photoUrls: dto\\.photoUrls\" backend/src/reviews/reviews.service.ts | Select-Object -First 80; rg -n \"multiple|photoUrls|upload\" frontend/src/components/ReviewForm.tsx | Select-Object -First 100" in D:\Приложения\Yelp
 succeeded in 734ms:
95:      if (!m) return { block: false, promote: true }; // moderation down → don't punish users
113:    } catch {
233:    let promoteToCard = false;
236:      const check = await this.checkReviewPhoto(dto.photoUrls[0], item?.name, item?.category);
242:        promoteToCard = check.promote;
253:        photoUrls: dto.photoUrls ?? [],
261:        photoUrls: dto.photoUrls ?? [],
269:    if (dto.photoUrls?.length && promoteToCard) {
274:      const photos = [...new Set([...(l?.photos ?? []), ...dto.photoUrls])];
280:          data: { photos, ...(faceIsUgc ? {} : { photoUrl: dto.photoUrls[0] }) },
49:  const [photoUrls, setPhotoUrls] = useState<string[]>(existing?.photoUrls ?? initialPhotoUrls ?? []);
92:      const urls = await Promise.all(Array.from(files).map((f) => api.upload(f)));
126:      const saved = await api.createReview(listing.id, { rating, text, attributes, photoUrls, videoUrls });
129:      onSaved({ photo: photoUrls[0], photos: photoUrls, video: videoUrls[0], text: text.trim() || undefined, slides: Object.fromEntries(slides.current), review: saved });
175:              <input type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
178:          {/* video upload removed (owner rule 13.07.2026) — photos only */}
179:          {(photoUrls.length > 0 || videoUrls.length > 0) && (
181:              {photoUrls.map((u) => (

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content backend/package.json; Get-Content frontend/vite.config.ts; Get-Content frontend/src/components/CategoryCelebration.tsx; Get-Content frontend/src/categoryGate.ts -TotalCount 40' in D:\Приложения\Yelp
 succeeded in 835ms:
{
  "name": "togomoscow-backend",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:prod": "node dist/main.js",
    "start:dev": "nest start --watch",
    "railway:build": "prisma generate && npm run build",
    "railway:start": "node scripts/ensure-database-url.mjs && prisma migrate deploy && npm run start:prod",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.1072.0",
    "@nestjs/common": "^11.0.0",
    "@nestjs/config": "^4.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@prisma/client": "^6.2.0",
    "@types/multer": "^2.1.0",
    "@xenova/transformers": "^2.17.2",
    "opening_hours": "^3.13.0",
    "pdf-parse": "^2.4.5",
    "playwright": "^1.61.1",
    "prisma": "^6.2.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "sharp": "^0.35.2",
    "tesseract.js": "^5.1.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@types/express": "^5.0.0",
    "@types/node": "^22.10.0",
    "typescript": "^5.7.0"
  }
}
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, the frontend and backend are served under one origin (the tunnel URL)
// so Telegram only needs a single HTTPS address. Calls to /api are proxied to
// the local NestJS server.
const proxy = {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
};

const cacheHeaders = () => ({
  name: 'preview-cache-headers',
  configurePreviewServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      const url = req.url || '';
      if (url === '/' || url.startsWith('/?') || url.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store, max-age=0');
      } else if (url.startsWith('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (url === '/telegram-web-app.js') {
        res.setHeader('Cache-Control', 'no-cache, max-age=0');
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), cacheHeaders()],
  // dev server (HMR)
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy,
  },
  // production preview вЂ” served to real users (hashed assets = cache-proof)
  preview: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy,
  },
});
import { useEffect, useState } from 'react';
import { onCategoryUnlock } from '../categoryGate';
import { haptic } from '../telegram';

// Center-screen congratulation when a category reaches the review threshold and
// its rankings + specialization unlock. Mounted once at the app root.
export function CategoryCelebration() {
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => onCategoryUnlock((cat) => {
    haptic('heavy');
    setCategory(cat);
  }), []);

  if (!category) return null;

  return (
    <div className="celebrate-backdrop" onClick={() => setCategory(null)}>
      <div className="celebrate-card" onClick={(e) => e.stopPropagation()}>
        <div className="celebrate-emoji">рџЋ‰</div>
        <h2 className="celebrate-h">РљР°С‚РµРіРѕСЂРёСЏ РѕС‚РєСЂС‹С‚Р°!</h2>
        <p className="celebrate-sub">
          Р’С‹ РѕСЃС‚Р°РІРёР»Рё 5 РѕС‚Р·С‹РІРѕРІ РІ РєР°С‚РµРіРѕСЂРёРё В«<b>{category}</b>В». РўРµРїРµСЂСЊ РѕС‚РєСЂС‹С‚С‹ РµС‘
          СЂРµР№С‚РёРЅРіРё Рё СЃРїРµС†РёР°Р»РёР·Р°С†РёСЏ вЂ” Рё СЂРµРєРѕРјРµРЅРґР°С†РёРё СЃС‚Р°Р»Рё С‚РѕС‡РЅРµРµ.
        </p>
        <button className="btn" onClick={() => setCategory(null)}>
          РћС‚Р»РёС‡РЅРѕ!
        </button>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { api } from './api';

// Per-category review progress, shared across the app via a tiny module cache so
// the gate ("СЂРµР№С‚РёРЅРі РєР°С‚РµРіРѕСЂРёРё РѕС‚РєСЂРѕРµС‚СЃСЏ РїРѕСЃР»Рµ N РѕС‚Р·С‹РІРѕРІ") is consistent on the
// home scale, list cards and detail cards вЂ” with a single network fetch.
export type CategoryProgress = {
  threshold: number;
  total: number;
  categories: { name: string; count: number; unlocked: boolean }[];
};

let cache: CategoryProgress | null = null;
let inflight: Promise<CategoryProgress | null> | null = null;
const listeners = new Set<() => void>();
const unlockListeners = new Set<(category: string) => void>();

function notify() {
  for (const l of listeners) l();
}

/** Subscribe to "category just hit the threshold" events (for the celebration). */
export function onCategoryUnlock(fn: (category: string) => void) {
  unlockListeners.add(fn);
  return () => unlockListeners.delete(fn);
}

export function loadCategoryProgress(force = false): Promise<CategoryProgress | null> {
  if (cache && !force) return Promise.resolve(cache);
  if (inflight && !force) return inflight;
  inflight = api
    .categoryProgress()
    .then((d) => {
      // detect categories that became unlocked since the last snapshot. Skip the
      // very first load (no prior cache) so we don't celebrate on app open.
      const hadCache = cache !== null;
      const prevUnlocked = new Set(
        (cache?.categories ?? []).filter((c) => c.unlocked).map((c) => c.name),
      );
      cache = d;

codex
Аудит выявил ещё несколько нарушений продуктовых инвариантов, не только косметику: бот-пуши фактически включены; персональная лента допускает текстовые отзывы без пользовательского фото; карточка сети сначала показывает рейтинг отдельной точки; при недоступном CLIP модерация разрешает продвинуть фото на обложку. Эти пункты включу как критические с точными местами и фиксами.
Конвейер и лайки прослежены; расширенный статический аудит выявил несколько нарушений продуктовых правил и дрейф DTO. Перехожу к финальной сверке и формулировке фиксов.
  ✓ Разобрать premium-фото конвейер и текущие фильтры/кадрирование
  ✓ Проследить лайки отзывов: БД → backend DTO/endpoints → FeedPost/ListingDetail
  ✓ Провести связанный аудит UI и данных, проверить сборкой/типами без изменений
  → Сформировать компактный список правил, находок и конкретных фиксов
  ✓ Разобрать premium-фото конвейер и текущие фильтры/кадрирование
  ✓ Проследить лайки отзывов: БД → backend DTO/endpoints → FeedPost/ListingDetail
  ✓ Провести связанный аудит UI и данных, проверить сборкой/типами без изменений
  ✓ Сформировать компактный список правил, находок и конкретных фиксов
codex
Аудит выполнен чтением кода, без изменений файлов. Главные причины обоих пользовательских дефектов подтверждены.

## 1. Правила premium-фото

Сейчас конвейер небезопасен:

- Референс без анализа режется `cover + position: top`, поэтому смещённый чизкейк обрезается: [regen-per-venue.mjs](<D:/Приложения/Yelp/backend/prisma/regen-per-venue.mjs:96>).
- До генерации нет проверки «одно блюдо / коллаж / промобаннер».
- Prompt намеренно сдвигает блюдо вверх, усиливая обрезание: [regen-per-venue.mjs](<D:/Приложения/Yelp/backend/prisma/regen-per-venue.mjs:130>).
- `REF_SIM >= 0.82` сохраняет структуру плохого референса: коллаж, похожий на исходный коллаж, успешно проходит: [regen-per-venue.mjs](<D:/Приложения/Yelp/backend/prisma/regen-per-venue.mjs:201>).
- Проверка названия — softmax всего между двумя подписями. Такой score легко становится уверенным и не измеряет качество/целостность блюда: [regen-per-venue.mjs](<D:/Приложения/Yelp/backend/prisma/regen-per-venue.mjs:195>).
- Старый файл `refv/*.png` больше не проверяется и не обновляется: [regen-per-venue.mjs](<D:/Приложения/Yelp/backend/prisma/regen-per-venue.mjs:87>).

### Обязательный алгоритм smart-crop

Реализовать общий `photo-quality.mjs`, вызываемый и на `stage-dl`, и на `stage-check`.

1. Sharp декодирует изображение с `rotate()`, уменьшает копию до 256 px и отдаёт raw RGB.

2. Без новой тяжёлой модели строится карта заметности:

   `S = 0.40×borderDistance + 0.25×localContrast + 0.20×chroma + 0.15×SobelEdges`.

   - `borderDistance` — цветовое расстояние Lab до медианного цвета рамки шириной 5%.
   - `localContrast` — разница яркости между blur 5 и blur 31.
   - `chroma` — насыщенность, нормированная по p5–p95.
   - `SobelEdges` — границы тарелки/еды.
   - После порога Otsu: closing, connected components, удаление областей меньше 1% кадра.

3. Для неоднозначных кадров добавить CLIP-occlusion attention на уже установленном ViT-B/32:

   - baseline similarity полного изображения с названием блюда;
   - закрывать по одной ячейке сетки 7×7 медианным цветом фона;
   - падение similarity даёт relevance ячейки;
   - итоговая маска `M = 0.65×S + 0.35×CLIP_relevance`.

   Это использует текущий ONNX CLIP, новой модели не требует. Запускать attention только если saliency дала несколько сопоставимых компонентов.

4. Центр блюда — центр масс `M`; bbox — прямоугольник, содержащий 95% массы. Компонент подтверждается CLIP-сравнением `название блюда / single plated food / background / person / text`.

5. Квадрат crop:

   - размер `side = max(bboxW,bboxH) / 0.72`;
   - блюдо занимает примерно 65–80% стороны;
   - целевой центр `(0.50W, 0.46H)`, то есть лишь слегка выше геометрического;
   - bbox обязан иметь минимум 6–8% поля со всех сторон;
   - если целое блюдо физически не помещается в квадрат — не делать `cover`: либо `contain` на мягком размытом фоне, либо отклонить референс.

Главный инвариант: после crop ни один пиксель значимого bbox не должен касаться края.

### Отбрасывание коллажей до SD

Референс отклоняется, если срабатывает хотя бы один hard gate:

- Sharp находит длинные вертикальные/горизонтальные швы: линия проходит ≥80% кадра, по обе стороны заметно меняется статистика; сочетание вертикального и горизонтального шва означает плиточную сетку.
- Найдены минимум два разнесённых saliency-компонента площадью ≥6%, и каждый независимо классифицируется CLIP как еда/тарелка.
- В двух непересекающихся crop-регионах CLIP food score ≥0.65.
- Full-image CLIP предпочитает `food collage`, `combo meal`, `multiple dishes`, `menu banner` относительно `one single plated dish` с margin ≥0.10.
- Повторяющиеся равные регионы имеют высокую корреляцию/CLIP similarity — характерный случай нескольких плиток одной пиццы.
- OCR/edge-анализ находит крупные цены, рекламные подписи или текст, занимающий >8–10% изображения.

Проверки повторяются после img2img: SD тоже способен самостоятельно породить дубликаты или коллаж.

### Какие позиции не генерировать

Defense-in-depth должен находиться именно в `regen-per-venue.mjs`, даже если импорт уже что-то фильтрует.

Всегда пропускать:

- `комбо`, `combo`, `сет/сэт`, `набор`, `бокс`, `ассорти`, `дуэт`, `трио`, `mix`, `bundle`, `meal`;
- `меню дня`, `бизнес-ланч`, `комплексный обед`, `детское меню`, `на двоих`, `для компании`, `семейный набор`;
- `… и закуска`, `… и напиток`, `… и десерт`, `… + …`;
- `2/3/4 пиццы`, `x2`, `2+1`, `любые N`, «пицца и напиток»;
- акции, подарки, конструкторы, сертификаты;
- ретейл и полуфабрикаты;
- самостоятельные сорта винограда: «Шардоне», «Мерло», «Рислинг» и т. п. Вино допускается только как конкретный бренд/производитель.

Обычные составные названия вроде «лосось и брокколи» не блокировать: союз запрещается только при наличии второго самостоятельного SKU — напитка, закуски, десерта, второй пиццы и т. п. Для кириллицы использовать `WORD_CH`, а не `\b`.

### Гарантия premium-вида

Одного prompt недостаточно. Upload разрешать только после всех post-gates:

- ровно один предмет/тарелка;
- целое блюдо, безопасные поля, coverage 45–75% площади;
- dish-name CLIP margin;
- similarity с уже валидированным smart-crop референсом;
- отсутствие collage/text/person;
- clipped shadows/highlights <2%;
- приемлемая резкость, насыщенность и локальный контраст;
- фон спокойнее объекта по edge density;
- сохранять JSON-аудит: crop bbox, centroid, scores, reject reason, `policyVersion`.

Prompt заменить на: `one complete single plated dish, centered, fully visible, natural soft side light, clean neutral restaurant background, shallow depth of field, no text, no collage, no duplicate food`. При любом сомнении — fail closed, ничего не загружать.

## 2. Аудит UI и данных

### P0 — лайки отзывов

Backend toggle и `GET voteState` работают правильно: [reviews.service.ts](<D:/Приложения/Yelp/backend/src/reviews/reviews.service.ts:421>). Ошибка — в гидратации:

- `FeedPost` всегда начинает с `mine: []` и не вызывает `voteState`: [FeedPost.tsx](<D:/Приложения/Yelp/frontend/src/components/FeedPost.tsx:53>).
- `ListingDetail` делает то же для каждого отзыва: [ListingDetail.tsx](<D:/Приложения/Yelp/frontend/src/components/ListingDetail.tsx:589>).
- Backend feed/byId прикладывает только `voteCounts`, без голосов текущего пользователя: [listings.service.ts](<D:/Приложения/Yelp/backend/src/listings/listings.service.ts:771>).
- `GET /listings/:id` вообще не получает viewer: [listings.controller.ts](<D:/Приложения/Yelp/backend/src/listings/listings.controller.ts:199>).
- `PhotoPostModal` — единственное правильное место: отдельно вызывает `voteState`: [PhotoPostModal.tsx](<D:/Приложения/Yelp/frontend/src/components/PhotoPostModal.tsx:64>).

Фикс без N+1: сделать `attachVoteState(reviews, viewerId)` — один `groupBy` для counts и один `findMany({userId: viewerId, reviewId: in ids})` для `mine`. Передавать optional viewer в `feed` и `byId`, а в DTO отдавать `voteState: {counts,mine}`. Social endpoints уже авторизованы — там передавать `meId`. На frontend инициализироваться из `review.voteState`; клик делать оптимистическим с rollback и toast, а не молча глотать ошибку.

### Остальные критичные находки

1. **Бот-пуши включены вопреки правилу продукта.** `NotificationsService.add()` вызывает реальный `sendMessage`: [notifications.service.ts](<D:/Приложения/Yelp/backend/src/notifications/notifications.service.ts:40>). Есть также отдельный push-код подписки: [social.service.ts](<D:/Приложения/Yelp/backend/src/social/social.service.ts:560>). Оставить колокольчик, удалить `maybePush`/`notifyFollow` либо закрыть hard guard `USER_BOT_PUSH_ENABLED === 'true'`, дефолт false.

2. **Лента нарушает правило “только отзывы с пользовательским фото”.** Персональная выдача принимает `photo OR text`: [listings.service.ts](<D:/Приложения/Yelp/backend/src/listings/listings.service.ts:596>). `followingFeed` также не требует фото и даже допускает непроверенные статусы. Исправить на `status: APPROVED + photoUrls non-empty` во всех wall-выдачах.

3. **Рейтинг сети не единый.** Каталог выбирает одну ветку и возвращает её `avgRating/reviewCount`: [listings.service.ts](<D:/Приложения/Yelp/backend/src/listings/listings.service.ts:285>). Детальная карточка основной строкой показывает «эту точку», а сеть — вторичной: [ListingDetail.tsx](<D:/Приложения/Yelp/frontend/src/components/ListingDetail.tsx:791>). Отзывы тоже загружаются только по ID ветки. Нужно агрегировать rating/count/reviews по `groupKey` до DTO и использовать их как единственные публичные значения.

4. **Модерация фото fail-open.** При timeout/ошибке CLIP фото разрешается продвинуть на обложку: [reviews.service.ts](<D:/Приложения/Yelp/backend/src/reviews/reviews.service.ts:95>). Безопасный вариант: отзыв сохранить, но `promote:false`. Кроме того, проверяется только первое фото, а в gallery добавляются все: [reviews.service.ts](<D:/Приложения/Yelp/backend/src/reviews/reviews.service.ts:236>). Проверять каждое отдельно.

5. **Пользовательское фото не вытесняет AI-фото.** `/api/files/aigen-*` ошибочно считается UGC: [reviews.service.ts](<D:/Приложения/Yelp/backend/src/reviews/reviews.service.ts:275>). Использовать ту же проверку с исключением `aigen-`, которая уже есть в [listings.service.ts](<D:/Приложения/Yelp/backend/src/listings/listings.service.ts:456>).

6. **Цена clamp выполняется после сохранения review.** В `attributes` может остаться миллион рублей, а в `menuLink` попадёт 100 000: [reviews.service.ts](<D:/Приложения/Yelp/backend/src/reviews/reviews.service.ts:286>). Нормализовать копию attributes до `review.upsert`.

7. **Menu pipeline не запускает обязательную гигиену.** После импорта сразу стартуют фото: [menu-pipeline.mjs](<D:/Приложения/Yelp/backend/prisma/menu-pipeline.mjs:45>). Добавить последовательность dry-run/report → apply для purge-retail, dedup-items, dedup-coffee до генерации.

8. **Dedup оставляет устаревший средний рейтинг.** После переноса отзывов обновляется только `reviewCount`, не `avgRating`: [dedup-items.mjs](<D:/Приложения/Yelp/backend/prisma/dedup-items.mjs:99>) и [dedup-coffee-names.mjs](<D:/Приложения/Yelp/backend/prisma/dedup-coffee-names.mjs:85>). Пересчитывать `_avg` и `_count` одной агрегацией.

9. **Frontend typecheck красный.** `npx.cmd tsc --noEmit` не проходит: `ListingDetail.cityLabel` допускает `null`, базовый `Listing` — нет; `branches` не содержит используемый `cityLabel`; `videoUrls.length` считается обязательным; есть nullable-доступы к `data`. Также `firstTaster` запрашивается, но нигде не показывается. Сначала выровнять DTO-типы и удалить мёртвый запрос: [types.ts](<D:/Приложения/Yelp/frontend/src/types.ts:123>), [ListingDetail.tsx](<D:/Приложения/Yelp/frontend/src/components/ListingDetail.tsx:241>).
