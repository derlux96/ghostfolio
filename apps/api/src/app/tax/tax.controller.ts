import type { RequestWithUser } from '@ghostfolio/common/types';

import {
  Controller,
  Get,
  Header,
  Inject,
  Query,
  UseGuards
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { TaxService } from './tax.service';

@Controller('tax')
@UseGuards(AuthGuard('jwt'))
export class TaxController {
  constructor(
    @Inject(REQUEST) private readonly request: RequestWithUser,
    private readonly taxService: TaxService
  ) {}

  @Get('summary')
  async getSummary(@Query('year') year?: string) {
    const yearNum = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.taxService.getTaxSummary(this.request.user.id, yearNum);
  }

  @Get('positions')
  async getPositions(@Query('year') year?: string) {
    const yearNum = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.taxService.getTaxPositions(this.request.user.id, yearNum);
  }

  @Get('export/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="tax-report.csv"')
  async exportCsv(@Query('year') year?: string) {
    const yearNum = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.taxService.exportTaxCsv(this.request.user.id, yearNum);
  }

  @Get('export')
  async export(@Query('year') year?: string) {
    const yearNum = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.taxService.exportTaxData(this.request.user.id, yearNum);
  }
}
