import { ImpersonationStorageService } from '@ghostfolio/client/services/impersonation-storage.service';
import { UserService } from '@ghostfolio/client/services/user/user.service';
import {
  CustomAllocationResponse,
  RebalancingAction
} from '@ghostfolio/common/interfaces';
import { DataService } from '@ghostfolio/ui/services';
import { GfValueComponent } from '@ghostfolio/ui/value';

import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  imports: [
    AsyncPipe,
    GfValueComponent,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTableModule,
    RouterModule
  ],
  selector: 'gf-custom-allocations-page',
  standalone: true,
  styleUrls: ['./custom-allocations-page.scss'],
  templateUrl: './custom-allocations-page.html'
})
export class GfCustomAllocationsPageComponent implements OnInit {
  public allocationData$: Observable<CustomAllocationResponse>;
  public displayedColumns = [
    'tagName',
    'currentAllocation',
    'targetAllocation',
    'drift',
    'actions'
  ];
  public hasImpersonationId: boolean;

  public constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly dataService: DataService,
    private readonly destroyRef: DestroyRef,
    private readonly impersonationStorageService: ImpersonationStorageService,
    private readonly userService: UserService
  ) {
    this.allocationData$ = this.dataService.fetchCustomAllocations();

    this.impersonationStorageService
      .onChangeHasImpersonation()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((impersonationId) => {
        this.hasImpersonationId = !!impersonationId;
        this.refresh();
      });
  }

  public ngOnInit() {
    this.userService.stateChanged
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.refresh();
      });
  }

  public getActionType(action: RebalancingAction): string {
    return action.type === 'BUY' ? 'Buy' : 'Sell';
  }

  public getDriftClass(drift: number): string {
    if (Math.abs(drift) < 0.01) {
      return 'drift-neutral';
    } else if (drift > 0) {
      return 'drift-positive';
    } else {
      return 'drift-negative';
    }
  }

  public refresh() {
    this.allocationData$ = this.dataService.fetchCustomAllocations();
    this.changeDetectorRef.markForCheck();
  }

  public trackByIndex(_index: number, item: RebalancingAction): string {
    return item.tagId;
  }

  public trackByIndexAllocation(_index: number, item: any): string {
    return item.tagId;
  }
}
