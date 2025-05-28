import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsComponent } from '../settings/settings.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SharedModule} from '~/shared/shared.module';
import {MatExpansionModule} from '@angular/material/expansion';
import {WebappConfigurationComponent} from '~/features/settings/containers/webapp-configuration/webapp-configuration.component';
import {WorkspaceConfigurationComponent} from '@common/settings/workspace-configuration/workspace-configuration.component';
import {ProfileKeyStorageComponent} from '@common/settings/admin/profile-key-storage/profile-key-storage.component';
import {ProfileNameComponent} from '@common/settings/admin/profile-name/profile-name.component';
import {AdminFooterComponent} from '@common/settings/admin/admin-footer/admin-footer.component';
import {S3AccessComponent} from '@common/settings/admin/s3-access/s3-access.component';
import {AdminCredentialTableComponent} from '@common/settings/admin/admin-credential-table/admin-credential-table.component';
import {AdminFooterActionsComponent} from '~/features/settings/containers/admin/admin-footer-actions/admin-footer-actions.component';
import {UserCredentialsComponent} from '~/features/settings/containers/admin/user-credentials/user-credentials.component';
import {UserDataComponent} from '~/features/settings/containers/admin/user-data/user-data.component';
import {CreateCredentialDialogComponent} from '~/features/settings/containers/admin/create-credential-dialog/create-credential-dialog.component';
import {RedactedArgumentsDialogComponent} from '@common/settings/admin/redacted-arguments-dialog/redacted-arguments-dialog.component';
import {LayoutModule} from '~/layout/layout.module';
import {UuidPipe} from '@common/shared/pipes/uuid.pipe';
import {MatInputModule} from '@angular/material/input';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {InlineEditComponent} from '@common/shared/ui-components/inputs/inline-edit/inline-edit.component';
import {CopyClipboardComponent} from '@common/shared/ui-components/indicators/copy-clipboard/copy-clipboard.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import {FilterPipe} from '@common/shared/pipes/filter.pipe';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {KeyValuePipe} from '@common/shared/pipes/key-value.pipe';
import {ButtonToggleComponent} from '@common/shared/ui-components/inputs/button-toggle/button-toggle.component';
import {LabelValuePipe} from '@common/shared/pipes/label-value.pipe';
import {AdminDialogTemplateComponent} from '@common/settings/admin/admin-dialog-template/admin-dialog-template.component';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {ProfilePreferencesComponent} from '@common/settings/admin/profile-preferences/profile-preferences.component';
import {PushPipe} from '@ngrx/component';
import {IdBadgeComponent} from '@common/shared/components/id-badge/id-badge.component';
import {MatDialogActions} from '@angular/material/dialog';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {SettingsEffects} from '~/features/settings/settings.effects';
import {settingsFeatureKey, settingsReducers} from '~/features/settings/settings.reducer';



@NgModule({
  declarations: [
    AdminFooterActionsComponent,
    UserDataComponent,
    SettingsComponent,
    UserCredentialsComponent,
    AdminCredentialTableComponent,
    AdminFooterComponent,
    ProfileNameComponent,
    WorkspaceConfigurationComponent,
    RedactedArgumentsDialogComponent
  ],
  imports: [
    CommonModule,
    SettingsRoutingModule,
    ReactiveFormsModule,
    SharedModule,
    MatExpansionModule,
    StoreModule.forFeature(settingsFeatureKey, settingsReducers),
    EffectsModule.forFeature([SettingsEffects]),
    FormsModule,
    LayoutModule,
    UuidPipe,
    MatInputModule,
    DialogTemplateComponent,
    MatSlideToggleModule,
    InlineEditComponent,
    CopyClipboardComponent,
    TooltipDirective,
    MatSidenavModule,
    MatListModule,
    FilterPipe,
    MatButtonToggleModule,
    KeyValuePipe,
    ButtonToggleComponent,
    LabelValuePipe,
    AdminDialogTemplateComponent,
    TimeAgoPipe,
    ShowTooltipIfEllipsisDirective,
    ProfilePreferencesComponent,
    S3AccessComponent,
    CreateCredentialDialogComponent,
    WebappConfigurationComponent,
    ProfileKeyStorageComponent,
    PushPipe,
    IdBadgeComponent,
    MatDialogActions,
    MatButton,
    MatIcon,
    MatIconButton,
  ],
  exports: [
    UserCredentialsComponent,
    AdminFooterComponent,
    ProfileNameComponent,
  ]
})
export class SettingsModule { }
