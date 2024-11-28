import { CallHandler, ExecutionContext, Inject, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable, of, tap } from "rxjs";
import { AnalyticsService } from "src/analytics/analytics.service";
import { RedisService } from "../redis.service";

@Injectable()
export class RedisCacheStoreInterceptor implements NestInterceptor {
    private readonly logger = new Logger(RedisCacheStoreInterceptor.name);

    constructor(private readonly redisService: RedisService,
        private readonly analyticsService: AnalyticsService) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        if (request.method !== 'GET') {
            return next.handle();
        }

        const urlId = request.url.replace('/', '');
        const userAgent = request.headers['user-agent'];
        const cachedData = await this.redisService.getFromCache(urlId);

        if (cachedData) {
            this.logger.log(`Fetching URL from cache: ${cachedData.url} that expires at: ${cachedData.expiresAt} from key: ${urlId}`);
            //Save analytics in cache
            await this.analyticsService.incrementAnalytics(urlId, userAgent);
            
            return of(cachedData);
        }

        return next.handle().pipe(
            tap(async (responseData) => {
                this.logger.warn(`Cache miss for key: ${urlId}`);
                await this.redisService.storeInCache(urlId, responseData);
                this.logger.log(`Successfully cached URL: ${responseData.url} for ID: ${urlId} with expiration at: ${responseData.expiresAt}`);

                await this.analyticsService.incrementAnalytics(urlId, userAgent);
            })
        )
    }
}