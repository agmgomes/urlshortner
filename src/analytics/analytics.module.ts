import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RedisModule } from 'src/redis/redis.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Url, UrlSchema } from 'src/url/url.schema';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [RedisModule, MongooseModule.forFeature([{name: Url.name, schema: UrlSchema}])],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
  controllers: [AnalyticsController]
})
export class AnalyticsModule {}
