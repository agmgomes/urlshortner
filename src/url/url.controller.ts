import { Body, Controller, Get, Param, Post, Redirect, Req, UseInterceptors } from '@nestjs/common';
import { UrlService } from './url.service';
import { ShortenUrlRequest } from './dto/shorten-url.request.dto';
import { ShortenUrlResponse } from './dto/shorten-url.response.dto';
import { Request } from 'express';
import { RedisCacheStoreInterceptor } from 'src/redis/interceptors/redis-cache-store.interceptor';

@Controller()
@UseInterceptors(RedisCacheStoreInterceptor)
export class UrlController {
    constructor(private readonly urlService: UrlService) {}

    @Post('shorten-url')
    async shortenUrl(@Body() shortenUrlRequest: ShortenUrlRequest, @Req() request: Request): Promise<ShortenUrlResponse> {
        return await this.urlService.shortenUrl(shortenUrlRequest, request);
    }
    
    @Get(':id')
    @Redirect()
    async redirectToOrigInalUrl(@Param('id') id: string): Promise<{url: string, expiresAt: string}> {
        const originalUrl = await this.urlService.getFullUrl(id);
        const { fullUrl, expiresAt}  = originalUrl;     
        return {url: fullUrl, expiresAt};
    }
}
