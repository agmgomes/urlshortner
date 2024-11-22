import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Url } from './url.schema';
import { Model } from 'mongoose';
import { ShortenUrlRequest } from './dto/shorten-url.request.dto';
import { ShortenUrlResponse } from './dto/shorten-url.response.dto';
import randomStr from 'src/common/utils/random-string-generator.util';
import { DateTime } from 'luxon';
import { Request } from 'express';

@Injectable()
export class UrlService {
    private readonly logger = new Logger(UrlService.name);

    constructor(@InjectModel(Url.name) private urlModel: Model<Url>) {}

    async shortenUrl( shortenUrlRequest: ShortenUrlRequest, request: Request) : Promise<ShortenUrlResponse> {
        const { url, expirationTime } = shortenUrlRequest;
        
        let id: string;
        do{
            id = randomStr(5,10);
        } while(await this.urlModel.exists({_id: id}));

        
        const defaultExpiration = 24 * 60; // 24 hours in minutes
        const duration = expirationTime ? expirationTime : defaultExpiration; 
        const dateTime = DateTime.now().plus({ minutes: duration });

        const newUrl = new this.urlModel({ _id: id, fullUrl: url, expiresAt: dateTime});
        try {
            await newUrl.save();
            const {_id , fullUrl, expiresAt } = newUrl;
            this.logger.log(`URL saved into the database with success: ${JSON.stringify({id: _id, fullUrl, expiresAt})}`);
        } catch (error) {
            this.logger.error(`Error saving the URL: ${url} with id: ${id}`);
            throw new InternalServerErrorException(error);
        }
        
        const { headers, protocol } = request;
        const newShortenUrl = protocol + "://" + headers.host + "/" + id;

        return ShortenUrlResponse.create(newShortenUrl);
    }

    async getFullUrl(id: string): Promise<{fullUrl: string, expiresAt: string}> {
        this.logger.log(`Fetching URL from database for ID: ${id}`);

        const url = await this.urlModel.findById(id).select('fullUrl expiresAt -_id');
        if(!url) {
            this.logger.warn(`No URL found in database for ID: ${id}`);
            throw new NotFoundException(`URL with id ${id} not found`);
        }
        
        this.logger.log(`Successfully fetched URL (${url.fullUrl}) from database for ID: ${id}`);
        return {fullUrl: url.fullUrl, expiresAt: url.expiresAt.toISOString()};
    }
}
