import { Module } from '@nestjs/common';

import { SubnetAnalyticsController } from './subnet-analytics.controller';
import { SubnetAnalyticsService } from './subnet-analytics.service';

@Module({
  controllers: [SubnetAnalyticsController],
  providers: [SubnetAnalyticsService],
  exports: [SubnetAnalyticsService]
})
export class SubnetAnalyticsModule {}
