import { IsNumber, IsOptional, IsString } from 'class-validator';
import { AssetSubClass } from '@prisma/client';

// Query DTOs
export class TaxSummaryQueryDto {
  @IsNumber()
  @IsOptional()
  year?: number;
}

export class TaxPositionsQueryDto {
  @IsNumber()
  @IsOptional()
  year?: number;
}

export class TaxExportQueryDto {
  @IsNumber()
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  format?: 'csv' | 'pdf';
}

// Response DTOs
export class TaxDividendDto {
  symbol: string;
  name: string;
  isin: string;
  date: Date;
  amount: number;
  teilfreistellung: number;
  taxableAmount: number;
  abgeltungsteuer: number;
  kirchensteuer: number;
  totalTax: number;
  assetSubClass: AssetSubClass | null;
}

export class TaxSaleDto {
  symbol: string;
  name: string;
  isin: string;
  date: Date;
  gain: number;
  teilfreistellung: number;
  taxableGain: number;
  abgeltungsteuer: number;
  kirchensteuer: number;
  totalTax: number;
  isTaxFree: boolean;
  assetSubClass: AssetSubClass | null;
}

export class TaxVorabpauschaleDto {
  symbol: string;
  name: string;
  isin: string;
  date: Date;
  amount: number;
  taxableAmount: number;
  abgeltungsteuer: number;
  kirchensteuer: number;
  totalTax: number;
}

export class TaxSummaryDto {
  year: number;
  dividends: {
    total: number;
    tax: number;
    teilfreistellung: number;
    count: number;
  };
  sales: {
    totalGains: number;
    tax: number;
    teilfreistellung: number;
    taxFreeGains: number;
    count: number;
  };
  vorabpauschale: {
    total: number;
    tax: number;
    count: number;
  };
  total: {
    tax: number;
    teilfreistellung: number;
  };
}

export class TaxPositionDetailsDto {
  symbol: string;
  name: string;
  isin: string;
  assetSubClass: AssetSubClass | null;
  dividends: TaxDividendDto[];
  sales: TaxSaleDto[];
  vorabpauschalen: TaxVorabpauschaleDto[];
  totals: {
    dividendTax: number;
    saleTax: number;
    vorabpauschaleTax: number;
    totalTax: number;
  };
}

export class TaxExportDto {
  year: number;
  currency: string;
  generatedAt: Date;
  summary: TaxSummaryDto;
  positions: TaxPositionDetailsDto[];
}
