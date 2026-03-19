import { PrismaService } from '@ghostfolio/api/services/prisma/prisma.service';

import { Injectable } from '@nestjs/common';
import { AssetSubClass } from '@prisma/client';
import { format, startOfYear } from 'date-fns';
import { groupBy } from 'lodash';

import { GermanTaxCalculatorService } from './german-tax-calculator.service';
import {
  TaxDividendDto,
  TaxExportDto,
  TaxPositionDetailsDto,
  TaxSaleDto,
  TaxSummaryDto
} from './tax.dto';

@Injectable()
export class TaxService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly taxCalculator: GermanTaxCalculatorService
  ) {}

  /**
   * Get tax summary for a specific year
   */
  async getTaxSummary(userId: string, year?: number): Promise<TaxSummaryDto> {
    const taxYear = year || new Date().getFullYear();

    // Get all dividend activities
    const dividends = await this.prismaService.order.findMany({
      where: {
        userId,
        type: 'DIVIDEND'
      },
      include: {
        SymbolProfile: true
      },
      orderBy: { date: 'asc' }
    });

    // Get all SELL activities
    const sales = await this.prismaService.order.findMany({
      where: {
        userId,
        type: 'SELL'
      },
      include: {
        SymbolProfile: true
      },
      orderBy: { date: 'asc' }
    });

    // Get all BUY activities for calculating holding periods
    const buys = await this.prismaService.order.findMany({
      where: {
        userId,
        type: 'BUY'
      },
      include: {
        SymbolProfile: true
      },
      orderBy: { date: 'asc' }
    });

    // Transform dividends for tax calculation
    const dividendData = dividends.map((d) => ({
      amount: Math.abs(d.quantity * d.unitPrice),
      assetSubClass: d.SymbolProfile?.assetSubClass ?? null,
      date: new Date(d.date)
    }));

    // Calculate sales with holding periods
    const saleData = await this.calculateSaleGainsWithHoldingPeriods(
      sales,
      buys
    );

    // Vorabpauschale would be calculated separately based on ETF positions
    // For now, we'll use an empty array
    const vorabpauschalen: Array<{ amount: number; date: Date }> = [];

    return this.taxCalculator.calculateYearlyTaxSummary({
      dividends: dividendData,
      sales: saleData,
      vorabpauschalen,
      year: taxYear
    });
  }

  /**
   * Get tax details per position for a specific year
   */
  async getTaxPositions(
    userId: string,
    year?: number
  ): Promise<TaxPositionDetailsDto[]> {
    const taxYear = year || new Date().getFullYear();
    const yearStart = startOfYear(new Date(taxYear, 0, 1));
    const yearEnd = new Date(taxYear, 11, 31, 23, 59, 59);

    // Get all activities for the year
    const activities = await this.prismaService.order.findMany({
      where: {
        userId,
        date: { gte: yearStart, lte: yearEnd },
        type: { in: ['DIVIDEND', 'SELL'] }
      },
      include: {
        SymbolProfile: true
      },
      orderBy: { date: 'asc' }
    });

    // Get all BUY activities for holding period calculation
    const allBuys = await this.prismaService.order.findMany({
      where: {
        userId,
        type: 'BUY'
      },
      include: {
        SymbolProfile: true
      },
      orderBy: { date: 'asc' }
    });

    // Group by symbol
    const bySymbol = groupBy(activities, (a) => a.SymbolProfile?.symbol || '');

    const positions: TaxPositionDetailsDto[] = [];

    for (const [symbol, symbolActivities] of Object.entries(bySymbol)) {
      if (!symbol) continue;

      const symbolProfile = symbolActivities[0]?.SymbolProfile;
      if (!symbolProfile) continue;

      // Process dividends
      const dividendActivities = symbolActivities.filter(
        (a) => a.type === 'DIVIDEND'
      );
      const dividends: TaxDividendDto[] = [];

      for (const dividend of dividendActivities) {
        const amount = Math.abs(dividend.quantity * dividend.unitPrice);
        const taxCalc = this.taxCalculator.calculateDividendTax(
          amount,
          symbolProfile.assetSubClass
        );

        dividends.push({
          symbol,
          name: symbolProfile.name || symbol,
          isin: symbolProfile.isin || '',
          date: new Date(dividend.date),
          amount,
          teilfreistellung: taxCalc.teilfreistellung,
          taxableAmount: taxCalc.taxableAmount,
          abgeltungsteuer: taxCalc.abgeltungsteuer,
          kirchensteuer: taxCalc.kirchensteuer,
          totalTax: taxCalc.totalTax,
          assetSubClass: symbolProfile.assetSubClass
        });
      }

      // Process sales
      const saleActivities = symbolActivities.filter((a) => a.type === 'SELL');
      const sales: TaxSaleDto[] = [];

      for (const sale of saleActivities) {
        const saleGainCalc = await this.calculateSaleGain(sale, allBuys);
        if (!saleGainCalc) continue;

        const taxCalc = this.taxCalculator.calculateSaleTax(
          saleGainCalc.proceeds,
          saleGainCalc.purchasePrice,
          sale.fee,
          symbolProfile.assetSubClass,
          false,
          '8',
          saleGainCalc.holdingPeriodDays
        );

        sales.push({
          symbol,
          name: symbolProfile.name || symbol,
          isin: symbolProfile.isin || '',
          date: new Date(sale.date),
          gain: taxCalc.gain,
          teilfreistellung: taxCalc.teilfreistellung,
          taxableGain: taxCalc.taxableGain,
          abgeltungsteuer: taxCalc.abgeltungsteuer,
          kirchensteuer: taxCalc.kirchensteuer,
          totalTax: taxCalc.totalTax,
          isTaxFree: taxCalc.isTaxFree,
          assetSubClass: symbolProfile.assetSubClass
        });
      }

      // Calculate totals
      const dividendTax = dividends.reduce((sum, d) => sum + d.totalTax, 0);
      const saleTax = sales.reduce((sum, s) => sum + s.totalTax, 0);

      positions.push({
        symbol,
        name: symbolProfile.name || symbol,
        isin: symbolProfile.isin || '',
        assetSubClass: symbolProfile.assetSubClass,
        dividends,
        sales,
        vorabpauschalen: [],
        totals: {
          dividendTax,
          saleTax,
          vorabpauschaleTax: 0,
          totalTax: dividendTax + saleTax
        }
      });
    }

    return positions.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }

  /**
   * Export tax data as CSV
   */
  async exportTaxCsv(userId: string, year?: number): Promise<string> {
    const taxYear = year || new Date().getFullYear();
    const positions = await this.getTaxPositions(userId, taxYear);

    const lines: string[] = [];

    // Header
    lines.push(
      'Typ,Symbol,Name,ISIN,Datum,Betrag (€),Teilfreistellung (€),Steuerbar (€),Abgeltungsteuer (€),Kirchensteuer (€),Gesamtsteuer (€)'
    );

    // Dividends
    for (const position of positions) {
      for (const dividend of position.dividends) {
        lines.push(
          [
            'DIVIDENDE',
            dividend.symbol,
            `"${dividend.name}"`,
            dividend.isin,
            format(dividend.date, 'yyyy-MM-dd'),
            dividend.amount.toFixed(2),
            dividend.teilfreistellung.toFixed(2),
            dividend.taxableAmount.toFixed(2),
            dividend.abgeltungsteuer.toFixed(2),
            dividend.kirchensteuer.toFixed(2),
            dividend.totalTax.toFixed(2)
          ].join(',')
        );
      }
    }

    // Sales
    for (const position of positions) {
      for (const sale of position.sales) {
        lines.push(
          [
            sale.isTaxFree ? 'VERKAUF (STEUEERFREI)' : 'VERKAUF',
            sale.symbol,
            `"${sale.name}"`,
            sale.isin,
            format(sale.date, 'yyyy-MM-dd'),
            sale.gain.toFixed(2),
            sale.teilfreistellung.toFixed(2),
            sale.taxableGain.toFixed(2),
            sale.abgeltungsteuer.toFixed(2),
            sale.kirchensteuer.toFixed(2),
            sale.totalTax.toFixed(2)
          ].join(',')
        );
      }
    }

    return lines.join('\n');
  }

  /**
   * Export tax data as a complete DTO
   */
  async exportTaxData(userId: string, year?: number): Promise<TaxExportDto> {
    const taxYear = year || new Date().getFullYear();
    const [summary, positions] = await Promise.all([
      this.getTaxSummary(userId, taxYear),
      this.getTaxPositions(userId, taxYear)
    ]);

    return {
      year: taxYear,
      currency: 'EUR',
      generatedAt: new Date(),
      summary,
      positions
    };
  }

  /**
   * Calculate sale gains with holding periods using FIFO
   */
  private async calculateSaleGainsWithHoldingPeriods(
    sales: Array<{
      date: Date;
      quantity: number;
      unitPrice: number;
      fee: number;
      SymbolProfile: {
        symbol: string;
        assetSubClass: AssetSubClass | null;
      } | null;
    }>,
    buys: Array<{
      date: Date;
      quantity: number;
      unitPrice: number;
      SymbolProfile: { symbol: string } | null;
    }>
  ): Promise<
    Array<{
      gain: number;
      assetSubClass: AssetSubClass | null;
      date: Date;
      holdingPeriodDays: number;
    }>
  > {
    const result: Array<{
      gain: number;
      assetSubClass: AssetSubClass | null;
      date: Date;
      holdingPeriodDays: number;
    }> = [];

    // Group buys by symbol for FIFO calculation
    const buysBySymbol = groupBy(buys, (b) => b.SymbolProfile?.symbol || '');

    for (const sale of sales) {
      const symbol = sale.SymbolProfile?.symbol;
      if (!symbol) continue;

      const symbolBuys = buysBySymbol[symbol] || [];
      const remainingQuantity = Math.abs(sale.quantity);

      // Find FIFO purchases
      let quantityToMatch = remainingQuantity;
      let weightedAveragePrice = 0;
      let totalMatchedQuantity = 0;
      let oldestPurchaseDate: Date | null = null;

      for (const buy of symbolBuys) {
        if (quantityToMatch <= 0) break;

        const matchedQuantity = Math.min(quantityToMatch, buy.quantity);
        weightedAveragePrice =
          (weightedAveragePrice * totalMatchedQuantity +
            matchedQuantity * buy.unitPrice) /
          (totalMatchedQuantity + matchedQuantity);
        totalMatchedQuantity += matchedQuantity;
        quantityToMatch -= matchedQuantity;

        if (!oldestPurchaseDate || buy.date < oldestPurchaseDate) {
          oldestPurchaseDate = new Date(buy.date);
        }
      }

      if (totalMatchedQuantity > 0 && oldestPurchaseDate) {
        const proceeds = Math.abs(sale.quantity * sale.unitPrice);
        const purchasePrice = totalMatchedQuantity * weightedAveragePrice;
        const gain = proceeds - purchasePrice - sale.fee;
        const holdingPeriodDays = Math.floor(
          (new Date(sale.date).getTime() - oldestPurchaseDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        result.push({
          gain,
          assetSubClass: sale.SymbolProfile?.assetSubClass ?? null,
          date: new Date(sale.date),
          holdingPeriodDays
        });
      }
    }

    return result;
  }

  /**
   * Calculate gain for a single sale
   */
  private async calculateSaleGain(
    sale: {
      date: Date;
      quantity: number;
      unitPrice: number;
      fee: number;
      SymbolProfile: { symbol: string } | null;
    },
    buys: Array<{
      date: Date;
      quantity: number;
      unitPrice: number;
      SymbolProfile: { symbol: string } | null;
    }>
  ): Promise<{
    proceeds: number;
    purchasePrice: number;
    holdingPeriodDays: number;
  } | null> {
    const symbol = sale.SymbolProfile?.symbol;
    if (!symbol) return null;

    const symbolBuys = buys.filter((b) => b.SymbolProfile?.symbol === symbol);

    const remainingQuantity = Math.abs(sale.quantity);
    let quantityToMatch = remainingQuantity;
    let weightedAveragePrice = 0;
    let totalMatchedQuantity = 0;
    let oldestPurchaseDate: Date | null = null;

    for (const buy of symbolBuys) {
      if (quantityToMatch <= 0) break;

      const matchedQuantity = Math.min(quantityToMatch, buy.quantity);
      weightedAveragePrice =
        (weightedAveragePrice * totalMatchedQuantity +
          matchedQuantity * buy.unitPrice) /
          (totalMatchedQuantity + matchedQuantity) || buy.unitPrice;
      totalMatchedQuantity += matchedQuantity;
      quantityToMatch -= matchedQuantity;

      if (!oldestPurchaseDate || buy.date < oldestPurchaseDate) {
        oldestPurchaseDate = new Date(buy.date);
      }
    }

    if (totalMatchedQuantity > 0 && oldestPurchaseDate) {
      const proceeds = Math.abs(sale.quantity * sale.unitPrice);
      const purchasePrice = totalMatchedQuantity * weightedAveragePrice;
      const holdingPeriodDays = Math.floor(
        (new Date(sale.date).getTime() - oldestPurchaseDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return {
        proceeds,
        purchasePrice,
        holdingPeriodDays
      };
    }

    return null;
  }
}
