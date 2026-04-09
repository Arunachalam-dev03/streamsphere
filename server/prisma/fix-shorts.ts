/**
 * Fix isShort classification: duration ≤ 180s = Short.
 * Run: docker compose exec server npx tsx prisma/fix-shorts.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixShorts() {
  console.log('🔧 Fixing isShort: any video ≤ 3 minutes = Short\n');

  const videos = await prisma.video.findMany({
    where: { status: 'READY' },
    select: { id: true, title: true, duration: true, isShort: true },
  });

  console.log(`Found ${videos.length} videos.\n`);

  let fixedToShort = 0;
  let fixedToNormal = 0;

  for (const video of videos) {
    const shouldBeShort = video.duration > 0 && video.duration <= 180;

    if (video.isShort !== shouldBeShort) {
      await prisma.video.update({
        where: { id: video.id },
        data: { isShort: shouldBeShort },
      });

      const label = shouldBeShort ? '✅ SHORT' : '📺 NORMAL';
      console.log(`  ${label}: "${video.title.substring(0, 50)}..." (${video.duration}s)`);
      shouldBeShort ? fixedToShort++ : fixedToNormal++;
    }
  }

  console.log(`\n📊 Fixed ${fixedToShort} to Short, ${fixedToNormal} to Normal`);
  console.log('✅ Done!');
}

fixShorts()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('❌ Error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
