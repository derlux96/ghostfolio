import { AuthGuard } from '@ghostfolio/client/core/auth.guard';
import { internalRoutes } from '@ghostfolio/common/routes/routes';

import { Routes } from '@angular/router';

import { GfSubnetAnalyticsPageComponent } from './subnet-analytics-page.component';

export const routes: Routes = [
  {
    canActivate: [AuthGuard],
    component: GfSubnetAnalyticsPageComponent,
    path: '',
    title: internalRoutes.subnetAnalytics.title
  }
];
