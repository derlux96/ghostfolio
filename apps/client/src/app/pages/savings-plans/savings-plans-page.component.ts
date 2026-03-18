import { DataService } from '@ghostfolio/ui/services';

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface SavingsPlan {
  id: string;
  name: string;
  isin?: string;
  amount: number;
  interval: string;
  dayOfMonth: number;
  category?: string;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  accountId?: string;
  accountUserId?: string;
  account?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface SavingsPlanSummary {
  totalPlans: number;
  totalMonthly: number;
  byCategory: Record<string, number>;
  byInterval: Record<string, number>;
}

export interface SavingsPlanFormData {
  name: string;
  isin: string;
  amount: number;
  interval: string;
  dayOfMonth: number;
  category: string;
  isActive: boolean;
  startDate: string;
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
    MatDialogModule,
    MatChipsModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatMenuModule
  ],
  selector: 'gf-savings-plans-page',
  styleUrls: ['./savings-plans-page.scss'],
  templateUrl: './savings-plans-page.html'
})
export class GfSavingsPlansPageComponent implements OnInit {
  public savingsPlans: SavingsPlan[] = [];
  public summary: SavingsPlanSummary | null = null;
  public isLoading = true;
  public displayedColumns: string[] = [
    'name',
    'isin',
    'amount',
    'interval',
    'dayOfMonth',
    'category',
    'isActive',
    'actions'
  ];

  public categoryColors: Record<string, string> = {
    GOLD: '#FFD700',
    DIVIDEND: '#4CAF50',
    SPEC: '#FF5722',
    GROWTH: '#2196F3',
    RUSSIA: '#E91E63'
  };

  public filterCategory = 'ALL';
  public filterStatus = 'ALL';

  // Form state
  public showForm = false;
  public isEditing = false;
  public editingPlanId: string | null = null;
  public isSubmitting = false;

  public availableIntervals = [
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'QUARTERLY', label: 'Quarterly' },
    { value: 'YEARLY', label: 'Yearly' }
  ];

  public availableCategories = [
    { value: 'GOLD', label: 'Gold' },
    { value: 'DIVIDEND', label: 'Dividend' },
    { value: 'SPEC', label: 'Speculation' },
    { value: 'GROWTH', label: 'Growth' },
    { value: 'RUSSIA', label: 'Russia' }
  ];

  public formData: SavingsPlanFormData = {
    name: '',
    isin: '',
    amount: 0,
    interval: 'MONTHLY',
    dayOfMonth: 1,
    category: '',
    isActive: true,
    startDate: ''
  };

  public constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private dataService: DataService,
    private snackBar: MatSnackBar
  ) {}

  public ngOnInit(): void {
    this.loadData();
  }

  public get filteredPlans(): SavingsPlan[] {
    return this.savingsPlans.filter((plan) => {
      if (
        this.filterCategory !== 'ALL' &&
        plan.category !== this.filterCategory
      ) {
        return false;
      }
      if (this.filterStatus === 'ACTIVE' && !plan.isActive) {
        return false;
      }
      if (this.filterStatus === 'INACTIVE' && plan.isActive) {
        return false;
      }
      return true;
    });
  }

  public getCategoryColor(category?: string): string {
    return this.categoryColors[category || ''] || '#9E9E9E';
  }

  public getIntervalLabel(interval: string): string {
    const labels: Record<string, string> = {
      DAILY: 'Daily',
      WEEKLY: 'Weekly',
      MONTHLY: 'Monthly',
      QUARTERLY: 'Quarterly',
      YEARLY: 'Yearly'
    };
    return labels[interval] || interval;
  }

  public getPlansForDay(day: number): SavingsPlan[] {
    return this.filteredPlans.filter(
      (plan) =>
        plan.isActive && plan.interval === 'MONTHLY' && plan.dayOfMonth === day
    );
  }

  public toggleActive(plan: SavingsPlan): void {
    this.dataService
      .updateSavingsPlan(plan.id, { isActive: !plan.isActive })
      .subscribe({
        next: () => {
          plan.isActive = !plan.isActive;
          this.snackBar.open(
            `${plan.name} ${plan.isActive ? 'activated' : 'deactivated'}`,
            'Close',
            { duration: 2000 }
          );
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  public deletePlan(plan: SavingsPlan): void {
    if (confirm(`Delete savings plan "${plan.name}"?`)) {
      this.dataService.deleteSavingsPlan(plan.id).subscribe({
        next: () => {
          this.savingsPlans = this.savingsPlans.filter((p) => p.id !== plan.id);
          this.snackBar.open(`${plan.name} deleted`, 'Close', {
            duration: 2000
          });
          this.changeDetectorRef.markForCheck();
        }
      });
    }
  }

  // Create/Edit form methods

  public openCreateForm(): void {
    this.resetForm();
    this.isEditing = false;
    this.editingPlanId = null;
    this.showForm = true;
    this.changeDetectorRef.markForCheck();
  }

  public openEditForm(plan: SavingsPlan): void {
    this.isEditing = true;
    this.editingPlanId = plan.id;
    this.formData = {
      name: plan.name,
      isin: plan.isin || '',
      amount: plan.amount,
      interval: plan.interval,
      dayOfMonth: plan.dayOfMonth,
      category: plan.category || '',
      isActive: plan.isActive,
      startDate: plan.startDate ? plan.startDate.split('T')[0] : ''
    };
    this.showForm = true;
    this.changeDetectorRef.markForCheck();
  }

  public closeForm(): void {
    this.showForm = false;
    this.resetForm();
    this.changeDetectorRef.markForCheck();
  }

  public onSubmit(): void {
    if (!this.formData.name || this.formData.amount <= 0) {
      this.snackBar.open('Name and valid amount are required', 'Close', {
        duration: 3000
      });
      return;
    }

    const payload: any = {
      name: this.formData.name,
      isin: this.formData.isin || undefined,
      amount: this.formData.amount,
      interval: this.formData.interval,
      dayOfMonth: this.formData.dayOfMonth,
      category: this.formData.category || undefined,
      isActive: this.formData.isActive,
      startDate: this.formData.startDate || undefined
    };

    this.isSubmitting = true;

    if (this.isEditing && this.editingPlanId) {
      this.dataService
        .updateSavingsPlan(this.editingPlanId, payload)
        .subscribe({
          next: () => {
            this.snackBar.open('Savings plan updated', 'Close', {
              duration: 2000
            });
            this.isSubmitting = false;
            this.closeForm();
            this.loadData();
          },
          error: () => {
            this.snackBar.open('Failed to update savings plan', 'Close', {
              duration: 3000
            });
            this.isSubmitting = false;
            this.changeDetectorRef.markForCheck();
          }
        });
    } else {
      this.dataService.createSavingsPlan(payload).subscribe({
        next: () => {
          this.snackBar.open('Savings plan created', 'Close', {
            duration: 2000
          });
          this.isSubmitting = false;
          this.closeForm();
          this.loadData();
        },
        error: () => {
          this.snackBar.open('Failed to create savings plan', 'Close', {
            duration: 3000
          });
          this.isSubmitting = false;
          this.changeDetectorRef.markForCheck();
        }
      });
    }
  }

  private resetForm(): void {
    this.formData = {
      name: '',
      isin: '',
      amount: 0,
      interval: 'MONTHLY',
      dayOfMonth: 1,
      category: '',
      isActive: true,
      startDate: ''
    };
    this.isSubmitting = false;
  }

  private loadData(): void {
    this.isLoading = true;
    this.dataService.fetchSavingsPlans().subscribe({
      next: (data) => {
        this.savingsPlans = data as SavingsPlan[];
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load savings plans', 'Close', {
          duration: 3000
        });
        this.changeDetectorRef.markForCheck();
      }
    });

    this.dataService.fetchSavingsPlanSummary().subscribe({
      next: (data) => {
        this.summary = data as SavingsPlanSummary;
        this.changeDetectorRef.markForCheck();
      }
    });
  }
}
