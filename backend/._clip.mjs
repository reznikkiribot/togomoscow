import { pipeline, env } from '@xenova/transformers';
env.cacheDir = './.models-cache';
console.log('loading CLIP image model...');
const t0 = Date.now();
// image feature extractor (CLIP vision tower) → 512-dim embedding
const extractor = await pipeline('image-feature-extraction', 'Xenova/clip-vit-base-patch32');
console.log('model loaded in', ((Date.now()-t0)/1000).toFixed(1), 's');
const t1 = Date.now();
// embed a real coffee image (remote URL supported by transformers.js)
const out = await extractor('https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', { pooling: 'mean', normalize: true });
console.log('embed dims:', out.dims, 'inference ms:', Date.now()-t1);
console.log('first 5:', Array.from(out.data).slice(0,5).map(x=>x.toFixed(4)).join(', '));
