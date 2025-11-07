// Type definitions for the application

export interface Config {
  // Admin
  adminUsername: string;
  adminPasswordHash: string;

  // Storage
  storageType: 'local' | 's3';
  storageRoot: string;

  // S3
  s3Endpoint?: string;
  s3Bucket?: string;
  s3Region?: string;
  s3AccessKey?: string;
  s3SecretKey?: string;

  // Application
  baseUrl: string;
  port: number;
  nodeEnv: string;

  // Features
  readonly: boolean;
  enableMetrics: boolean;

  // Security
  sessionSecret: string;
  maxUploadSize: number;
  rateLimitRequests: number;
  rateLimitWindow: number;

  // Thumbnails
  thumbnailSize: number;
  thumbnailQuality: number;

  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  mimeType?: string;
  url?: string;
  thumbnailUrl?: string;
  lastModified?: string;
  etag?: string;
}

export interface ListResponse {
  path: string;
  items: FileInfo[];
  totalSize: number;
  totalCount: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  requestId?: string;
}

export interface Session {
  id: string;
  username: string;
  createdAt: number;
  lastActivity: number;
}

export interface UploadRequest {
  path: string;
  overwrite?: boolean;
}

export interface MkdirRequest {
  path: string;
}

export interface MoveRequest {
  src: string;
  dst: string;
}

export interface RenameRequest {
  path: string;
  newName: string;
}

export interface DeleteRequest {
  path: string;
}

export interface StorageAdapter {
  exists(path: string): Promise<boolean>;
  read(path: string): Promise<ReadableStream>;
  write(path: string, data: ReadableStream | Buffer): Promise<void>;
  delete(path: string): Promise<void>;
  list(path: string): Promise<FileInfo[]>;
  mkdir(path: string): Promise<void>;
  move(src: string, dst: string): Promise<void>;
  stat(path: string): Promise<FileInfo>;
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}
