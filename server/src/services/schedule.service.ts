import prisma from '../config/database';

/**
 * Scheduled Video Publisher
 * Checks every minute for videos that are past their scheduledAt time
 * and publishes them by setting privacy to PUBLIC and clearing scheduledAt
 */
export function startSchedulePublisher() {
  const INTERVAL = 60 * 1000; // 1 minute

  setInterval(async () => {
    try {
      const now = new Date();
      const videosToPublish = await prisma.video.findMany({
        where: {
          scheduledAt: { lte: now },
          privacy: 'PRIVATE',
          status: 'READY',
        },
        select: { id: true, title: true, userId: true },
      });

      for (const video of videosToPublish) {
        await prisma.video.update({
          where: { id: video.id },
          data: { privacy: 'PUBLIC', scheduledAt: null },
        });

        // Notify the creator
        await prisma.notification.create({
          data: {
            userId: video.userId,
            type: 'SYSTEM',
            title: 'Video Published',
            message: `Your scheduled video "${video.title}" is now live!`,
            referenceId: video.id,
            link: `/watch/${video.id}`,
          },
        });

        console.log(`📅 Published scheduled video: ${video.title}`);
      }

      if (videosToPublish.length > 0) {
        console.log(`✅ Published ${videosToPublish.length} scheduled video(s)`);
      }
    } catch (error) {
      console.error('❌ Schedule publisher error:', error);
    }
  }, INTERVAL);

  console.log('📅 Schedule publisher started (checks every 60s)');
}
