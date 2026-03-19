import { ImportResponse } from '@ghostfolio/common/interfaces/responses/import-response.interface';

import { IsArray, IsOptional, IsString } from 'class-validator';

/**
 * Trade Republic transaction types from their CSV export
 */
export enum TrTransactionType {
  BUY = 'Kauf',
  SELL = 'Verkauf',
  DIVIDEND = 'Dividende',
  SAVINGS_PLAN = 'Sparplan',
  DEPOSIT = 'Einbuchung',
  WITHDRAWAL = 'Ausbuchung'
}

/**
 * Raw Trade Republic CSV row structure
 * Format: Datum;ISIN;Typ;Stücknummer;Stück;Währung;Kurs;Betrag;Gebühr;Summe
 *
 * Example:
 * 01.01.2024;IE00B4L5Y983;Kauf;123456;10;EUR;100.00;1000.00;1.00;1001.00
 */
export interface TrCsvRow {
  /** Date in DD.MM.YYYY format (German format) */
  Datum: string;
  /** ISIN of the asset */
  ISIN: string;
  /** Transaction type (Kauf, Verkauf, Dividende, Sparplan, etc.) */
  Typ: string;
  /** Transaction/reference number */
  Stücknummer: string;
  /** Number of shares/units */
  Stück: string;
  /** Currency code */
  Währung: string;
  /** Price per unit */
  Kurs: string;
  /** Total amount */
  Betrag: string;
  /** Fee amount */
  Gebühr: string;
  /** Total sum (Betrag + Gebühr) */
  Summe: string;
}

/**
 * Parsed Trade Republic transaction
 */
export interface TrParsedTransaction {
  date: Date;
  isin: string;
  type: TrTransactionType;
  quantity: number;
  currency: string;
  unitPrice: number;
  amount: number;
  fee: number;
  total: number;
  referenceNumber?: string;
}

/**
 * Auto-categorization for an imported activity
 */
export interface TrActivityCategory {
  isin: string;
  category: string;
  tagName: string;
  suggestedTagId?: string;
}

/**
 * Request DTO for uploading a Trade Republic CSV file
 */
export class TrImportDto {
  @IsString()
  csvData: string;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

/**
 * Preview of parsed TR activities before import
 */
export interface TrImportPreview {
  activities: TrParsedTransaction[];
  errors: {
    row: number;
    message: string;
    rawRow?: string;
  }[];
  summary: {
    totalActivities: number;
    buyCount: number;
    sellCount: number;
    dividendCount: number;
    savingsPlanCount: number;
    depositCount: number;
    withdrawalCount: number;
    errorCount: number;
  };
}

/**
 * Response for TR import endpoint
 * Combines preview with actual imported activities
 */
export type TrImportResponse = Omit<TrImportPreview, 'activities'> &
  ImportResponse;
