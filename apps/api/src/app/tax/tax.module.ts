import { PrismaModule } from '@ghostfolio/api/services/prisma/prisma.module';

import { Module } from '@nestjs/common';

import { TaxController } from './tax.controller';
import { GermanTaxCalculatorService } from './german-tax-calculator.service';
import { TaxService } from './tax.service';

@Module({
  imports: [PrismaModule],
  controllers: [TaxController],
  providers: [TaxService, GermanTaxCalculatorService],
  exports: [TaxService, GermanTaxCalculatorService]
})
export class TaxModule {}
