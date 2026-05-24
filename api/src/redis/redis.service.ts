import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor() {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        retryStrategy: (times) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
      this.client.connect().catch((e) => {
        this.logger.warn(`Redis connection failed: ${(e as Error).message}. Caching disabled.`);
        this.client = null;
      });
    } catch (e) {
      this.logger.warn(`Failed to create Redis client: ${(e as Error).message}. Caching disabled.`);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const val = await this.client.get(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    try {
      const str = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, str);
      } else {
        await this.client.set(key, str);
      }
    } catch {
      /* cache write failures are non-critical */
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch {
      /* ignore */
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch {
      /* ignore */
    }
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }
}
