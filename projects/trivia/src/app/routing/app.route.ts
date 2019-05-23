import { Routes } from '@angular/router';
import { PrivacyPolicyComponent, InvitationRedirectionComponent, AppInstallationStatusComponent } from '../components/index';
import { AuthGuard, BulkLoadGuard, CategoriesResolver, TagsResolver } from 'shared-library/core/route-guards';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadChildren: '../dashboard/dashboard.module#DashboardModule',
  },
  {
    path: 'privacy-policy',
    component: PrivacyPolicyComponent
  },
  {
    path: 'terms-and-conditions',
    component: PrivacyPolicyComponent
  },
  {
    path: 'app-installation-status',
    component: AppInstallationStatusComponent
  },
  {
    path: 'user',
    loadChildren: '../user/user.module#UserModule',
    resolve: { "categories": CategoriesResolver, "tags": TagsResolver }
  },
  {
    path: 'game-play',
    loadChildren: '../game-play/game-play.module#GamePlayModule',
    canActivate: [AuthGuard],
    resolve: { "categories": CategoriesResolver, "tags": TagsResolver }
  },
  {
    path: 'bulk',
    loadChildren: '../bulk/bulk.module#BulkModule',
    canActivate: [AuthGuard],
    canLoad: [BulkLoadGuard]
  },
  {
    path: 'invitation-redirection/:token',
    component: InvitationRedirectionComponent
  }
];
