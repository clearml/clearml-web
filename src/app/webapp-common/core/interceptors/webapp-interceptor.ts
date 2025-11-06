import {inject, Injectable} from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {catchError} from 'rxjs/operators';
import {BaseLoginService} from '@common/shared/services/login.service';

@Injectable()
export class WebappInterceptor implements HttpInterceptor {
  protected login = inject(BaseLoginService);


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
        this.login.logout();
      }
      return throwError(() => err);
    } else {
      return throwError(() => err);
    }
  }
}
