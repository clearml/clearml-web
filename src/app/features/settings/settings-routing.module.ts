import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ProfileNameComponent} from '@common/settings/admin/profile-name/profile-name.component';
import {WebappConfigurationComponent} from '~/features/settings/containers/webapp-configuration/webapp-configuration.component';
import {WorkspaceConfigurationComponent} from '@common/settings/workspace-configuration/workspace-configuration.component';
import {SettingsComponent} from './settings.component';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {StorageCredentialsComponent} from '@common/settings/storage-credentials/storage-credentials.component';

const settingsBreadcrumb = {
  name: 'Settings',
  url: 'settings',
  type: CrumbTypeEnum.Feature
};

const routes: Routes = [
  {
    path: '',
    component: SettingsComponent,
    children: [
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {path: 'profile',
        component: ProfileNameComponent,
        data: {
        staticBreadcrumb:[[settingsBreadcrumb, {
            name: 'Profile',
            type: CrumbTypeEnum.SubFeature
          }]]},
      },
      {
        path: 'webapp-configuration',
        component: WebappConfigurationComponent,
        data: {workspaceNeutral: true, staticBreadcrumb:[[settingsBreadcrumb, {
            name: 'Configuration',
            type: CrumbTypeEnum.SubFeature
          }]]},
      },
      {
        path: 'workspace-configuration',
        component: WorkspaceConfigurationComponent,
        data: {workspaceNeutral: true, staticBreadcrumb:[[settingsBreadcrumb, {
            name: 'Workspace',
            type: CrumbTypeEnum.SubFeature
          }]]},
      },
      {
        path: 'storage-credentials',
        component: StorageCredentialsComponent,
        data: {
          workspaceNeutral: true,
          route: '/settings/storage-credentials',
          staticBreadcrumb: [[settingsBreadcrumb, {
            name: 'Storage Cleanup',
            type: CrumbTypeEnum.SubFeature
          }]]
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule {}

