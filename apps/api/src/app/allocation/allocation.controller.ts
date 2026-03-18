import { HasPermissionGuard } from '@ghostfolio/api/guards/has-permission.guard';
import { ImpersonationService } from '@ghostfolio/api/services/impersonation/impersonation.service';
import {
  HEADER_KEY_IMPERSONATION
} from '@ghostfolio/common/config';
import {
  SetAllocationTargetsDto
} from '@ghostfolio/common/dtos';
import { permissions } from '@ghostfolio/common/permissions';
import type { RequestWithUser } from '@ghostfolio/common/types';

import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Put,
  UseGuards
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { AllocationService } from './allocation.service';

@Controller('allocation')
export class AllocationController {
  public constructor(
    private readonly allocationService: AllocationService,
    private readonly impersonationService: ImpersonationService,
    @Inject(REQUEST) private readonly request: RequestWithUser
  ) {}

  @Get('custom')
  @UseGuards(AuthGuard('jwt'), HasPermissionGuard)
  public async getCustomAllocations(
    @Headers(HEADER_KEY_IMPERSONATION.toLowerCase()) impersonationId: string
  ) {
    const effectiveImpersonationId =
      await this.impersonationService.validateImpersonationId(impersonationId);

    return this.allocationService.getCustomAllocations({
      impersonationId: effectiveImpersonationId,
      userId: this.request.user.id
    });
  }

  @Put('custom/targets')
  @UseGuards(AuthGuard('jwt'), HasPermissionGuard)
  public async setAllocationTargets(@Body() data: SetAllocationTargetsDto) {
    return this.allocationService.setAllocationTargets({
      targets: data.targets,
      userId: this.request.user.id
    });
  }
}
