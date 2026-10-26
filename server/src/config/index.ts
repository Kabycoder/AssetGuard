import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'assetguard-super-secure-jwt-dev-secret-key-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisDashboardTtl: parseInt(process.env.REDIS_DASHBOARD_TTL || '60', 10),
  apiVersion: 'v1',
} as const;

export { prisma } from './prisma';
export {
  redis,
  getCache,
  setCache,
  deleteCache,
  invalidateDashboardCache,
  isRedisConnected,
} from './redis';

