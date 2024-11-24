import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';


@Injectable()
export class RedisService {
    constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

    async setKey(key: string, value: string, tll?: number): Promise<void> {
        const ttl = tll;
        if(!ttl) {
            await this.redisClient.set(key, value);
        }
        
        await this.redisClient.set(key, value, "EX", tll);
    }

    async getKey(key: string): Promise<string> {
        return await this.redisClient.get(key);
    }

    async deleteKey(key: string): Promise<void> {
        await this.redisClient.del(key);
    }

    async resetCache(): Promise<void> {
        await this.redisClient.reset();
    }

    async getAllCache(): Promise<Record<string, string>> {
        const keys = await this.redisClient.keys('*');
        const cache: Record<string, string> = {};

        if(keys.length === 0 ) {
            return cache;
        }

        const pipeline = this.redisClient.pipeline();
        keys.forEach((key) => pipeline.get(key));

        const results = await pipeline.exec();
        keys.forEach((key, index) => {
            const [err, value] = results[index];
            if(err) {
                throw new Error(`Error fetching value for key ${key}: ${err.message}`);
            }
            if(typeof value === 'string') {
                cache[key] = value;
            } else {
                console.warn(`Unexpected value type for key ${key}`, value);
            }
        });

        return cache;
    }
}
