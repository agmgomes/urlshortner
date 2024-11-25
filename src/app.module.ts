import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { UrlModule } from './url/url.module';
import { RedisModule } from './redis/redis.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true}), 
    UrlModule,
    DatabaseModule,
    RedisModule,
    AnalyticsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
