import { IsNumber, IsOptional } from 'class-validator';

export class SetDividendGoalDto {
  @IsNumber()
  @IsOptional()
  monthlyTarget?: number;
}

export class DividendCalendarDto {
  month: number;
  year: number;
  amount: number;
  currency: string;
}

export class DividendHoldingDto {
  symbol: string;
  name: string;
  isin: string;
  amount: number;
  yield: number;
  currency: string;
}

export class DividendDashboardDto {
  totalYtd: number;
  totalAllTime: number;
  averageMonthly: number;
  annualProjection: number;
  currency: string;
  monthlyData: Array<{ month: string; year: number; amount: number }>;
  topHoldings: DividendHoldingDto[];
}

export class DividendProjectionDto {
  annualExpected: number;
  monthlyExpected: number;
  currency: string;
  bySymbol: Array<{ symbol: string; amount: number }>;
}

export class DividendGoalDto {
  id: string;
  monthlyTarget: number;
  currentMonthly: number;
  progressPercentage: number;
}
