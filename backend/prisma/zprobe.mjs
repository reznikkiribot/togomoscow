import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envText = fs.readFileSync(path.join(__dirname,'..','.env'),'utf8');
for (const l of envText.split(/\r?\n/)){ if(!l||l.startsWith('#')||!l.includes('='))continue; const i=l.indexOf('='); const k=l.slice(0,i).trim(); if(!process.env[k]) process.env[k]=l.slice(i+1).trim().replace(/^["']|["']$/g,''); }
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
async function get(u){ try{ const c=new AbortController(); const t=setTimeout(()=>c.abort(),12000); const r=await fetch(u,{headers:{'User-Agent':UA},signal:c.signal}); clearTimeout(t); if(!r.ok) return null; return await r.text(); }catch(e){ return 'ERR:'+e.code; } }
const FOOD=/(бургер|пицц|паст|ролл|кофе|латте|салат|суп|стейк|десерт|торт|напит|меню|цена|руб|₽)/gi;
const { PrismaClient } = await import('@prisma/client');
const p=new PrismaClient();
const vs=await p.listing.findMany({ where:{ type:'RESTAURANT', website:{not:null} }, select:{name:true,website:true}, take:8, orderBy:{reviewCount:'desc'} });
for(const v of vs){
  const h=await get(v.website);
  if(!h){ console.log(`${v.name} (${v.website}): нет ответа`); continue; }
  if(h.startsWith('ERR:')){ console.log(`${v.name}: ${h}`); continue; }
  const txt=(h.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' '));
  const foodHits=(txt.match(FOOD)||[]).length;
  const prices=(txt.match(/\d{2,4}\s?(?:₽|руб|р\.)/g)||[]).length;
  console.log(`${v.name}: html=${Math.round(h.length/1024)}KB text=${Math.round(txt.length/1024)}KB food-слов=${foodHits} цен=${prices}`);
}
await p.$disconnect();
