import { CACHE_MANAGER, CacheInterceptor, CacheStore } from "@nestjs/cache-manager";
import { CallHandler, ExecutionContext, Inject, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, of, tap } from "rxjs";

@Injectable()
export class RedisCacheStoreInterceptor extends CacheInterceptor {
    private readonly logger = new Logger(RedisCacheStoreInterceptor.name);

    constructor(@Inject(CACHE_MANAGER) protected cacheManager: CacheStore, protected reflector: Reflector) {
        super(cacheManager, reflector);
    }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        
        if (request.method === 'GET') {
            const key = this.trackBy(context).replace('/', '');
            const cachedData = await this.cacheManager.get<{url: string, expiresAt: string}>(key);
            
            if (cachedData) {
                const { expiresAt } = cachedData;
                if (new Date(expiresAt).getTime() > Date.now()) {
                    return of(cachedData);
                }
                await this.cacheManager.del(key);
                this.logger.log(`Successfully deleted cached URL: ${cachedData.url} for ID: ${key} with expiration at ${cachedData.expiresAt}`);
            }

            return next.handle().pipe(
                tap(async (responseData) => {
                    const ttl = this.calculateTTL(responseData.expiresAt);
                    await this.cacheManager.set(key, responseData, ttl);
                    this.logger.log(`Successfully cached URL: ${responseData.url} for ID: ${key} with expiration at: ${responseData.expiresAt}`);
                })
            )
        }
        
        return super.intercept(context, next);
    }

    private calculateTTL(expiresAt: string): number {
        const expiresIn = new Date(expiresAt).getTime() - Date.now();
        return expiresIn > 0 ? expiresIn : 0;
    }
}