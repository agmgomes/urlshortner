import { Module } from '@nestjs/common';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Url, UrlSchema } from './url.schema';

@Module({
  imports: [MongooseModule.forFeature([{name: Url.name, schema: UrlSchema}]),
],
  controllers: [UrlController],
  providers: [UrlService]
})
export class UrlModule {}
