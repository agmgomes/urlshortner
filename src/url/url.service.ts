import { Injectable } from '@nestjs/common';
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
    constructor(@InjectModel(Url.name) private urlModel: Model<Url>) {}

    async shortenUrl( shortenUrlRequest: ShortenUrlRequest, request: Request) : Promise<ShortenUrlResponse> {
        const { url } = shortenUrlRequest;
        let id: string;

        do{
            id = randomStr(5,10);
        } while(await this.urlModel.exists({_id: id}))
        
        const dateTime = DateTime.now().plus({ minutes: 10 });

        const newUrl = new this.urlModel({ _id: id, fullUrl: url, expiresAt: dateTime});
        await newUrl.save();

        const { headers, protocol } = request;
        const newShortenUrl = protocol + "://" + headers.host + "/" + id;

        return ShortenUrlResponse.create(newShortenUrl);
    }

    async getFullUrl( id: string): Promise<{fullUrl: string | null}> {
        return await this.urlModel.findById(id).select('fullUrl -_id');
    }
}
