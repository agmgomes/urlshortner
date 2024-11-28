import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import Redis from 'ioredis';
import { Model } from 'mongoose';
import { Url } from 'src/url/url.schema';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
        @InjectModel(Url.name) private urlModel: Model<Url>) { }

    @Cron('* * * * *') //every minute
    async syncAnalyticsFromCache(): Promise<void> {
        this.logger.log('Starting analytics sync from Redis to MongoDB...');

        const keys = await this.redisClient.keys('analytics:*');

        for (const key of keys) {
            const urlId = key.replace('analytics:', '');
            const analytics = await this.redisClient.hgetall(key);
            const { totalVisits, lastAccessed, dailyVisits, userAgents } = this.extractAnalyticsData(analytics);

            const existingDocument = await this.urlModel.findOne({ _id: urlId });

            if (existingDocument) {
                const updatedDailyVisits = this.mergeData(existingDocument.analytics.dailyVisits, dailyVisits);
                const updatedUserAgents = this.mergeData(existingDocument.analytics.userAgents, userAgents);

                await this.updateAnalyticsInDatabase(urlId, totalVisits, lastAccessed, updatedDailyVisits, updatedUserAgents);

            }
            await this.redisClient.del(key);
            this.logger.log(`Synced analytics for URL ID: ${urlId}`);
        }

        this.logger.log('Completed analytics sync');
    }

    async incrementAnalytics(urlId: string, userAgent: string): Promise<void> {
        const key = `analytics:${urlId}`;
        const today = new Date().toISOString().split('T')[0]; //YYYY-MM-DD

        await this.redisClient.hincrby(key, 'visits', 1);
        await this.redisClient.hincrby(key, `daily:${today}`, 1);
        await this.redisClient.hset(key, 'lastAccessed', new Date().toISOString());

        if (userAgent) {
            const userAgentKey = `userAgents:${userAgent}`;
            await this.redisClient.hincrby(key, userAgentKey, 1);
        }

        await this.redisClient.expire(key, 3600) //key expires in 1 hour

        this.logger.log(`Incremented analytics for URL ID: ${urlId}`);
    }

    async getAnalytics(urlId: string): Promise<Object> {
        const url = await this.urlModel.findById(urlId, 'analytics');

        if (!url) {
            this.logger.warn(`Analytics from database for URL ID: ${urlId} not found`);
            throw new NotFoundException(`Analytics for URL ID: ${urlId} not found`);
        }

        this.logger.log(`Analytics for URL ID: ${urlId} fetched from database`);
        return url?.analytics || {};
    }

    private extractAnalyticsData(analytics: Record<string, string>) {
        const totalVisits = parseInt(analytics.visits || '0', 10);
        const lastAccessed = analytics.lastAccessed ? new Date(analytics.lastAccessed) : null;

        const dailyVisits = Object.entries(analytics)
            .filter(([field]) => field.startsWith('daily:'))
            .reduce((acc, [field, value]) => {
                acc[field.replace('daily:', '')] = parseInt(value, 10);
                return acc;
            }, {} as Record<string, number>);

        const userAgents = Object.entries(analytics)
            .filter(([field]) => field.startsWith('userAgents:'))
            .reduce((acc, [field, value]) => {
                acc[field.replace('userAgents:', '')] = parseInt(value, 10);
                return acc;
            }, {} as Record<string, number>);

        return { totalVisits, lastAccessed, dailyVisits, userAgents };
    }

    private async updateAnalyticsInDatabase(
        urlId: string, totalVisits: number, lastAccessed: Date | null,
        dailyVisits: Record<string, number>, userAgents: Record<string, number>) {

        await this.urlModel.updateOne(
            { _id: urlId },
            {
                $inc: { "analytics.visits": totalVisits },
                $set: {
                    "analytics.lastAccessed": lastAccessed,
                    "analytics.dailyVisits": dailyVisits,
                    "analytics.userAgents": userAgents
                }
            },
            { upsert: true }
        );
    }

    private mergeData(existingData: Record<string, number>, newData: Record<string, number>) {
        const merged = { ...existingData};
        for(const [key, count] of Object.entries(newData)) {
            merged[key] = (merged[key] || 0) + count;
        }
        return merged;
    }
}