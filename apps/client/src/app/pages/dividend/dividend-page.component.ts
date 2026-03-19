import { DataService } from '@ghostfolio/ui/services';

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface DividendDashboard {
  totalYtd: number;
  totalAllTime: number;
  averageMonthly: number;
  annualProjection: number;
  currency: string;
  monthlyData: Array<{ month: string; year: number; amount: number }>;
  topHoldings: Array<{
    symbol: string;
    name: string;
    isin: string;
    amount: number;
    yield: number;
    currency: string;
  }>;
}

export interface DividendGoal {
  id: string;
  monthlyTarget: number;
  currentMonthly: number;
  progressPercentage: number;
}

export interface MonthlyData {
  month: string;
  year: number;
  amount: number;
  monthName: string;
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
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  selector: 'gf-dividend-page',
  styleUrls: ['./dividend-page.scss'],
  templateUrl: './dividend-page.html'
})
export class GfDividendPageComponent implements OnInit {
  public dashboard: DividendDashboard | null = null;
  public goal: DividendGoal | null = null;
  public isLoading = true;
  public displayedColumns: string[] = ['symbol', 'name', 'amount', 'yield'];

  // Goal editing
  public isEditingGoal = false;
  public newGoalTarget = 3000;
  public isSubmittingGoal = false;

  private monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];

  public constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private dataService: DataService,
    private snackBar: MatSnackBar
  ) {}

  public ngOnInit(): void {
    this.loadData();
  }

  public get monthlyData(): MonthlyData[] {
    if (!this.dashboard?.monthlyData) {
      return [];
    }
    return this.dashboard.monthlyData.map((d) => ({
      ...d,
      monthName: this.monthNames[parseInt(d.month, 10) - 1]
    }));
  }

  public get progressColor(): string {
    if (!this.goal) {
      return '#4CAF50';
    }
    const pct = this.goal.progressPercentage;
    if (pct >= 100) return '#4CAF50';
    if (pct >= 75) return '#8BC34A';
    if (pct >= 50) return '#FFC107';
    if (pct >= 25) return '#FF9800';
    return '#F44336';
  }

  public getMaxMonthlyAmount(): number {
    if (!this.dashboard?.monthlyData?.length) {
      return 1;
    }
    return Math.max(...this.dashboard.monthlyData.map((d) => d.amount));
  }

  public editGoal(): void {
    this.newGoalTarget = this.goal?.monthlyTarget || 3000;
    this.isEditingGoal = true;
    this.changeDetectorRef.markForCheck();
  }

  public cancelEditGoal(): void {
    this.isEditingGoal = false;
    this.changeDetectorRef.markForCheck();
  }

  public saveGoal(): void {
    if (this.newGoalTarget <= 0) {
      this.snackBar.open('Goal must be greater than 0', 'Close', {
        duration: 3000
      });
      return;
    }

    this.isSubmittingGoal = true;
    this.dataService.postDividendGoal(this.newGoalTarget).subscribe({
      next: () => {
        this.snackBar.open('Dividend goal updated', 'Close', {
          duration: 2000
        });
        this.isEditingGoal = false;
        this.isSubmittingGoal = false;
        this.loadGoal();
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.snackBar.open('Failed to update dividend goal', 'Close', {
          duration: 3000
        });
        this.isSubmittingGoal = false;
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  private loadData(): void {
    this.isLoading = true;

    this.dataService.fetchDividendDashboard().subscribe({
      next: (data) => {
        this.dashboard = data as DividendDashboard;
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load dividend data', 'Close', {
          duration: 3000
        });
        this.changeDetectorRef.markForCheck();
      }
    });

    this.loadGoal();
  }

  private loadGoal(): void {
    this.dataService.fetchDividendGoal().subscribe({
      next: (data) => {
        this.goal = data as DividendGoal;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.changeDetectorRef.markForCheck();
      }
    });
  }
}
