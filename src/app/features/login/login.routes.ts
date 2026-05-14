import {Routes} from '@angular/router';
import {LoginComponent} from '@common/login/login/login.component';
import {loginRequiredGuard} from '@common/login/login.guard';

export const routes: Routes = [
  {path: '', component: LoginComponent, canActivate: [loginRequiredGuard]}
];
