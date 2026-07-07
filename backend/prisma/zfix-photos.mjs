import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envText = fs.readFileSync(path.join(__dirname,'..','.env'),'utf8');
for (const l of envText.split(/\r?\n/)){ if(!l||l.startsWith('#')||!l.includes('='))continue; const i=l.indexOf('='); const k=l.slice(0,i).trim(); if(!process.env[k]) process.env[k]=l.slice(i+1).trim().replace(/^["']|["']$/g,''); }
const PEXELS = process.env.PEXELS_API_KEY;
const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
async function pexelsOne(q, locale){ try { const url=`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=1&orientation=landscape${locale?`&locale=${locale}`:''}`; const r=await fetch(url,{headers:{Authorization:PEXELS},signal:AbortSignal.timeout(10000)}); if(!r.ok)return null; const d=await r.json(); return d.photos?.[0]?.src?.large ?? d.photos?.[0]?.src?.medium ?? null; } catch { return null; } }
async function pexelsPhoto(name){ const drink=/кофе|латте|капучин|\bраф\b|\bчай\b|матч|какао|коктейл|лимонад|смузи|\bвино\b|\bпиво\b|сидр|напит|глинтвейн|эспрессо|американо/i.test(name); const kind=drink?'напиток':'еда'; const first=name.split(/[\s,]+/)[0]; return (await pexelsOne(`${name} ${kind}`,'ru-RU')) || (first.length>=4?await pexelsOne(`${first} ${kind}`,'ru-RU'):null) || (await pexelsOne(drink?'drink':'food dish')); }

const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();
const evs = await p.venueEvent.findMany({ where:{ kind:'dish', aiProcessed:true }, select:{ id:true, title:true } });
let n=0;
for (const e of evs){ if(!e.title)continue; const photo=await pexelsPhoto(e.title); if(photo){ await p.venueEvent.update({where:{id:e.id},data:{photoUrl:photo}}).catch(()=>{}); n++; } if(n%50===0) console.log(`updated ${n}/${evs.length}`); await sleep(220); }
console.log(`DONE. фото обновлено: ${n}/${evs.length}`);
await p.$disconnect();
