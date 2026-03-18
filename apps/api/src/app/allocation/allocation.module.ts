import { ImpersonationModule } from '@ghostfolio/api/services/impersonation/impersonation.module';
import { PrismaModule } from '@ghostfolio/api/services/prisma/prisma.module';

import { Module } from '@nestjs/common';

import { AllocationController } from './allocation.controller';
import { AllocationService } from './allocation.service';

@Module({
  imports: [ImpersonationModule, PrismaModule],
  controllers: [AllocationController],
  providers: [AllocationService],
  exports: [AllocationService]
})
export class AllocationModule {}
