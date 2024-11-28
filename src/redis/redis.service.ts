import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';


@Injectable()
export class RedisService {
    constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

    async getFromCache(key: string): Promise<any | null> {
        const cachedData = await this.redisClient.hgetall(`url:${key}`);
        if(Object.keys(cachedData).length === 0 ) return null;

        if(new Date(cachedData.expiresAt).getTime() > Date.now()) {
            return cachedData;
        }

        await this.redisClient.del(`url:${key}`);
        return null;
    }

    async storeInCache(key: string, data: any): Promise<void> {
        const redisKey = `url:${key}`;
        const ttl = this.calculateTTL(data.expiresAt);

        await this.redisClient.hmset(redisKey, data);
        await this.redisClient.expire(redisKey, ttl);
    }

    async getKey(key: string): Promise<Record<string, string>> {
        return await this.redisClient.hgetall(key);
    }

    async deleteKey(key: string): Promise<void> {
        await this.redisClient.del(key);
    }

    async resetCache(): Promise<void> {
        await this.redisClient.reset();
    }

    async getAllCache(): Promise<Record<string, Record<string,string>>> {
        const keys = await this.redisClient.keys('*');
        const cache: Record<string, Record<string, string>> = {};

        if(keys.length === 0 ) {
            return cache;
        }

        const pipeline = this.redisClient.pipeline();
        keys.forEach((key) => pipeline.hgetall(key));

        const results = await pipeline.exec();
        keys.forEach((key, index) => {
            const [err, value] = results[index];
            if(err) {
                throw new Error(`Error fetching value for key ${key}: ${err.message}`);
            }
            if(typeof value === 'object' && value !== null) {
                cache[key] = value as Record<string, string>;
            } else {
                console.warn(`Unexpected value type for key ${key}`, value);
            }
        });

        return cache;
    }
    
    private calculateTTL(expiresAt: string): number {
        const expiresIn = new Date(expiresAt).getTime() - Date.now();
        return expiresIn > 0 ? Math.floor(expiresIn / 1000) : 0;
    }
}
