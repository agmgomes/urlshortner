import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('redis')
export class RedisController {
    constructor(private readonly redisService: RedisService) {}

    @Get('key/:key')
    async getCachedKey(@Param('key') key: string) {
        const value = await this.redisService.getKey(key);

        if(!value){
            return {message: `No value found for key: ${key}`};
        }

        return {key: key, value};
    }

    @Get('store')
    async getCacheStore(): Promise<Record<string, Record<string, string>>> {
        return await this.redisService.getAllCache();
    }

    @Delete('/:key')
    async deleteCachedKey(@Param('key') key: string): Promise<void> {
        await this.redisService.deleteKey(key);
    }

}
