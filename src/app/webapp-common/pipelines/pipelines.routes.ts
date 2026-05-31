import {Routes} from '@angular/router';
import {PipelinesPageComponent} from '@common/pipelines/pipelines-page/pipelines-page.component';
import {FeaturesEnum} from '~/business-logic/model/users/featuresEnum';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {pipelinesProviders} from './pipelines.providers';

export const routes: Routes = [{
  path: '',
  component: PipelinesPageComponent,
  data: {search: true, features: FeaturesEnum.Pipelines, staticBreadcrumb:[[{
      name: 'PIPELINES',
      type: CrumbTypeEnum.Feature
    }]]},
  providers: pipelinesProviders
}];
