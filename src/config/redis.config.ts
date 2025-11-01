import { CacheModuleOptions, CacheOptionsFactory } from '@nestjs/cache-manager';
import { Injectable } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-store';

@Injectable()
export class RedisConfigService implements CacheOptionsFactory {
  async createCacheOptions(): Promise<CacheModuleOptions> {
    const store = await redisStore({
      socket: {
        host: 'localhost',
        port: 6379,
      },
      ttl: 10, // 기본 TTL (초 단위)
    });

    return {
      store,
    };
  }
}
