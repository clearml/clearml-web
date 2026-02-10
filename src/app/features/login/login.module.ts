import { NgModule } from '@angular/core';
import {RouterModule} from '@angular/router';
import {LoginComponent} from '@common/login/login/login.component';
import {loginRequiredGuard} from '@common/login/login.guard';


@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: LoginComponent, canActivate: [loginRequiredGuard]}])
  ]
})
export class LoginModule { }
