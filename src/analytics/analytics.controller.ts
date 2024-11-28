import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get(':id')
    async getAnalytics(@Param('id') urlId: string): Promise<Object> {
        await this.analyticsService.syncAnalyticsFromCache();
        return this.analyticsService.getAnalytics(urlId);
    }
}
