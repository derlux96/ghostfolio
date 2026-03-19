import { AuthGuard } from '@ghostfolio/client/core/auth.guard';
import { internalRoutes } from '@ghostfolio/common/routes/routes';

import { Routes } from '@angular/router';

import { GfSavingsPlansPageComponent } from './savings-plans-page.component';

export const routes: Routes = [
  {
    canActivate: [AuthGuard],
    component: GfSavingsPlansPageComponent,
    path: '',
    title: internalRoutes.savingsPlans.title
  }
];
