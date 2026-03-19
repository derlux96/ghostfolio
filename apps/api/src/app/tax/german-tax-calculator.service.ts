import { Injectable } from '@nestjs/common';
import { AssetSubClass } from '@prisma/client';
import { endOfYear, startOfDay, startOfYear } from 'date-fns';

/**
 * German Tax Calculation Service
 *
 * Implements German tax rules for investment income:
 * - Teilfreistellung (partial exemption): 30% for stocks, 15% for ETFs
 * - Vorabpauschale (anticipatory tax): for ETFs/funds when price > reference
 * - Abgeltungsteuer: 26.375% (including Soli)
 * - Kirchensteuer: 8-9% on Abgeltungsteuer (if applicable)
 */
@Injectable()
export class GermanTaxCalculatorService {
  // Tax rates
  private readonly ABGELTUNGSTEUER_RATE = 0.26375; // 26.375% (25% + 5.5% Soli on 25%)
  private readonly KIRCHENSTEUER_RATE = 0.08; // 8% (can be 9% in some states)
  private readonly KIRCHENSTEUER_RATE_ALT = 0.09; // 9% (alternative rate)

  // Teilfreistellung rates
  private readonly TEILFREISTELLUNG_STOCK = 0.3; // 30% for stocks
  private readonly TEILFREISTELLUNG_ETF = 0.15; // 15% for ETFs/funds

  // Vorabpauschale calculation
  private readonly VORABPAUSCHALE_BASIS_RATE = 0.7; // 70% of basis value
  private readonly VORABPAUSCHALE_SAFETY_MARGIN = 0.7; // 70% safety margin (for ETFs)
  private readonly VORABPAUSCHALE_THRESHOLD = 1000; // €1000 threshold

  /**
   * Calculate Teilfreistellung (partial exemption) rate based on asset class
   */
  getTeilfreistellungRate(assetSubClass: AssetSubClass | null): number {
    switch (assetSubClass) {
      case AssetSubClass.STOCK:
        return this.TEILFREISTELLUNG_STOCK;
      case AssetSubClass.ETF:
      case AssetSubClass.MUTUALFUND:
        return this.TEILFREISTELLUNG_ETF;
      default:
        return this.TEILFREISTELLUNG_STOCK; // Default to stock rate
    }
  }

  /**
   * Calculate taxable amount after Teilfreistellung
   */
  calculateTaxableAmount(
    amount: number,
    assetSubClass: AssetSubClass | null
  ): number {
    const teilfreistellungRate = this.getTeilfreistellungRate(assetSubClass);
    return amount * (1 - teilfreistellungRate);
  }

  /**
   * Calculate Abgeltungsteuer on taxable amount
   */
  calculateAbgeltungsteuer(taxableAmount: number): number {
    return taxableAmount * this.ABGELTUNGSTEUER_RATE;
  }

  /**
   * Calculate Kirchensteuer on Abgeltungsteuer (if applicable)
   */
  calculateKirchensteuer(
    abgeltungsteuer: number,
    hasKirchensteuer: boolean,
    rate: '8' | '9' = '8'
  ): number {
    if (!hasKirchensteuer) {
      return 0;
    }
    const kirchensteuerRate =
      rate === '9' ? this.KIRCHENSTEUER_RATE_ALT : this.KIRCHENSTEUER_RATE;
    return abgeltungsteuer * kirchensteuerRate;
  }

  /**
   * Calculate total tax on dividend
   */
  calculateDividendTax(
    dividendAmount: number,
    assetSubClass: AssetSubClass | null,
    hasKirchensteuer: boolean = false,
    kirchensteuerRate: '8' | '9' = '8'
  ): {
    amount: number;
    teilfreistellung: number;
    taxableAmount: number;
    abgeltungsteuer: number;
    kirchensteuer: number;
    totalTax: number;
  } {
    const teilfreistellungRate = this.getTeilfreistellungRate(assetSubClass);
    const teilfreistellung = dividendAmount * teilfreistellungRate;
    const taxableAmount = dividendAmount - teilfreistellung;
    const abgeltungsteuer = this.calculateAbgeltungsteuer(taxableAmount);
    const kirchensteuer = this.calculateKirchensteuer(
      abgeltungsteuer,
      hasKirchensteuer,
      kirchensteuerRate
    );
    const totalTax = abgeltungsteuer + kirchensteuer;

    return {
      amount: dividendAmount,
      teilfreistellung,
      taxableAmount,
      abgeltungsteuer,
      kirchensteuer,
      totalTax
    };
  }

  /**
   * Calculate tax on capital gains from stock sale
   *
   * Taxable gain = (sale price - purchase price - fees) * (1 - teilfreistellung)
   */
  calculateSaleTax(
    saleProceeds: number,
    purchasePrice: number,
    fees: number,
    assetSubClass: AssetSubClass | null,
    hasKirchensteuer: boolean = false,
    kirchensteuerRate: '8' | '9' = '8',
    holdingPeriodDays: number
  ): {
    gain: number;
    teilfreistellung: number;
    taxableGain: number;
    abgeltungsteuer: number;
    kirchensteuer: number;
    totalTax: number;
    isTaxFree: boolean;
  } {
    // Calculate gross gain
    const grossGain = saleProceeds - purchasePrice - fees;

    // Tax-free if holding period > 1 year (Spekulationsfrist)
    const isTaxFree = holdingPeriodDays > 365;

    if (isTaxFree || grossGain <= 0) {
      return {
        gain: grossGain,
        teilfreistellung: 0,
        taxableGain: 0,
        abgeltungsteuer: 0,
        kirchensteuer: 0,
        totalTax: 0,
        isTaxFree: true
      };
    }

    // Apply Teilfreistellung
    const teilfreistellungRate = this.getTeilfreistellungRate(assetSubClass);
    const teilfreistellung = grossGain * teilfreistellungRate;
    const taxableGain = grossGain - teilfreistellung;

    // Calculate Abgeltungsteuer
    const abgeltungsteuer = this.calculateAbgeltungsteuer(taxableGain);
    const kirchensteuer = this.calculateKirchensteuer(
      abgeltungsteuer,
      hasKirchensteuer,
      kirchensteuerRate
    );
    const totalTax = abgeltungsteuer + kirchensteuer;

    return {
      gain: grossGain,
      teilfreistellung,
      taxableGain,
      abgeltungsteuer,
      kirchensteuer,
      totalTax,
      isTaxFree: false
    };
  }

  /**
   * Calculate Vorabpauschale for an ETF/fund position
   *
   * Formula:
   * 1. Calculate basis value = previous year end value
   * 2. Calculate current value = shares * current price
   * 3. If current value > basis value:
   *    - Vorabpauschale = (current value - basis value) * 70% * basis rate
   *    - Apply Sparer-Pauschbetrag (€1000) per year per person
   */
  calculateVorabpauschale({
    previousYearEndValue,
    currentValue,
    shares: _shares,
    basisRate = 0.7,
    safetyMargin = true,
    hasKirchensteuer = false,
    kirchensteuerRate = '8'
  }: {
    previousYearEndValue: number;
    currentValue: number;
    shares: number;
    basisRate?: number;
    safetyMargin?: boolean;
    hasKirchensteuer?: boolean;
    kirchensteuerRate?: '8' | '9';
  }): {
    amount: number;
    taxableAmount: number;
    abgeltungsteuer: number;
    kirchensteuer: number;
    totalTax: number;
    exceedsThreshold: boolean;
  } {
    // Calculate gain
    const gain = currentValue - previousYearEndValue;

    // No Vorabpauschale if no gain
    if (gain <= 0) {
      return {
        amount: 0,
        taxableAmount: 0,
        abgeltungsteuer: 0,
        kirchensteuer: 0,
        totalTax: 0,
        exceedsThreshold: false
      };
    }

    // Apply safety margin (70%) for ETFs
    const safetyMarginMultiplier = safetyMargin
      ? this.VORABPAUSCHALE_SAFETY_MARGIN
      : 1;
    const vorabpauschaleBeforeThreshold =
      gain *
      this.VORABPAUSCHALE_BASIS_RATE *
      basisRate *
      safetyMarginMultiplier;

    // Apply Sparer-Pauschbetrag (€1000)
    const taxableAmount = Math.max(
      0,
      vorabpauschaleBeforeThreshold - this.VORABPAUSCHALE_THRESHOLD
    );
    const exceedsThreshold =
      vorabpauschaleBeforeThreshold > this.VORABPAUSCHALE_THRESHOLD;

    // Calculate tax (no Teilfreistellung on Vorabpauschale)
    const abgeltungsteuer = this.calculateAbgeltungsteuer(taxableAmount);
    const kirchensteuer = this.calculateKirchensteuer(
      abgeltungsteuer,
      hasKirchensteuer,
      kirchensteuerRate
    );
    const totalTax = abgeltungsteuer + kirchensteuer;

    return {
      amount: vorabpauschaleBeforeThreshold,
      taxableAmount,
      abgeltungsteuer,
      kirchensteuer,
      totalTax,
      exceedsThreshold
    };
  }

  /**
   * Calculate yearly tax summary for a user
   */
  calculateYearlyTaxSummary({
    dividends,
    sales,
    vorabpauschalen,
    year
  }: {
    dividends: Array<{
      amount: number;
      assetSubClass: AssetSubClass | null;
      date: Date;
    }>;
    sales: Array<{
      gain: number;
      assetSubClass: AssetSubClass | null;
      date: Date;
      holdingPeriodDays: number;
    }>;
    vorabpauschalen: Array<{
      amount: number;
      date: Date;
    }>;
    year: number;
  }) {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));

    // Filter by year
    const yearDividends = dividends.filter((d) => {
      const date = startOfDay(new Date(d.date));
      return date >= yearStart && date <= yearEnd;
    });

    const yearSales = sales.filter((s) => {
      const date = startOfDay(new Date(s.date));
      return date >= yearStart && date <= yearEnd;
    });

    const yearVorabpauschalen = vorabpauschalen.filter((v) => {
      const date = startOfDay(new Date(v.date));
      return date >= yearStart && date <= yearEnd;
    });

    // Calculate totals
    let totalDividends = 0;
    let totalDividendTax = 0;
    let totalTeilfreistellungDividends = 0;

    for (const dividend of yearDividends) {
      const taxCalc = this.calculateDividendTax(
        dividend.amount,
        dividend.assetSubClass
      );
      totalDividends += dividend.amount;
      totalDividendTax += taxCalc.totalTax;
      totalTeilfreistellungDividends += taxCalc.teilfreistellung;
    }

    let totalGains = 0;
    let totalGainTax = 0;
    let totalTeilfreistellungGains = 0;
    let taxFreeGains = 0;

    for (const sale of yearSales) {
      const taxCalc = this.calculateSaleTax(
        sale.gain + (sale.gain > 0 ? 0 : 0), // gain includes purchase adjustment
        0, // purchase price (already included in gain calculation)
        0, // fees (already included in gain calculation)
        sale.assetSubClass,
        false,
        '8',
        sale.holdingPeriodDays
      );
      totalGains += Math.max(0, taxCalc.gain);
      totalGainTax += taxCalc.totalTax;
      totalTeilfreistellungGains += taxCalc.teilfreistellung;
      if (taxCalc.isTaxFree) {
        taxFreeGains += Math.max(0, taxCalc.gain);
      }
    }

    const totalVorabpauschale = yearVorabpauschalen.reduce(
      (sum, v) => sum + v.amount,
      0
    );
    const vorabpauschaleTax = this.calculateAbgeltungsteuer(
      Math.max(0, totalVorabpauschale - this.VORABPAUSCHALE_THRESHOLD)
    );

    const totalTax = totalDividendTax + totalGainTax + vorabpauschaleTax;
    const totalTeilfreistellung =
      totalTeilfreistellungDividends + totalTeilfreistellungGains;

    return {
      year,
      dividends: {
        total: totalDividends,
        tax: totalDividendTax,
        teilfreistellung: totalTeilfreistellungDividends,
        count: yearDividends.length
      },
      sales: {
        totalGains,
        tax: totalGainTax,
        teilfreistellung: totalTeilfreistellungGains,
        taxFreeGains,
        count: yearSales.length
      },
      vorabpauschale: {
        total: totalVorabpauschale,
        tax: vorabpauschaleTax,
        count: yearVorabpauschalen.length
      },
      total: {
        tax: totalTax,
        teilfreistellung: totalTeilfreistellung
      }
    };
  }
}
