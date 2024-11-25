import { CallHandler, ExecutionContext, Inject, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import Redis from "ioredis";
import { Observable, tap } from "rxjs";

@Injectable()
export class RedisLoggingCacheInterceptor implements NestInterceptor {
    private readonly logger = new Logger(RedisLoggingCacheInterceptor.name);
    
    constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}
    
    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        if (request.method === 'GET') {
            const urlId = request.url.replace('/', '');
            const urlIdKey = `url:${urlId}`;
            const cachedData = await this.redisClient.hgetall(urlIdKey);
            if (!(Object.keys(cachedData).length === 0)) {
                this.logger.log(`Cache hit for key: ${urlId}`);
            }
            else {
                this.logger.log(`Cache miss for key: ${urlId}`);
            }

            return next
                .handle()
                .pipe(
                    tap(() => {
                        if (!(Object.keys(cachedData).length === 0)) {
                            this.logger.log(`Fetching URL from cache: ${cachedData.url} that expires at: ${cachedData.expiresAt} from key: ${urlId}`);
                        }
                    }),
                );
        }

        return next.handle()

    }
}