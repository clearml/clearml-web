import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {LoginComponent} from '@common/login/login/login.component';
import {loginRequiredGuard} from '@common/login/login.guard';

const routes: Routes = [
  { path: '', component: LoginComponent, canActivate: [loginRequiredGuard]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LoginRoutingModule { }
