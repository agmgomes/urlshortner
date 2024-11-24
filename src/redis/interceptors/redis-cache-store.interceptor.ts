import { CallHandler, ExecutionContext, Inject, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import Redis from "ioredis";
import { Observable, of, tap } from "rxjs";

@Injectable()
export class RedisCacheStoreInterceptor implements NestInterceptor {
    private readonly logger = new Logger(RedisCacheStoreInterceptor.name);

    constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        
        if (request.method === 'GET') {
            const key =  request.url.replace('/', '');
            const cachedData = await this.redisClient.get(key);
            
            if (cachedData) {
                const parsedCachedData = JSON.parse(cachedData);
                const { expiresAt } = parsedCachedData;
                if (new Date(expiresAt).getTime() > Date.now()) {
                    return of(parsedCachedData);
                }
                await this.redisClient.del(key);
                this.logger.log(`Successfully deleted cached URL: ${parsedCachedData.url} for ID: ${key} with expiration at ${parsedCachedData.expiresAt}`);
            }

            return next.handle().pipe(
                tap(async (responseData) => {
                    const ttl = this.calculateTTL(responseData.expiresAt)
                    await this.redisClient.set(key, JSON.stringify(responseData), "EX", ttl);
                    this.logger.log(`Successfully cached URL: ${responseData.url} for ID: ${key} with expiration at: ${responseData.expiresAt}`);
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