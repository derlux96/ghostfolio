import { DataService } from '@ghostfolio/ui/services';

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface TaxSummary {
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

export interface TaxPosition {
  symbol: string;
  name: string;
  isin: string;
  dividends: TaxDividend[];
  sales: TaxSale[];
  vorabpauschalen: TaxVorabpauschale[];
  totals: {
    dividendTax: number;
    saleTax: number;
    vorabpauschaleTax: number;
    totalTax: number;
  };
  expanded?: boolean;
}

export interface TaxDividend {
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
}

export interface TaxSale {
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
}

export interface TaxVorabpauschale {
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

@Component({
  host: { class: 'page' },
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  selector: 'gf-tax-page',
  styleUrls: ['./tax-page.scss'],
  templateUrl: './tax-page.html'
})
export class GfTaxPageComponent implements OnInit {
  public summary: TaxSummary | null = null;
  public positions: TaxPosition[] = [];
  public isLoading = true;
  public selectedYear = new Date().getFullYear();
  public availableYears: number[] = [];

  // Displayed columns for tables
  public dividendDisplayedColumns: string[] = [
    'symbol',
    'date',
    'amount',
    'teilfreistellung',
    'taxableAmount',
    'abgeltungsteuer',
    'totalTax'
  ];
  public saleDisplayedColumns: string[] = [
    'symbol',
    'date',
    'gain',
    'isTaxFree',
    'teilfreistellung',
    'taxableGain',
    'abgeltungsteuer',
    'totalTax'
  ];

  private currentYear = new Date().getFullYear();

  public constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private dataService: DataService,
    private snackBar: MatSnackBar
  ) {
    // Generate available years (current year and 3 years back)
    for (let i = 0; i < 4; i++) {
      this.availableYears.push(this.currentYear - i);
    }
  }

  public ngOnInit(): void {
    this.loadData();
  }

  public onYearChange(): void {
    this.loadData();
  }

  public exportCsv(): void {
    this.dataService.fetchTaxExportCsv(this.selectedYear).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax-report-${this.selectedYear}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.snackBar.open('CSV export downloaded', 'Close', {
          duration: 2000
        });
      },
      error: () => {
        this.snackBar.open('Failed to export CSV', 'Close', {
          duration: 3000
        });
      }
    });
  }

  private loadData(): void {
    this.isLoading = true;

    this.dataService.fetchTaxSummary(this.selectedYear).subscribe({
      next: (data) => {
        this.summary = data as TaxSummary;
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load tax summary', 'Close', {
          duration: 3000
        });
        this.changeDetectorRef.markForCheck();
      }
    });

    this.dataService.fetchTaxPositions(this.selectedYear).subscribe({
      next: (data) => {
        this.positions = data as TaxPosition[];
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.snackBar.open('Failed to load tax positions', 'Close', {
          duration: 3000
        });
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  public get allDividends(): TaxDividend[] {
    const allDividends: TaxDividend[] = [];
    for (const position of this.positions) {
      allDividends.push(...position.dividends);
    }
    return allDividends;
  }

  public get allSales(): TaxSale[] {
    const allSales: TaxSale[] = [];
    for (const position of this.positions) {
      allSales.push(...position.sales);
    }
    return allSales;
  }

  public formatCurrency(value: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  public formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('de-DE');
  }

  public expandPosition(position: TaxPosition): void {
    position.expanded = !position.expanded;
  }
}
