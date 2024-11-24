import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { RedisService } from './redis.service';
import { KeyValueDto } from './dto/set-cache.dto';

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
    async getCacheStore(): Promise<Record<string, string>> {
        return await this.redisService.getAllCache();
    }

    @Post('set')
    async setCachedKey(@Body() keyValueDto: KeyValueDto): Promise<void> {
        const {key, value} = keyValueDto;
        await this.redisService.setKey(key, value)
    }

    @Delete('/:key')
    async deleteCachedKey(@Param('key') key: string): Promise<void> {
        await this.redisService.deleteKey(key);
    }

}
