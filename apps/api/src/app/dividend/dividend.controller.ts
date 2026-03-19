import type { RequestWithUser } from '@ghostfolio/common/types';

import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { SetDividendGoalDto } from './dividend.dto';
import { DividendService } from './dividend.service';

@Controller('dividend')
@UseGuards(AuthGuard('jwt'))
export class DividendController {
  constructor(
    @Inject(REQUEST) private readonly request: RequestWithUser,
    private readonly dividendService: DividendService
  ) {}

  @Get('dashboard')
  async getDashboard() {
    const userCurrency = this.request.user.settings.settings.baseCurrency;
    return this.dividendService.getDividendDashboard(
      this.request.user.id,
      userCurrency
    );
  }

  @Get('projection')
  async getProjection() {
    const userCurrency = this.request.user.settings.settings.baseCurrency;
    return this.dividendService.getDividendProjection(
      this.request.user.id,
      userCurrency
    );
  }

  @Get('calendar')
  async getCalendar(@Query('year') year?: string) {
    const yearNum = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.dividendService.getDividendCalendar(
      this.request.user.id,
      yearNum
    );
  }

  @Get('goal')
  async getGoal() {
    return this.dividendService.getDividendGoal(this.request.user.id);
  }

  @Post('goal')
  async setGoal(@Body() dto: SetDividendGoalDto) {
    const monthlyTarget = dto.monthlyTarget ?? 3000;
    return this.dividendService.setDividendGoal(
      this.request.user.id,
      monthlyTarget
    );
  }
}
