import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CodeComponent } from './code.component';

const routes: Routes = [
  {
    path: '',
    component: CodeComponent,
    data: {staticBreadcrumb: [[{name: 'Code'}]]}
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CodeRoutingModule { }
