import { Body, Controller, Get, NotFoundException, Param, Post, Redirect, Req, Res } from '@nestjs/common';
import { UrlService } from './url.service';
import { ShortenUrlRequest } from './dto/shorten-url.request.dto';
import { ShortenUrlResponse } from './dto/shorten-url.response.dto';
import { Request } from 'express';

@Controller()
export class UrlController {
    constructor(private readonly urlService: UrlService) {}

    @Post('/shorten-url')
    async shortenUrl(@Body() shortenUrlRequest: ShortenUrlRequest, @Req() request: Request): Promise<ShortenUrlResponse> {
        return await this.urlService.shortenUrl(shortenUrlRequest, request);
    }
    
    @Get("/:id")
    @Redirect()
    async redirectToOrigInalUrl(@Param('id') id: string) {
        const originalUrl = await this.urlService.getFullUrl(id);
        
        if(!originalUrl){
            throw new NotFoundException(`URL with ${id} does not exists`);
        } 
      
        return {url: originalUrl.fullUrl};
    }

}
