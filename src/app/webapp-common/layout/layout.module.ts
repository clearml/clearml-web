import {NgModule} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {RefreshButtonComponent} from '@common/shared/components/refresh-button/refresh-button.component';
import {LoggedOutAlertComponent} from './logged-out-alert/logged-out-alert.component';
import {ServerNotificationDialogContainerComponent} from './server-notification-dialog-container/server-notification-dialog-container.component';
import {CommonSearchModule} from '../common-search/common-search.module';
import {HeaderComponent} from './header/header.component';
import { UiUpdateDialogComponent } from './ui-update-dialog/ui-update-dialog.component';
import {YouTubePlayerModule} from '@angular/youtube-player';
import {BreadcrumbsComponent} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {HeaderNavbarTabsComponent} from '@common/layout/header-navbar-tabs/header-navbar-tabs.component';
import {SafePipe, SaferPipe} from '@common/shared/pipes/safe.pipe';
import {CheckPermissionDirective} from '~/shared/directives/check-permission.directive';
import {CopyClipboardComponent} from '@common/shared/ui-components/indicators/copy-clipboard/copy-clipboard.component';
import {ShowOnlyUserWorkComponent} from '@common/shared/components/show-only-user-work/show-only-user-work.component';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {MatInputModule} from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {PushPipe} from '@ngrx/component';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {CommonSearchComponent} from '@common/common-search/containers/common-search/common-search.component';
import {MatDialogActions, MatDialogClose} from '@angular/material/dialog';
import {HeaderUserMenuActionsComponent} from '~/layout/header/header-user-menu-actions/header-user-menu-actions.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CommonSearchModule,
    RouterModule,
    YouTubePlayerModule,
    NgOptimizedImage,
    BreadcrumbsComponent,
    SafePipe,
    CheckPermissionDirective,
    CopyClipboardComponent,
    ShowOnlyUserWorkComponent,
    DialogTemplateComponent,
    MatInputModule,
    MatMenuModule,
    MatCheckboxModule,
    TooltipDirective,
    PushPipe,
    SaferPipe,
    ClickStopPropagationDirective,
    MatIconButton,
    MatIcon,
    CommonSearchComponent,
    HeaderNavbarTabsComponent,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    RefreshButtonComponent,
    HeaderUserMenuActionsComponent
  ],
  declarations: [
    HeaderComponent, LoggedOutAlertComponent,
    ServerNotificationDialogContainerComponent,
    UiUpdateDialogComponent,
  ],
  exports: [HeaderComponent, LoggedOutAlertComponent, ServerNotificationDialogContainerComponent, UiUpdateDialogComponent]
})
export class CommonLayoutModule {
}
