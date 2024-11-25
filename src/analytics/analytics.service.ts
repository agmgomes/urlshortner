import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) { }

    async incrementAnalytics(urlId: string, userAgent: string): Promise<void> {
        const key =`analytics:${urlId}`;
        const today = new Date().toISOString().split('T')[0]; //YYYY-MM-DD
        
        await this.redisClient.hincrby(key, 'visits', 1);
        await this.redisClient.hincrby(key, `daily:${today}`, 1);
        await this.redisClient.hset(key, 'lastAccessed', new Date().toISOString());

        if(userAgent) {
            const userAgentKey = `userAgents:${userAgent}`;
            await this.redisClient.hincrby(key, userAgentKey, 1);
        }

        this.logger.log(`Incremented analytics for URL ID: ${urlId}`);
    }
}
