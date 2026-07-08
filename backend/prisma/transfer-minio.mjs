// Copies every object from the local MinIO (docker) into the Railway bucket, so
// review photos and avatars stored as /api/files/<key> keep working in production.
// Idempotent: skips keys that already exist remotely.
//   node prisma/transfer-minio.mjs
import { execSync } from 'node:child_process';
import {
  S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, HeadObjectCommand,
} from '@aws-sdk/client-s3';

const local = new S3Client({
  endpoint: 'http://localhost:9000',
  region: 'us-east-1',
  credentials: { accessKeyId: 'minioadmin', secretAccessKey: 'minioadmin' },
  forcePathStyle: true,
});

const creds = JSON.parse(
  execSync('railway bucket credentials --bucket uploads --json', { cwd: '../', encoding: 'utf8' }),
);
const remote = new S3Client({
  endpoint: creds.endpoint,
  region: creds.region,
  credentials: { accessKeyId: creds.accessKeyId, secretAccessKey: creds.secretAccessKey },
  forcePathStyle: creds.urlStyle !== 'virtual-host',
});

const buf = async (body) => Buffer.concat(await body.toArray());

let copied = 0, skipped = 0, failed = 0;
let token;
do {
  const page = await local.send(new ListObjectsV2Command({ Bucket: 'uploads', ContinuationToken: token }));
  for (const o of page.Contents ?? []) {
    try {
      await remote.send(new HeadObjectCommand({ Bucket: creds.bucketName, Key: o.Key }));
      skipped++;
      continue; // already there
    } catch { /* not found → copy */ }
    try {
      const obj = await local.send(new GetObjectCommand({ Bucket: 'uploads', Key: o.Key }));
      await remote.send(new PutObjectCommand({
        Bucket: creds.bucketName,
        Key: o.Key,
        Body: await buf(obj.Body),
        ContentType: obj.ContentType ?? 'application/octet-stream',
      }));
      copied++;
      process.stdout.write(`\rcopied ${copied} (skipped ${skipped})`);
    } catch (e) {
      failed++;
      console.log(`\n  ✗ ${o.Key}: ${e.message}`);
    }
  }
  token = page.IsTruncated ? page.NextContinuationToken : undefined;
} while (token);
console.log(`\nDONE: copied ${copied}, skipped ${skipped}, failed ${failed}`);
