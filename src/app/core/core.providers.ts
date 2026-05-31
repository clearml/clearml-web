import {DEFAULT_CURRENCY_CODE, importProvidersFrom} from '@angular/core';
import {USER_PROVIDED_META_REDUCERS, provideStore} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {UserPreferences} from '@common/user-preferences';
import {BreadcrumbsService} from '@common/shared/services/breadcrumbs.service';
import {UsageStatsService} from '~/core/services/usage-stats.service';
import {AdminService} from '~/shared/services/admin.service';
import {ReportCodeEmbedService} from '~/shared/services/report-code-embed.service';
import {reducers, userPrefMetaFactory} from './core.config';
import {MatDialogModule} from '@angular/material/dialog';
import {CommonAuthEffects} from '@common/core/effects/common-auth.effects';
import {CommonUserEffects} from '@common/core/effects/users.effects';
import {LayoutEffects} from '@common/core/effects/layout.effects';
import {RouterEffects} from '@common/core/effects/router.effects';
import {ProjectsEffects as CommonProjectsEffect} from '@common/core/effects/projects.effects';
import {ProjectsEffects} from '~/core/effects/projects.effects';
import {UserEffects} from '~/core/effects/users.effects';
import {extCoreConfig} from '~/build-specifics';

export const coreProviders = [
  provideStore(reducers, {
    runtimeChecks: {
      strictStateImmutability: true,
      strictActionImmutability: true,
      strictStateSerializability: true,
      strictActionSerializability: true
    }
  }),
  provideEffects([
    CommonAuthEffects,
    CommonUserEffects,
    LayoutEffects,
    RouterEffects,
    CommonProjectsEffect,
    ProjectsEffects,
    UserEffects,
  ]),
  importProvidersFrom(MatDialogModule),
  ...extCoreConfig,

  UsageStatsService,
  AdminService,
  ReportCodeEmbedService,
  {provide: USER_PROVIDED_META_REDUCERS, deps: [UserPreferences], useFactory: userPrefMetaFactory},
  {provide: DEFAULT_CURRENCY_CODE, useValue: 'USD'},
  BreadcrumbsService,
];
