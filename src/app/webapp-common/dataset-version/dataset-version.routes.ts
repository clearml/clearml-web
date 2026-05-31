import {Routes} from '@angular/router';
import {experimentsProviders} from '~/features/experiments/shared/experiments.providers';

export const routes: Routes = [
  {
    path: '',
    providers: [experimentsProviders],
    loadComponent: () => import('./open-dataset-versions/open-dataset-versions.component').then(m => m.OpenDatasetVersionsComponent),
    children: [
      {
        path: ':versionId',
        loadComponent: () => import('./open-dataset-version-info/open-dataset-version-info.component').then(m => m.OpenDatasetVersionInfoComponent),
      }
    ]
  }
];
