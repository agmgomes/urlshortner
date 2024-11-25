import { CallHandler, ExecutionContext, Inject, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import Redis from "ioredis";
import { Observable, of, tap } from "rxjs";
import { AnalyticsService } from "src/analytics/analytics.service";

@Injectable()
export class RedisCacheStoreInterceptor implements NestInterceptor {
    private readonly logger = new Logger(RedisCacheStoreInterceptor.name);

    constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis,
                private readonly analyticsService: AnalyticsService) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        
        if (request.method === 'GET') {
            const urlId =  request.url.replace('/', '');
            const urlIdKey = `url:${urlId}`;
            const cachedData = await this.redisClient.hgetall(urlIdKey);
          

            if (!(Object.keys(cachedData).length === 0)) {
                if (new Date(cachedData.expiresAt).getTime() > Date.now()) {
                    const headers = request.headers;
                    const userAgent = headers['user-agent'];
                    await this.analyticsService.incrementAnalytics(urlId, userAgent);
                    return of(cachedData);
                }
                await this.redisClient.del(urlIdKey);
                this.logger.log(`Successfully deleted cached URL: ${cachedData.url} for ID: ${urlId} with expiration at ${cachedData.expiresAt}`);
            }

            return next.handle().pipe(
                tap(async (responseData) => {
                    const ttl = this.calculateTTL(responseData.expiresAt)
                    await this.redisClient.hmset(urlIdKey, responseData);
                    await this.redisClient.expire(urlIdKey, ttl);
                    this.logger.log(`Successfully cached URL: ${responseData.url} for ID: ${urlId} with expiration at: ${responseData.expiresAt}`);
                })
            )
        }

        return next.handle()
        
    }

    private calculateTTL(expiresAt: string): number {
        const expiresIn = new Date(expiresAt).getTime() - Date.now();
        const ttlInSeconds = expiresIn > 0 ? Math.floor(expiresIn/1000) : 0;
        return ttlInSeconds;
    }
}