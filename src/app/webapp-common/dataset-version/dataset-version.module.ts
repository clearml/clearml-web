import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ExperimentSharedModule} from '~/features/experiments/shared/experiment-shared.module';
import {DebugImagesModule} from '@common/debug-images/debug-images.module';


export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./open-dataset-versions/open-dataset-versions.component').then(m => m.OpenDatasetVersionsComponent),
    children: [
      {
        path: ':versionId',
        loadComponent: () => import('./open-dataset-version-info/open-dataset-version-info.component').then(m => m.OpenDatasetVersionInfoComponent),
      }
    ]
  }
];

@NgModule({
  imports: [
    ExperimentSharedModule,
    DebugImagesModule,
    RouterModule.forChild(routes),
  ]
})
export class DatasetVersionModule {
}
