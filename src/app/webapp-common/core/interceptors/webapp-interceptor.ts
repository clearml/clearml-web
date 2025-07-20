import {inject, Injectable} from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {catchError} from 'rxjs/operators';
import { Router } from '@angular/router';
import {selectCurrentUser} from '../reducers/users-reducer';
import {Store} from '@ngrx/store';
import {resetCurrentUser} from '~/core/actions/users.action';
import {MatDialog} from '@angular/material/dialog';

@Injectable()
export class WebappInterceptor implements HttpInterceptor {
  protected router = inject(Router);
  protected store = inject(Store);
  protected dialog = inject(MatDialog);
  protected user = this.store.selectSignal(selectCurrentUser);


  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    request = request.clone({
      setHeaders: {

        'X-Allegro-Client': 'Webapp-' + environment.version,
      }
    });

    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => this.errorHandler(request, err))
    );
  }

  protected errorHandler(request: HttpRequest<any>, err: HttpErrorResponse) {
    const redirectUrl: string = window.location.pathname + window.location.search;
    if (request.url.endsWith('system.company_info')) {
      return throwError(() => err);
    }
    if (err.status === 401) {
      if (redirectUrl.indexOf('/signup') === -1 && redirectUrl.indexOf('/login') === -1) {

        this.store.dispatch(resetCurrentUser());
        this.dialog.closeAll();
        this.router.navigate(['login'], {queryParams: {redirect: redirectUrl}, replaceUrl: true});
      }
      return throwError(() => err);
    } else {
      return throwError(() => err);
    }
  }
}
