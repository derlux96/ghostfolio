import { PrismaService } from '@ghostfolio/api/services/prisma/prisma.service';

import { Injectable } from '@nestjs/common';
import { format, startOfYear, subMonths } from 'date-fns';
import { groupBy } from 'lodash';

import {
  DividendCalendarDto,
  DividendDashboardDto,
  DividendGoalDto,
  DividendHoldingDto,
  DividendProjectionDto
} from './dividend.dto';

@Injectable()
export class DividendService {
  constructor(private readonly prismaService: PrismaService) {}

  async getDividendGoal(userId: string): Promise<DividendGoalDto> {
    const goal = await this.prismaService.dividendGoal.findFirst({
      where: { userId }
    });

    const monthlyTarget = goal?.monthlyTarget || 3000;

    // Calculate current monthly dividend average
    const currentMonthly = await this.calculateCurrentMonthlyAverage(userId);

    return {
      id: goal?.id || '',
      monthlyTarget,
      currentMonthly,
      progressPercentage: (currentMonthly / monthlyTarget) * 100
    };
  }

  async setDividendGoal(userId: string, monthlyTarget: number) {
    const existing = await this.prismaService.dividendGoal.findFirst({
      where: { userId }
    });

    if (existing) {
      return this.prismaService.dividendGoal.update({
        where: { id: existing.id },
        data: { monthlyTarget }
      });
    }

    return this.prismaService.dividendGoal.create({
      data: { userId, monthlyTarget }
    });
  }

  async getDividendDashboard(
    userId: string,
    userCurrency: string
  ): Promise<DividendDashboardDto> {
    const yearStart = startOfYear(new Date());

    // Get all dividend activities
    const activities = await this.prismaService.order.findMany({
      where: {
        userId,
        type: 'DIVIDEND'
      },
      include: {
        SymbolProfile: true
      },
      orderBy: { date: 'asc' }
    });

    // Calculate totals (quantity * unitPrice = dividend amount)
    let totalAllTime = 0;
    let totalYtd = 0;
    const monthlyMap = new Map<string, number>();

    for (const activity of activities) {
      const amount = activity.quantity * activity.unitPrice;
      totalAllTime += amount;

      if (new Date(activity.date) >= yearStart) {
        totalYtd += amount;
      }

      const monthKey = `${format(activity.date, 'yyyy-MM')}`;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + amount);
    }

    // Calculate average monthly
    const uniqueMonths = monthlyMap.size || 1;
    const averageMonthly = totalAllTime / uniqueMonths;

    // Annual projection (based on last 3 months average or current year trend)
    const recentMonths = Array.from(monthlyMap.entries()).sort().slice(-3);
    const recentAverage =
      recentMonths.length > 0
        ? recentMonths.reduce((sum, [, val]) => sum + val, 0) /
          recentMonths.length
        : averageMonthly;
    const annualProjection = recentAverage * 12;

    // Get monthly data for chart
    const monthlyData = Array.from(monthlyMap.entries())
      .map(([key, amount]) => {
        const [year, month] = key.split('-');
        return {
          month,
          year: parseInt(year),
          amount
        };
      })
      .sort((a, b) => a.year - b.year || a.month.localeCompare(b.month));

    // Get top holdings by dividend yield
    const topHoldings = await this.getTopDividendHoldings(userId);

    return {
      totalYtd,
      totalAllTime,
      averageMonthly,
      annualProjection,
      currency: userCurrency,
      monthlyData,
      topHoldings
    };
  }

  async getDividendProjection(
    userId: string,
    userCurrency: string
  ): Promise<DividendProjectionDto> {
    // Get current holdings with positions
    const activities = await this.prismaService.order.findMany({
      where: {
        userId,
        type: { in: ['BUY', 'DIVIDEND'] }
      },
      include: {
        SymbolProfile: true
      },
      orderBy: { date: 'asc' }
    });

    // Calculate current positions
    const positions = new Map<string, number>();
    const symbolData = new Map<
      string,
      { name: string; isin: string; yield: number }
    >();

    for (const activity of activities) {
      const symbol = activity.SymbolProfile?.symbol || '';
      if (!symbol) continue;

      if (activity.type === 'BUY') {
        positions.set(symbol, (positions.get(symbol) || 0) + activity.quantity);
      }

      if (!symbolData.has(symbol) && activity.SymbolProfile) {
        symbolData.set(symbol, {
          name: activity.SymbolProfile.name || symbol,
          isin: activity.SymbolProfile.isin || '',
          yield: 0
        });
      }
    }

    // Calculate annual dividend from historical data
    const bySymbol: Array<{ symbol: string; amount: number }> = [];
    let totalAnnualExpected = 0;

    const lastYearDate = subMonths(new Date(), 12);
    const dividendsLastYear = activities.filter(
      (a) => a.type === 'DIVIDEND' && new Date(a.date) >= lastYearDate
    );

    const dividendsBySymbol = groupBy(
      dividendsLastYear,
      (d) => d.SymbolProfile?.symbol || ''
    );

    for (const [symbol, dividends] of Object.entries(dividendsBySymbol)) {
      const symbolTotal = dividends.reduce(
        (sum, d) => sum + d.quantity * d.unitPrice,
        0
      );
      bySymbol.push({ symbol, amount: symbolTotal });
      totalAnnualExpected += symbolTotal;
    }

    return {
      annualExpected: totalAnnualExpected,
      monthlyExpected: totalAnnualExpected / 12,
      currency: userCurrency,
      bySymbol: bySymbol.sort((a, b) => b.amount - a.amount)
    };
  }

  async getDividendCalendar(
    userId: string,
    year: number
  ): Promise<DividendCalendarDto[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const activities = await this.prismaService.order.findMany({
      where: {
        userId,
        type: 'DIVIDEND',
        date: { gte: startDate, lte: endDate }
      },
      include: {
        SymbolProfile: true
      },
      orderBy: { date: 'asc' }
    });

    const calendarMap = new Map<number, number>();

    for (const activity of activities) {
      const month = new Date(activity.date).getMonth();
      const amount = activity.quantity * activity.unitPrice;
      calendarMap.set(month, (calendarMap.get(month) || 0) + amount);
    }

    return Array.from(calendarMap.entries()).map(([month, amount]) => ({
      month,
      year,
      amount,
      currency: 'EUR'
    }));
  }

  private async calculateCurrentMonthlyAverage(
    userId: string
  ): Promise<number> {
    const threeMonthsAgo = subMonths(new Date(), 3);

    const activities = await this.prismaService.order.findMany({
      where: {
        userId,
        type: 'DIVIDEND',
        date: { gte: threeMonthsAgo }
      }
    });

    if (activities.length === 0) {
      return 0;
    }

    const total = activities.reduce(
      (sum, a) => sum + a.quantity * a.unitPrice,
      0
    );

    return total / 3; // Average per month over 3 months
  }

  private async getTopDividendHoldings(
    userId: string
  ): Promise<DividendHoldingDto[]> {
    // Get BUY activities to calculate current holdings
    const buyActivities = await this.prismaService.order.findMany({
      where: {
        userId,
        type: 'BUY'
      },
      include: {
        SymbolProfile: true
      },
      orderBy: { date: 'asc' }
    });

    // Calculate positions
    const positions = new Map<string, number>();
    for (const activity of buyActivities) {
      const symbol = activity.SymbolProfile?.symbol || '';
      if (!symbol) continue;
      positions.set(symbol, (positions.get(symbol) || 0) + activity.quantity);
    }

    // Get dividend history for each position
    const lastYearDate = subMonths(new Date(), 12);
    const dividendActivities = await this.prismaService.order.findMany({
      where: {
        userId,
        type: 'DIVIDEND',
        date: { gte: lastYearDate }
      },
      include: {
        SymbolProfile: true
      }
    });

    const dividendBySymbol = groupBy(
      dividendActivities,
      (d) => d.SymbolProfile?.symbol || ''
    );

    const holdings: DividendHoldingDto[] = [];

    for (const [symbol, quantity] of positions.entries()) {
      if (quantity <= 0) continue;

      const dividends = dividendBySymbol[symbol] || [];
      const totalDividends = dividends.reduce(
        (sum, d) => sum + d.quantity * d.unitPrice,
        0
      );

      if (totalDividends > 0) {
        const symbolInfo = dividends[0]?.SymbolProfile;
        holdings.push({
          symbol,
          name: symbolInfo?.name || symbol,
          isin: symbolInfo?.isin || '',
          amount: totalDividends,
          yield: (totalDividends / quantity) * 100, // Approximate yield
          currency: 'EUR'
        });
      }
    }

    return holdings.sort((a, b) => b.amount - a.amount).slice(0, 10);
  }
}
