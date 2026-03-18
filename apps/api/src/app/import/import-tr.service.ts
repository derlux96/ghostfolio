import { TagService } from '@ghostfolio/api/services/tag/tag.service';
import { CreateOrderDto } from '@ghostfolio/common/dtos';

import { Injectable, Logger } from '@nestjs/common';
import { Type } from '@prisma/client';
import { isValid } from 'date-fns';

import {
  TrImportPreview,
  TrParsedTransaction,
  TrTransactionType,
  TrCsvRow
} from './import-tr.dto';
import { getCategoryForIsin } from './isin-category-mapping';

/**
 * Service for importing Trade Republic CSV exports
 *
 * Trade Republic CSV Format:
 * - Separator: semicolon (;)
 * - Date format: DD.MM.YYYY (German format)
 * - Decimal separator: comma (,) or dot (.)
 * - Headers: Datum;ISIN;Typ;Stücknummer;Stück;Währung;Kurs;Betrag;Gebühr;Summe
 */
@Injectable()
export class ImportTrService {
  private readonly logger = new Logger(ImportTrService.name);

  // Expected CSV headers from Trade Republic
  private readonly EXPECTED_HEADERS = [
    'Datum',
    'ISIN',
    'Typ',
    'Stücknummer',
    'Stück',
    'Währung',
    'Kurs',
    'Betrag',
    'Gebühr',
    'Summe'
  ];

  constructor(private readonly tagService: TagService) {}

  /**
   * Parse Trade Republic CSV and return preview
   */
  public async parseTrCsv(csvData: string): Promise<TrImportPreview> {
    const errors: Array<{
      row: number;
      message: string;
      rawRow?: string;
    }> = [];

    let rows: string[];
    try {
      // Normalize line endings and split
      const normalizedCsv = csvData.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      rows = normalizedCsv.trim().split('\n');
    } catch (error) {
      throw new Error('Failed to read CSV data');
    }

    if (rows.length < 2) {
      throw new Error('CSV file is empty or missing data');
    }

    // Parse header row
    const headerRow = rows[0].split(';').map((h) => h.trim());
    this.validateHeaders(headerRow);

    const activities: TrParsedTransaction[] = [];
    const summary = {
      totalActivities: 0,
      buyCount: 0,
      sellCount: 0,
      dividendCount: 0,
      savingsPlanCount: 0,
      depositCount: 0,
      withdrawalCount: 0,
      errorCount: 0
    };

    // Parse data rows
    for (let i = 1; i < rows.length; i++) {
      const rawRow = rows[i].trim();
      if (!rawRow) {
        continue; // Skip empty rows
      }

      try {
        const values = rawRow.split(';').map((v) => v.trim());
        const row: TrCsvRow = this.mapRowToObject(headerRow, values);
        const transaction = this.parseTransaction(row);

        if (transaction) {
          activities.push(transaction);
          this.updateSummary(summary, transaction.type);
        }
      } catch (error) {
        errors.push({
          row: i + 1,
          message: error.message,
          rawRow
        });
        summary.errorCount++;
      }
    }

    summary.totalActivities = activities.length;

    return {
      activities,
      errors,
      summary
    };
  }

  /**
   * Convert parsed TR transactions to Ghostfolio CreateOrderDto format
   */
  public async convertToGhostfolioOrders(
    transactions: TrParsedTransaction[],
    accountId?: string
  ): Promise<CreateOrderDto[]> {
    const orders: CreateOrderDto[] = [];
    const tags = await this.tagService.getTagsForUser(
      null // Will be set by the calling service
    );

    for (const transaction of transactions) {
      try {
        const order = await this.convertTransaction(
          transaction,
          accountId,
          tags
        );
        if (order) {
          orders.push(order);
        }
      } catch (error) {
        this.logger.error(
          `Failed to convert transaction ${transaction.referenceNumber}: ${error.message}`
        );
      }
    }

    return orders;
  }

  /**
   * Validate CSV headers
   */
  private validateHeaders(headers: string[]): void {
    const missingHeaders = this.EXPECTED_HEADERS.filter(
      (expected) => !headers.includes(expected)
    );

    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }
  }

  /**
   * Map CSV row values to object using headers
   */
  private mapRowToObject(headers: string[], values: string[]): TrCsvRow {
    const row: any = {};

    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = values[i] || '';
    }

    return row as TrCsvRow;
  }

  /**
   * Parse a single transaction row
   */
  private parseTransaction(row: TrCsvRow): TrParsedTransaction | null {
    // Parse date from German format (DD.MM.YYYY)
    const date = this.parseGermanDate(row.Datum);
    if (!date) {
      throw new Error(`Invalid date format: ${row.Datum}`);
    }

    // Validate ISIN
    const isin = row.ISIN.trim();
    if (!this.isValidIsin(isin)) {
      throw new Error(`Invalid ISIN: ${isin}`);
    }

    // Parse transaction type
    const type = this.parseTransactionType(row.Typ);

    // Skip deposits and withdrawals as they don't represent investment activities
    if (
      type === TrTransactionType.DEPOSIT ||
      type === TrTransactionType.WITHDRAWAL
    ) {
      return null;
    }

    // Parse numeric values (handle both comma and dot as decimal separator)
    const quantity = this.parseGermanNumber(row.Stück);
    const unitPrice = this.parseGermanNumber(row.Kurs);
    const amount = this.parseGermanNumber(row.Betrag);
    const fee = this.parseGermanNumber(row.Gebühr || '0');
    const total = this.parseGermanNumber(row.Summe);

    // Validate numeric values
    if (quantity < 0 || unitPrice < 0 || amount < 0 || fee < 0) {
      throw new Error('Negative values are not allowed');
    }

    return {
      date,
      isin,
      type,
      quantity,
      currency: row.Währung.trim(),
      unitPrice,
      amount,
      fee,
      total,
      referenceNumber: row.Stücknummer.trim()
    };
  }

  /**
   * Parse German date format (DD.MM.YYYY)
   */
  private parseGermanDate(dateString: string): Date | null {
    try {
      const parts = dateString.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        return null;
      }

      const date = new Date(year, month - 1, day);

      if (!isValid(date)) {
        return null;
      }

      return date;
    } catch {
      return null;
    }
  }

  /**
   * Parse German number format (handle comma and dot as decimal separator)
   */
  private parseGermanNumber(numberString: string): number {
    if (!numberString || numberString.trim() === '') {
      return 0;
    }

    // Replace comma with dot for decimal parsing
    const normalized = numberString.trim().replace(',', '.');
    const parsed = parseFloat(normalized);

    if (isNaN(parsed)) {
      throw new Error(`Invalid number format: ${numberString}`);
    }

    return parsed;
  }

  /**
   * Parse and validate TR transaction type
   */
  private parseTransactionType(typeString: string): TrTransactionType {
    const type = typeString.trim();

    switch (type) {
      case 'Kauf':
        return TrTransactionType.BUY;
      case 'Verkauf':
        return TrTransactionType.SELL;
      case 'Dividende':
        return TrTransactionType.DIVIDEND;
      case 'Sparplan':
        return TrTransactionType.SAVINGS_PLAN;
      case 'Einbuchung':
        return TrTransactionType.DEPOSIT;
      case 'Ausbuchung':
        return TrTransactionType.WITHDRAWAL;
      default:
        throw new Error(`Unknown transaction type: ${type}`);
    }
  }

  /**
   * Validate ISIN format
   */
  private isValidIsin(isin: string): boolean {
    // Basic ISIN validation: 12 characters, first 2 letters, rest alphanumeric
    const isinRegex = /^[A-Z]{2}[A-Z0-9]{10}$/;
    return isinRegex.test(isin);
  }

  /**
   * Update summary statistics
   */
  private updateSummary(summary: any, type: TrTransactionType): void {
    switch (type) {
      case TrTransactionType.BUY:
        summary.buyCount++;
        break;
      case TrTransactionType.SELL:
        summary.sellCount++;
        break;
      case TrTransactionType.DIVIDEND:
        summary.dividendCount++;
        break;
      case TrTransactionType.SAVINGS_PLAN:
        summary.savingsPlanCount++;
        break;
      case TrTransactionType.DEPOSIT:
        summary.depositCount++;
        break;
      case TrTransactionType.WITHDRAWAL:
        summary.withdrawalCount++;
        break;
    }
  }

  /**
   * Convert a single TR transaction to Ghostfolio order
   */
  private async convertTransaction(
    transaction: TrParsedTransaction,
    accountId: string | undefined,
    tags: Array<{ id: string; name: string }>
  ): Promise<CreateOrderDto | null> {
    // Map TR transaction type to Ghostfolio type
    let gfType: Type;

    switch (transaction.type) {
      case TrTransactionType.BUY:
      case TrTransactionType.SAVINGS_PLAN:
        gfType = Type.BUY;
        break;
      case TrTransactionType.SELL:
        gfType = Type.SELL;
        break;
      case TrTransactionType.DIVIDEND:
        gfType = Type.DIVIDEND;
        break;
      default:
        return null;
    }

    // Calculate unit price from total amount and quantity
    let unitPrice = transaction.unitPrice;
    let quantity = transaction.quantity;

    // For dividends, use the amount as unit price and set quantity to 0
    if (transaction.type === TrTransactionType.DIVIDEND) {
      unitPrice = transaction.amount;
      quantity = 0;
    }

    // Get category mapping for auto-tagging
    const categoryMapping = getCategoryForIsin(transaction.isin);
    let tagIds: string[] = [];

    if (categoryMapping) {
      const matchingTag = tags.find((t) => t.name === categoryMapping.tagName);
      if (matchingTag) {
        tagIds.push(matchingTag.id);
      }
    }

    // Format date as ISO string
    const date = transaction.date.toISOString();

    return {
      accountId,
      currency: transaction.currency,
      date,
      fee: transaction.fee,
      quantity,
      symbol: transaction.isin, // Use ISIN as symbol initially
      tags: tagIds.length > 0 ? tagIds : undefined,
      type: gfType,
      unitPrice,
      dataSource: undefined // Will be resolved by ImportService
    };
  }
}
