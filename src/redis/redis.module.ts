import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CacheModule } from '@nestjs/cache-manager'
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisController } from './redis.controller';

@Module({
  imports: [ConfigModule,
    CacheModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get<string>('REDIS_HOST'),
            port: configService.get<number>('REDIS_PORT'),
            
          },
          ttl: 10*60000,
        }),
      }),
      inject: [ConfigService],
    })],
  providers: [RedisService],
  exports: [RedisService, CacheModule],
  controllers: [RedisController]
})
export class RedisModule {}
