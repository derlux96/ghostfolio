import type {
  SubnetData,
  SubnetAnalyticsSummary
} from '@ghostfolio/common/interfaces';
import { DataService } from '@ghostfolio/ui/services';

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

interface SubnetRow extends SubnetData {
  name: string;
}

@Component({
  selector: 'gf-subnet-analytics-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatProgressBarModule,
    MatTableModule,
    MatSortModule,
    MatTabsModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./subnet-analytics-page.scss'],
  templateUrl: './subnet-analytics-page.html'
})
export class GfSubnetAnalyticsPageComponent implements OnInit {
  @ViewChild(MatSort) sort: MatSort;

  public isLoading = true;
  public error: string | null = null;
  public subnets: SubnetRow[] = [];
  public filteredSubnets: SubnetRow[] = [];
  public summary: SubnetAnalyticsSummary | null = null;

  public displayedColumns: string[] = [
    'rank',
    'name',
    'emission',
    'taoFlow',
    'netFlow1d',
    'netFlow7d',
    'netFlow30d',
    'activeKeys',
    'tokenPrice'
  ];

  public activeTab = 0;
  public filterText = '';
  public sortBy = 'emission';

  public constructor(
    private readonly dataService: DataService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.loadData();
  }

  public loadData(): void {
    this.isLoading = true;
    this.error = null;
    this.changeDetectorRef.markForCheck();

    this.dataService.fetchSubnets().subscribe({
      next: (response: any) => {
        if (response?.subnets) {
          this.subnets = response.subnets.map((s: SubnetData) => ({
            ...s,
            name: s.metadata?.name ?? `Subnet ${s.netuid}`
          }));
          this.summary = response.summary;
          this.applyFilter();
        }
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: (err) => {
        this.error = err?.message || 'Failed to load subnet data';
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  public applyFilter(): void {
    let result = [...this.subnets];

    if (this.filterText) {
      const lower = this.filterText.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          s.netuid.toString().includes(lower) ||
          s.modality?.toLowerCase().includes(lower)
      );
    }

    result.sort((a, b) => {
      const key = this.sortBy as keyof SubnetData;
      const aVal = typeof a[key] === 'number' ? (a[key] as number) : 0;
      const bVal = typeof b[key] === 'number' ? (b[key] as number) : 0;
      return bVal - aVal;
    });

    this.filteredSubnets = result;
    this.changeDetectorRef.markForCheck();
  }

  public onFilterChange(): void {
    this.applyFilter();
  }

  public onSortChange(sortBy: string): void {
    this.sortBy = sortBy;
    this.applyFilter();
  }

  public formatNumber(value: number | undefined, decimals = 2): string {
    if (value === undefined || value === null) {
      return '-';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  public formatTao(value: number | undefined): string {
    if (value === undefined || value === null) {
      return '-';
    }
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toFixed(2);
  }

  public getFlowClass(value: number | undefined): string {
    if (value === undefined || value === null || value === 0) {
      return 'flow-neutral';
    }
    return value > 0 ? 'flow-positive' : 'flow-negative';
  }

  public getEmissionShare(emission: number): number {
    if (!this.summary?.totalEmission) {
      return 0;
    }
    return (emission / this.summary.totalEmission) * 100;
  }

  public openSubnetDetail(netuid: number): void {
    window.open(`https://dash.taostats.io/subnet/${netuid}`, '_blank');
  }
}
