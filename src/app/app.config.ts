import { ApplicationConfig, importProvidersFrom, inject, provideAppInitializer } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';
import { coreProviders} from './core/core.providers';
import { experimentsProviders } from './features/experiments/shared/experiments.providers';
import { dashboardSearchProviders } from './features/dashboard-search/dashboard-search.providers';
import { NotifierModule } from '@common/angular-notifier';
import {provideCharts, withDefaultRegisterables} from 'ng2-charts';
import {providePrimeNG} from 'primeng/config';
import { cmlPreset } from '@common/styles/prime.preset';
import {UserPreferences} from '@common/user-preferences';
import {ColorHashService} from '@common/shared/services/color-hash/color-hash.service';
import { BreadcrumbsService } from '@common/shared/services/breadcrumbs.service';
import { RouteReuseStrategy } from '@angular/router';
import {CustomReuseStrategy} from '@common/core/router-reuse-strategy';
import { loadUserAndPreferences } from './core/app-init';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { USER_PROVIDED_META_REDUCERS } from '@ngrx/store';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions } from '@angular/material/form-field';
import { MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions } from '@angular/material/tooltip';
import { RefreshService } from '@common/core/services/refresh.service';
import { AdminService } from './shared/services/admin.service';
import { ReportCodeEmbedService } from './shared/services/report-code-embed.service';
import { DEFAULT_CURRENCY_CODE } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { MatIconRegistry } from '@angular/material/icon';
import { Environment } from '../environments/base';
import {OVERLAY_DEFAULT_CONFIG, OverlayDefaultConfig} from '@angular/cdk/overlay';
import {WebappInterceptor} from '@common/core/interceptors/webapp-interceptor';
import {userPrefMetaFactory} from '~/core/core.config';

export const getAppConfig = (configData: Environment): ApplicationConfig => {
  return {
    providers: [
      provideRouter(
        routes,
        withRouterConfig({onSameUrlNavigation: 'reload'}),
        withInMemoryScrolling({scrollPositionRestoration: 'top'})
      ),
      coreProviders,
      experimentsProviders,
      dashboardSearchProviders,
      importProvidersFrom(
        NotifierModule.withConfig({
          theme: 'material',
          behaviour: {
            autoHide: {default: 5000, error: false}
          },
          position: {
            vertical: {position: 'top', distance: 12, gap: 10},
            horizontal: {position: 'right', distance: 12}
          }
        })
      ),
      provideCharts(withDefaultRegisterables()),
      providePrimeNG({
        theme: {
          preset: cmlPreset
        }
      }),
      UserPreferences,
      ColorHashService,
      BreadcrumbsService,
      RefreshService,
      AdminService,
      ReportCodeEmbedService,
      {provide: APP_BASE_HREF, useValue: configData.baseHref},
      {provide: HTTP_INTERCEPTORS, useClass: WebappInterceptor, multi: true},
      {provide: RouteReuseStrategy, useClass: CustomReuseStrategy},
      provideAppInitializer(() => {
        const matIconRegistry = inject(MatIconRegistry);
        matIconRegistry.registerFontClassAlias('al', 'al-icon');
        return loadUserAndPreferences();
      }),
      {
        provide: OVERLAY_DEFAULT_CONFIG, useValue: { usePopover: false } satisfies OverlayDefaultConfig,
      },
      {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {floatLabel: 'always', appearance: 'outline', subscriptSizing: 'dynamic'} as MatFormFieldDefaultOptions},
      {
        provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
        useValue: {position: 'above'} as MatTooltipDefaultOptions
      },
      {
        provide: USER_PROVIDED_META_REDUCERS,
        deps: [UserPreferences],
        useFactory: userPrefMetaFactory
      },
      {provide: DEFAULT_CURRENCY_CODE, useValue: 'USD'},
    ]
  };
};
