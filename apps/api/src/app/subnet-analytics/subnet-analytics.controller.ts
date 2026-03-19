import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { SubnetAnalyticsService } from './subnet-analytics.service';

@Controller('subnet-analytics')
@UseGuards(AuthGuard('jwt'))
export class SubnetAnalyticsController {
  constructor(
    private readonly subnetAnalyticsService: SubnetAnalyticsService
  ) {}

  @Get('subnets')
  async getAllSubnets() {
    return this.subnetAnalyticsService.getAllSubnets();
  }

  @Get('subnets/:netuid')
  async getSubnet(@Param('netuid') netuid: string) {
    const data = await this.subnetAnalyticsService.getSubnet(
      parseInt(netuid, 10)
    );
    return data ?? { error: 'Subnet not found' };
  }

  @Get('tokens/prices')
  async getTokenPrices() {
    const prices = await this.subnetAnalyticsService.getTokenPrices();
    return {
      prices,
      lastUpdated: new Date().toISOString()
    };
  }

  @Get('rankings')
  async getRankings() {
    const { subnets } = await this.subnetAnalyticsService.getAllSubnets();
    return {
      rankings: {
        emission: this.subnetAnalyticsService
          .getEmissionRankings(subnets)
          .slice(0, 20),
        taoFlow: this.subnetAnalyticsService
          .getTaoFlowRankings(subnets)
          .slice(0, 20),
        netFlow1Day: this.subnetAnalyticsService
          .getNetFlowRankings(subnets, '1d')
          .slice(0, 20),
        netFlow7Days: this.subnetAnalyticsService
          .getNetFlowRankings(subnets, '7d')
          .slice(0, 20),
        netFlow30Days: this.subnetAnalyticsService
          .getNetFlowRankings(subnets, '30d')
          .slice(0, 20)
      },
      lastUpdated: new Date().toISOString()
    };
  }
}
