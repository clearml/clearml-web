import {inject, NgModule, provideAppInitializer} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {PreloadAllModules, RouteReuseStrategy, RouterModule} from '@angular/router';
import {BusinessLogicModule} from './business-logic/business-logic.module';
import {AppComponent} from './app.component';
import {routes} from './app.routes';
import {SMCoreModule} from './core/core.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HTTP_INTERCEPTORS} from '@angular/common/http';
import {WebappInterceptor} from '@common/core/interceptors/webapp-interceptor';
import {CustomReuseStrategy} from '@common/core/router-reuse-strategy';
import {UserPreferences} from '@common/user-preferences';
import {AngularSplitModule} from 'angular-split';
import {NotifierModule} from '@common/angular-notifier';
import {ColorHashService} from '@common/shared/services/color-hash/color-hash.service';
import {SharedModule} from './shared/shared.module';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from '@angular/material/form-field';
import {ExperimentSharedModule} from '~/features/experiments/shared/experiment-shared.module';
import {loadUserAndPreferences} from '~/core/app-init';
import {MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions} from '@angular/material/tooltip';
import {UpdateNotifierComponent} from '@common/shared/ui-components/overlay/update-notifier/update-notifier.component';
import {SpinnerComponent} from '@common/shared/ui-components/overlay/spinner/spinner.component';
import {MatIconRegistry} from '@angular/material/icon';
import {provideCharts, withDefaultRegisterables} from 'ng2-charts';
import {PushPipe} from '@ngrx/component';
import { providePrimeNG } from 'primeng/config';
import {cmlPreset} from '@common/styles/prime.preset';
import {AppRootComponent} from '~/app';
import {HeaderComponent} from '@common/layout/header/header.component';
import {ServerNotificationDialogContainerComponent} from '@common/layout/server-notification-dialog-container/server-notification-dialog-container.component';
import {SideNavComponent} from '~/layout/side-nav/side-nav.component';
import {ColorPickerWrapperComponent} from '@common/shared/ui-components/inputs/color-picker/color-picker-wrapper.component';

@NgModule({
  declarations   : [AppComponent, AppRootComponent],
  imports: [
    ExperimentSharedModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
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
    SharedModule,
    UpdateNotifierComponent,
    SpinnerComponent,
    PushPipe,
    HeaderComponent,
    HeaderComponent,
    ServerNotificationDialogContainerComponent,
    SideNavComponent,
    ColorPickerWrapperComponent,
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
  bootstrap      : [AppRootComponent],
  exports        : []
})
export class AppModule {
  public matIconRegistry = inject(MatIconRegistry);

  constructor() {
    this.matIconRegistry.registerFontClassAlias('al', 'al-icon');
  }
}
