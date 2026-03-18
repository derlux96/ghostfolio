import { AuthGuard } from '@ghostfolio/client/core/auth.guard';

import { Routes } from '@angular/router';

import { GfCustomAllocationsPageComponent } from './custom-allocations-page.component';

export const routes: Routes = [
  {
    canActivate: [AuthGuard],
    component: GfCustomAllocationsPageComponent,
    path: '',
    title: $localize`Custom Allocations`
  }
];
