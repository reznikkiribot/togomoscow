import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
process.env.DATABASE_URL = fs.readFileSync('.railway-db-url','utf8').trim();
const { PrismaClient } = await import('@prisma/client');
const aws = await import('@aws-sdk/client-s3');
const p = new PrismaClient();
const creds = JSON.parse(execSync('railway bucket credentials --bucket uploads --json', { cwd: '..', encoding: 'utf8' }));
const s3 = new aws.S3Client({ endpoint: creds.endpoint, region: creds.region, credentials: { accessKeyId: creds.accessKeyId, secretAccessKey: creds.secretAccessKey }, forcePathStyle: creds.urlStyle !== 'virtual-host' });
const rows = await p.listing.findMany({ where: { type:{in:['DISH','DRINK']}, photoUrl:{ startsWith:'/api/files/aigen' } }, select:{ photoUrl:true } });
console.log('aigen-фото:', rows.length, '— удаляю их thumbnails');
let n=0;
for (const r of rows) {
  const key = r.photoUrl.replace('/api/files/','');
  for (const w of [200,400,600,900]) {
    await s3.send(new aws.DeleteObjectCommand({ Bucket: creds.bucketName, Key: `${key}-w${w}` })).catch(()=>{});
  }
  n++; if (n%50===0) console.log('  '+n+'…');
}
console.log('thumbnails удалены:', n, '— пересоздадутся из обрезанных оригиналов');
await p.$disconnect();
