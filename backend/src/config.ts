import type { Config } from './types';

export function loadConfig(): Config {
  const config: Config = {
    // Admin
    adminUsername: process.env.ADMIN_USERNAME || 'admin',
    adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',

    // Storage
    storageType: (process.env.STORAGE_TYPE as 'local' | 's3') || 'local',
    storageRoot: process.env.STORAGE_ROOT || '/app/storage',

    // S3
    s3Endpoint: process.env.S3_ENDPOINT,
    s3Bucket: process.env.S3_BUCKET,
    s3Region: process.env.S3_REGION || 'us-east-1',
    s3AccessKey: process.env.S3_ACCESS_KEY,
    s3SecretKey: process.env.S3_SECRET_KEY,

    // Application
    baseUrl: process.env.BASE_URL || 'http://localhost:8080',
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // Features
    readonly: process.env.READONLY === 'true',
    enableMetrics: process.env.ENABLE_METRICS !== 'false',

    // Security
    sessionSecret: process.env.SESSION_SECRET || 'change-me-in-production',
    maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE || '10485760', 10), // 10MB
    rateLimitRequests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100', 10),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10), // 1 min

    // Thumbnails
    thumbnailSize: parseInt(process.env.THUMBNAIL_SIZE || '128', 10),
    thumbnailQuality: parseInt(process.env.THUMBNAIL_QUALITY || '85', 10),

    // Logging
    logLevel: (process.env.LOG_LEVEL as Config['logLevel']) || 'info',
  };

  // Validation
  if (!config.adminPasswordHash && config.nodeEnv === 'production') {
    throw new Error('ADMIN_PASSWORD_HASH must be set in production');
  }

  if (config.sessionSecret === 'change-me-in-production' && config.nodeEnv === 'production') {
    throw new Error('SESSION_SECRET must be set in production');
  }

  if (config.storageType === 's3') {
    if (!config.s3Endpoint || !config.s3Bucket || !config.s3AccessKey || !config.s3SecretKey) {
      throw new Error('S3 configuration incomplete: S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, and S3_SECRET_KEY must be set');
    }
  }

  return config;
}
