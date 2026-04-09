/**
 * Fix isShort: duration ≤ 180s = Short.
 * Runs on server startup via entrypoint.sh.
 */

import prisma from '../config/database';

async function fixShorts() {
  console.log('🔧 Fixing isShort classification...');

  const videos = await prisma.video.findMany({
    where: { status: 'READY' },
    select: { id: true, title: true, duration: true, isShort: true },
  });

  let fixed = 0;

  for (const video of videos) {
    const shouldBeShort = video.duration > 0 && video.duration <= 180;

    if (video.isShort !== shouldBeShort) {
      await prisma.video.update({
        where: { id: video.id },
        data: { isShort: shouldBeShort },
      });
      fixed++;
      console.log(`  ${shouldBeShort ? '✅ SHORT' : '📺 NORMAL'}: "${video.title.substring(0, 40)}..." (${video.duration}s)`);
    }
  }

  console.log(`✅ Done! Fixed ${fixed} of ${videos.length} videos.`);
}

fixShorts()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('❌ fix-shorts error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
