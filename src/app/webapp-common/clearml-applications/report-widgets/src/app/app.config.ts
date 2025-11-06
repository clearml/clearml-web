import {ApplicationConfig, importProvidersFrom, provideZonelessChangeDetection} from '@angular/core';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {appFeature} from '@common/clearml-applications/report-widgets/src/app/app.reducer';
import {authReducer} from '~/core/reducers/auth.reducers';
import {AppEffects} from '@common/clearml-applications/report-widgets/src/app/app.effects';
import {extCoreConfig} from '@common/clearml-applications/report-widgets/src/build';
import {provideHttpClient} from '@angular/common/http';
import {ApiEventsService} from '~/business-logic/api-services/events.service';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {ColorHashService} from '@common/shared/services/color-hash/color-hash.service';
import {provideAnimations} from '@angular/platform-browser/animations';
import {BaseAdminService} from '@common/settings/admin/base-admin.service';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      StoreModule.forRoot({}),
      StoreModule.forFeature(appFeature),
      StoreModule.forFeature({name: 'auth', reducer: authReducer}),
      // StoreModule.forFeature({name: 'users', reducer: usersReducer}),
      EffectsModule.forRoot([AppEffects])
    ),
    ...extCoreConfig,
    provideZonelessChangeDetection(),
    provideAnimations(),
    provideHttpClient(),
    BaseAdminService,
    ApiEventsService,
    SmApiRequestsService,
    ColorHashService
  ]
};
