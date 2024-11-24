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
            const key = request.url.replace('/', '');
            const cachedData = await this.redisClient.get(key);
            if (cachedData) {
                this.logger.log(`Cache hit for key: ${key}`);
            }
            else {
                this.logger.log(`Cache miss for key: ${key}`);
            }

            return next
                .handle()
                .pipe(
                    tap(() => {
                        if (cachedData) {
                            const parsedCachedData = JSON.parse(cachedData);
                            this.logger.log(`Fetching URL: ${parsedCachedData.url} that expires at: ${parsedCachedData.expiresAt} from key: ${key}`);
                        }
                    }),
                );
        }

        return next.handle()

    }
}