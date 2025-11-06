import {Routes} from '@angular/router';
import {WorkloadsPageComponent} from '@common/project-workloads/workloads-page/workloads-page.component';

export const routes: Routes = [
  {
    path     : '',
    component: WorkloadsPageComponent,
    data: {search: false, archiveLabel: ''},
  }
];
