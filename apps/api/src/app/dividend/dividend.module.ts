import { PrismaModule } from '@ghostfolio/api/services/prisma/prisma.module';

import { Module } from '@nestjs/common';

import { DividendController } from './dividend.controller';
import { DividendService } from './dividend.service';

@Module({
  imports: [PrismaModule],
  controllers: [DividendController],
  providers: [DividendService],
  exports: [DividendService]
})
export class DividendModule {}
