import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    async setKey(key: string, value: string): Promise<void> {
        await this.cacheManager.set(key, value);
    }

    async setMultipleKeys(entries: Array<{key: string, value: string}>): Promise<void> {
        const formattedEntries = entries.map(({key, value}) => [key, value] as [string, unknown]);
        await this.cacheManager.store.mset(formattedEntries);
    }

    async getKey(key: string): Promise<string> {
        return await this.cacheManager.get(key);
    }

    async deleteKey(key: string): Promise<void> {
        await this.cacheManager.del(key);
    }

    async resetCache(): Promise<void> {
        await this.cacheManager.reset();
    }

    async cacheStore(): Promise<string[]> {
        return await this.cacheManager.store.keys();
    }
}
