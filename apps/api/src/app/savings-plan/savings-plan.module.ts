import { PrismaModule } from '@ghostfolio/api/services/prisma/prisma.module';

import { Module } from '@nestjs/common';

import { SavingsPlanController } from './savings-plan.controller';
import { SavingsPlanService } from './savings-plan.service';

@Module({
  imports: [PrismaModule],
  controllers: [SavingsPlanController],
  providers: [SavingsPlanService],
  exports: [SavingsPlanService]
})
export class SavingsPlanModule {}
