import {APP_INITIALIZER, inject, NgModule, provideAppInitializer} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {PreloadAllModules, RouteReuseStrategy, RouterModule} from '@angular/router';
import {BusinessLogicModule} from './business-logic/business-logic.module';
import {AppComponent} from './app.component';
import {routes} from './app.routes';
import {SMCoreModule} from './core/core.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonLayoutModule} from '@common/layout/layout.module';
import {HTTP_INTERCEPTORS} from '@angular/common/http';
import {WebappInterceptor} from '@common/core/interceptors/webapp-interceptor';
import {CustomReuseStrategy} from '@common/core/router-reuse-strategy';
import {UserPreferences} from '@common/user-preferences';
import {AngularSplitModule} from 'angular-split';
import {NotifierModule} from '@common/angular-notifier';
import {LayoutModule} from './layout/layout.module';
import {ColorHashService} from '@common/shared/services/color-hash/color-hash.service';
import {SharedModule} from './shared/shared.module';
import {ProjectsSharedModule} from './features/projects/shared/projects-shared.module';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from '@angular/material/form-field';
import {ExperimentSharedModule} from '~/features/experiments/shared/experiment-shared.module';
import {loadUserAndPreferences} from '~/core/app-init';
import {MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions} from '@angular/material/tooltip';
import {UpdateNotifierComponent} from '@common/shared/ui-components/overlay/update-notifier/update-notifier.component';
import {ChooseColorModule} from '@common/shared/ui-components/directives/choose-color/choose-color.module';
import {SpinnerComponent} from '@common/shared/ui-components/overlay/spinner/spinner.component';
import {MatIconRegistry} from '@angular/material/icon';
import {provideCharts, withDefaultRegisterables} from 'ng2-charts';
import {PushPipe} from '@ngrx/component';
import { providePrimeNG } from 'primeng/config';
import {cmlPreset} from '@common/styles/prime.preset';

@NgModule({
  declarations   : [AppComponent],
  imports: [
    ExperimentSharedModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    ProjectsSharedModule,
    BrowserModule,
    SMCoreModule,
    BusinessLogicModule,
    AngularSplitModule,
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
      scrollPositionRestoration: 'top',
      onSameUrlNavigation: 'reload'
    }),
    NotifierModule.withConfig({
      theme: 'material',
      behaviour: {
        autoHide: {default: 5000, error: false}
      },
      position: {
        vertical: {position: 'top', distance: 12, gap: 10},
        horizontal: {position: 'right', distance: 12}
      }
    }),
    CommonLayoutModule,
    LayoutModule,
    SharedModule,
    UpdateNotifierComponent,
    ChooseColorModule,
    SpinnerComponent,
    PushPipe,
  ],
  providers: [
    UserPreferences,
  {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {floatLabel: 'always',  appearance: 'outline'}},
    provideAppInitializer(() => loadUserAndPreferences()),
    ColorHashService,
    {provide: HTTP_INTERCEPTORS, useClass: WebappInterceptor, multi: true},
    {provide: RouteReuseStrategy, useClass: CustomReuseStrategy},
    {
      provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
      useValue: {position: 'above'} as MatTooltipDefaultOptions
    },
    provideCharts(withDefaultRegisterables()),
    providePrimeNG({
      theme: {
        preset: cmlPreset
      }
    })
  ],
  bootstrap      : [AppComponent],
  exports        : []
})
export class AppModule {
  public matIconRegistry = inject(MatIconRegistry);

  constructor() {
    this.matIconRegistry.registerFontClassAlias('al', 'al-icon');
  }
}
