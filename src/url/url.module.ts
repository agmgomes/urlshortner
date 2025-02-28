import { Module } from '@nestjs/common';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Url, UrlSchema } from './url.schema';
import { RedisModule } from 'src/redis/redis.module';
import { AnalyticsModule } from 'src/analytics/analytics.module';

@Module({
  imports: [
    MongooseModule.forFeature([{name: Url.name, schema: UrlSchema}]),
    RedisModule,
    AnalyticsModule
  ],
  controllers: [UrlController],
  providers: [UrlService]
})
export class UrlModule {}
