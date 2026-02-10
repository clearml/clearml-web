import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {catchError, map, retry, switchMap, tap} from 'rxjs/operators';
import {HTTP} from '~/app.constants';
import {UsersGetAllResponse} from '~/business-logic/model/users/usersGetAllResponse';
import {AuthCreateUserResponse} from '~/business-logic/model/auth/authCreateUserResponse';
import {v1 as uuidV1} from 'uuid';
import {BehaviorSubject, EMPTY, Observable, of, timer} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {LoginModeResponse} from '~/business-logic/model/LoginModeResponse';
import {ApiLoginService} from '~/business-logic/api-services/login.service';
import {ConfigurationService} from './configuration.service';
import {USER_PREFERENCES_KEY, UserPreferences} from '@common/user-preferences';
import {fetchCurrentUser} from '@common/core/actions/users.actions';
import {Store} from '@ngrx/store';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {Router} from '@angular/router';
import {LocationStrategy} from '@angular/common';
import {selectDarkTheme} from '@common/core/reducers/view.reducer';
import {environment} from '../../../../environments/environment';
import {TIME_IN_MILLI} from '@common/shared/utils/time-util';
import {resetCurrentUser} from '~/core/actions/users.action';

export type LoginMode = 'simple' | 'password' | 'ssoOnly' | 'error' | 'tenant';

export const loginModes = {
  error: 'error' as LoginMode,
  simple: 'simple' as LoginMode,
  password: 'password' as LoginMode,
  ssoOnly: 'ssoOnly' as LoginMode,
  tenantInput: 'tenant' as LoginMode
};

@Injectable({
  providedIn: 'root'
})
export class BaseLoginService {
  protected httpClient = inject(HttpClient);
  public loginApi = inject(ApiLoginService);
  protected dialog = inject(MatDialog);
  protected configService = inject(ConfigurationService);
  protected store = inject(Store);
  protected router = inject(Router);
  protected userPreferences = inject(UserPreferences);
  protected locationStrategy = inject(LocationStrategy);

  loginMode = signal<LoginMode>(null);
  protected basePath = HTTP.API_BASE_URL;
  private userKey: string;
  private userSecret: string;
  private companyID: string;
  private _loginModeTTL = 0;
  private _loginMode: LoginMode;
  protected environment = this.configService.configuration;
  protected darkTheme = this.store.selectSignal(selectDarkTheme);
  private state = computed(() => ({
    env: this.environment(),
    signupMode: signal(!!this.environment().communityServer && !window.localStorage.getItem(USER_PREFERENCES_KEY.firstLogin))
  }));

  get signupMode() {
    return this.state().signupMode;
  }

  protected _authenticated: boolean;
  protected _authenticated$ = new BehaviorSubject<boolean>(false);
  get authenticated(): boolean {
    return this._authenticated;
  }

  set authenticated(isAuth) {
    this._authenticated = isAuth;
    this._authenticated$.next(isAuth);
  }

  get authenticated$(): Observable<boolean> {
    return this._authenticated$;
  }

  initCredentials() {
    const fromEnv = () => ({
      userKey: environment.userKey,
      userSecret: environment.userSecret,
      companyID: environment.companyID
    });

    return this.getLoginMode().pipe(
      retry({count: 3, delay: (err, count) => timer(500 * count)}),
      catchError(err => {
        this.openServerError();
        throw err;
      }),
      switchMap(mode => mode === loginModes.simple ? this.httpClient.get('credentials.json').pipe(
        catchError(() => of(fromEnv())),
      ) : of(fromEnv())),
      tap((credentials: ReturnType<typeof fromEnv>) => {
        this.userKey = credentials.userKey;
        this.userSecret = credentials.userSecret;
        this.companyID = credentials.companyID;
      }),
    );
  }

  getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const auth = window.btoa(this.userKey + ':' + this.userSecret);
    headers = headers.append('Authorization', 'Basic ' + auth);
    //    headers = headers.append('Content-Type', 'application/x-www-form-urlencoded');
    return headers;
  }

  getLoginMode(force = false): Observable<LoginMode> {
    if (this._loginMode !== undefined && !force && this._loginModeTTL > new Date().getTime()) {
      return of(this._loginMode);
    } else {
      return this.getLoginSupportedModes()
        .pipe(
          tap((res: LoginModeResponse) => {
            this.authenticated = res.authenticated;
            this._loginMode = this.calcLoginMode(res);
            this._loginModeTTL = new Date().getTime() + TIME_IN_MILLI.ONE_MIN * 10;
          }),
          map(() => {
            this.loginMode.set(this._loginMode);
            return this._loginMode;
          }),
          catchError(() => {
            const fallback = this.configService.configuration().loginFallback;
            this._loginMode = fallback === 'error' ? loginModes.error : loginModes.simple;
            this.loginMode.set(this._loginMode);
            return of(this._loginMode);
          }),

        );
    }
  }

  protected calcLoginMode(res: LoginModeResponse) {
    const fallback = this.configService.configuration().loginFallback;
    return  res.basic.enabled ?
      loginModes.password :
        fallback === 'error' ?
          loginModes.error :
          loginModes.simple;
  }

  public getLoginSupportedModes(): Observable<LoginModeResponse> {
    return this.loginApi.loginSupportedModes({});
  }

  getUsers() {
    return this.httpClient.post<{data: UsersGetAllResponse}>(`${this.basePath}/users.get_all`, null, {headers: this.getHeaders()})
      .pipe(
        map(x => x.data.users)
      );
  }

  passwordLogin(user: string, password: string) {
    let headers = new HttpHeaders();
    const auth = window.btoa(user + ':' + password);
    headers = headers.append('Authorization', 'Basic ' + auth);
    headers = headers.append('Access-Control-Allow-Credentials', '*');
    return this.httpClient.post<AuthCreateUserResponse>(`${this.basePath}/auth.login`, null, {headers, withCredentials: true});
  }

  login(userId: string) {
    let headers = this.getHeaders();
    headers = headers.append(`${this.environment().headerPrefix}-Impersonate-As`, userId);
    return this.httpClient.post(`${this.basePath}/auth.login`, null, {headers, withCredentials: true});
  }

  createUser(name: string) {
    let headers = this.getHeaders();
    headers = headers.append('Content-Type', 'application/json');
    const data = {

      email: uuidV1() + '@test.ai',
      name,
      company: this.companyID,
      given_name: name.split(' ')[0],
      family_name: name.split(' ')[1] ? name.split(' ')[1] : name.split(' ')[0]

    };
    return this.httpClient.post<{data: AuthCreateUserResponse}>(`${this.basePath}/auth.create_user`, data, {headers})
      .pipe(map(x => x.data.id));
  }

  autoLogin(name: string) {
    return this.createUser(name)
      .pipe(
        switchMap(id => this.login(id)),
      );
  }


  private openServerError() {
    this.setLogo();
    const body = this.environment().serverDownMessage;

    const confirmDialogRef = this.dialog.open(ConfirmDialogComponent, {
      disableClose: true,
      data: {
        width: 440,
        title: 'Server Unavailable',
        body,
        yes: 'Reload',
        iconClass: 'al-ico-alert-outline',
        centerText: true
      } as ConfirmDialogConfig
    });
    confirmDialogRef.afterClosed().subscribe(() => {
      window.location.reload();
    });
  }

  private setLogo() {
    // Mocking application header
    const imgElement = new Image();
    imgElement.setAttribute('src', this.darkTheme() ? this.environment().branding.logo : this.environment().branding.logo.replace('-white', ''));
    imgElement.setAttribute('style', 'width: 100%; height: 64px; padding: 15px;');
    document.body.appendChild(imgElement);
  }

  clearLoginCache() {
    this._loginMode = undefined;
  }

  loginFlow() {
    const redirectToLogin = (status) => {
      if (status === 401) {
        let pathname = window.location.pathname;
        if (this.locationStrategy.getBaseHref() && this.locationStrategy.getBaseHref() !== '/') {
          pathname = pathname.replace(this.locationStrategy.getBaseHref(), '');
        }

        if (pathname.startsWith('/login')) {
          return of(null);
        }

        let redirectUrl = '';
        let extraParam = '';
        if (pathname.match(/^\/_\w+$/gm)) {
          extraParam = pathname;
        } else {
          redirectUrl = pathname + window.location.search;
        }

        if (!extraParam && !['/login/signup', '/login'].some(url => redirectUrl.startsWith(url))) {
          return of((redirectUrl && redirectUrl != '/') ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login' + '/' + extraParam);
        }
      }
      return of('/login')
    };

    if (this.authenticated === false) {
      return redirectToLogin(401);
    } else {
      this.store.dispatch(fetchCurrentUser());
      return this.userPreferences.loadPreferences()
        .pipe(
          catchError((err) => redirectToLogin(err.status)),
          map(() => null)
        );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getInviteInfo(inviteId: string): Observable<unknown> {
    return EMPTY;
  }

  logout() {
    this._loginMode = undefined;
    this.authenticated = false;
    this.store.dispatch(resetCurrentUser());
    this.dialog.closeAll();
    const redirectUrl: string = window.location.pathname + window.location.search;
    this.router.navigate(['/login'], {queryParams: {redirect: redirectUrl}, replaceUrl: true});
  }
}
