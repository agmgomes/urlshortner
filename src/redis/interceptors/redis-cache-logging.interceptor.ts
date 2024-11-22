import { CACHE_MANAGER, CacheInterceptor, CacheStore } from "@nestjs/cache-manager";
import { CallHandler, ExecutionContext, Inject, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, tap } from "rxjs";

@Injectable()
export class RedisLoggingCacheInterceptor extends CacheInterceptor {
    private readonly logger = new Logger(RedisLoggingCacheInterceptor.name);
    
    constructor(@Inject(CACHE_MANAGER) protected cacheManager: CacheStore, protected reflector: Reflector) {
        super(cacheManager, reflector);
    }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();

        if (request.method === 'GET') {
            const key = this.trackBy(context).replace('/', '');
            const cachedData = await this.cacheManager.get<{url: string, expiresAt: string}>(key);
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
                            this.logger.log(`Fetching URL: ${cachedData.url} that expires at: ${cachedData.expiresAt} from key: ${key}`);
                        }
                    }),
                );
        }

        return super.intercept(context, next);
    }
}