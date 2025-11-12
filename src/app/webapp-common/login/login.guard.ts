import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {map} from 'rxjs';
import {Store} from '@ngrx/store';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';

export const loginRequiredGuard: CanActivateFn = (route) => {
  const store = inject(Store);
  const router = inject(Router);

  const redirectUrl = (route.queryParams['redirect'] || '/').replace('/login', '/');
  return store.select(selectCurrentUser)
    .pipe(map(user => !user ? true : router.parseUrl(redirectUrl)));
};

