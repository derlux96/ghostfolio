import type { RequestWithUser } from '@ghostfolio/common/types';

import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  UseGuards
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { CreateSavingsPlanDto, UpdateSavingsPlanDto } from './savings-plan.dto';
import { SavingsPlanService } from './savings-plan.service';

@Controller('savings-plans')
@UseGuards(AuthGuard('jwt'))
export class SavingsPlanController {
  constructor(
    @Inject(REQUEST) private readonly request: RequestWithUser,
    private readonly savingsPlanService: SavingsPlanService
  ) {}

  @Get()
  async getSavingsPlans() {
    return this.savingsPlanService.getSavingsPlans(this.request.user.id);
  }

  @Get('summary')
  async getSummary() {
    return this.savingsPlanService.getSavingsPlanSummary(this.request.user.id);
  }

  @Get(':id')
  async getSavingsPlan(@Param('id') id: string) {
    return this.savingsPlanService.getSavingsPlan(id, this.request.user.id);
  }

  @Post()
  async createSavingsPlan(@Body() dto: CreateSavingsPlanDto) {
    return this.savingsPlanService.createSavingsPlan(this.request.user.id, dto);
  }

  @Put(':id')
  async updateSavingsPlan(
    @Param('id') id: string,
    @Body() dto: UpdateSavingsPlanDto
  ) {
    return this.savingsPlanService.updateSavingsPlan(
      id,
      this.request.user.id,
      dto
    );
  }

  @Delete(':id')
  async deleteSavingsPlan(@Param('id') id: string) {
    return this.savingsPlanService.deleteSavingsPlan(id, this.request.user.id);
  }
}
