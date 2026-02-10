import {ApplicationConfig, importProvidersFrom, provideZonelessChangeDetection} from '@angular/core';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {appFeature} from '@common/clearml-applications/report-widgets/src/app/app.reducer';
import {authReducer} from '~/core/reducers/auth.reducers';
import {AppEffects} from '@common/clearml-applications/report-widgets/src/app/app.effects';
import {provideHttpClient} from '@angular/common/http';
import {ApiEventsService} from '~/business-logic/api-services/events.service';
import {SmApiRequestsService} from '~/business-logic/api-services/api-requests.service';
import {ColorHashService} from '@common/shared/services/color-hash/color-hash.service';
import {ApiOrganizationService} from '~/business-logic/api-services/organization.service';
import {AdminService} from '~/shared/services/admin.service';
import {singleGraphReducer} from '@common/shared/single-graph/single-graph.reducer';
import {SingleGraphEffects} from '@common/shared/single-graph/single-graph.effects';
import {extCoreConfig, extCoreEffects} from '~/build-specifics/reports-index';
import {colorPreferenceReducer} from '@common/shared/ui-components/directives/choose-color/choose-color.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      StoreModule.forRoot({}),
      StoreModule.forFeature(appFeature),
      StoreModule.forFeature({name: 'auth', reducer: authReducer}),
      StoreModule.forFeature('singleGraph', singleGraphReducer),
      StoreModule.forFeature('colorsPreference', colorPreferenceReducer),
      // StoreModule.forFeature({name: 'users', reducer: usersReducer}),
      EffectsModule.forRoot([AppEffects, SingleGraphEffects, ...extCoreEffects]),
    ),
    ...extCoreConfig,
    provideZonelessChangeDetection(),
    provideHttpClient(),
    AdminService,
    ApiEventsService,
    SmApiRequestsService,
    ColorHashService,
    ApiOrganizationService
  ]
};
