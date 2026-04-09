import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { ensureBucket } from './config/minio';
import redis from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Routes
import authRoutes from './routes/auth.routes';
import videoRoutes from './routes/video.routes';
import commentRoutes from './routes/comment.routes';
import channelRoutes from './routes/channel.routes';
import playlistRoutes from './routes/playlist.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';
import communityRoutes from './routes/community.routes';
import sitemapRoutes from './routes/sitemap.routes';
import liveRoutes from './routes/live.routes';
import reportRoutes from './routes/report.routes';
import { startMediaServer } from './services/media-server';
import { startSchedulePublisher } from './services/schedule.service';
import path from 'path';
import { env as envConfig } from './config/env';

const app = express();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(apiLimiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'streamsphere API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/sitemap', sitemapRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/reports', reportRoutes);

// Serve live HLS segments statically
app.use('/live', express.static(path.resolve(envConfig.LIVE_HLS_PATH), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
  },
}));

// Error handler
app.use(errorHandler);

// Start server
async function bootstrap() {
  try {
    // Connect to Redis
    await redis.connect();

    // Ensure MinIO bucket exists
    await ensureBucket();

    // Start RTMP media server for live streaming
    try {
      startMediaServer();
    } catch (err) {
      console.warn('⚠️ Media server failed to start (live streaming disabled):', err);
    }

    // Start scheduled video publisher
    startSchedulePublisher();

    app.listen(env.PORT, () => {
      console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║     🌐  streamsphere API Server                ║
║     📡  Port: ${env.PORT}                         ║
║     🔧  Mode: ${env.NODE_ENV.padEnd(25)}║
║     📦  API:  http://localhost:${env.PORT}/api      ║
║                                              ║
╚══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

export default app;
