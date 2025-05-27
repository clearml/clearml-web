import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  Renderer2,
  signal,
  TemplateRef,
  viewChild
} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from '@angular/material/autocomplete';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {NtkmeButtonComponent, NtkmeButtonModule} from '@ctrl/ngx-github-buttons';
import {PushPipe} from '@ngrx/component';
import {Store} from '@ngrx/store';
import {EMPTY, interval, Observable} from 'rxjs';
import {catchError, filter, finalize, map, mergeMap, startWith, switchMap, take, takeWhile, tap} from 'rxjs/operators';
import {fetchCurrentUser, setPreferences} from '../../core/actions/users.actions';
import {LoginMode, loginModes} from '../../shared/services/login.service';
import {selectInviteId} from '../login-reducer';
import {ConfigurationService} from '../../shared/services/configuration.service';
import {ConfirmDialogComponent} from '../../shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {LoginService} from '~/shared/services/login.service';
import {UserPreferences} from '../../user-preferences';
import {setBreadcrumbs} from '@common/core/actions/router.actions';
import {CrumbTypeEnum} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';
import {userThemeChanged} from '@common/core/actions/layout.actions';
import {selectDarkTheme, selectUserTheme} from '@common/core/reducers/view.reducer';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {NgOptimizedImage, NgTemplateOutlet} from '@angular/common';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';


@Component({
    selector: 'sm-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatAutocompleteTrigger,
        MatProgressSpinner,
        MatAutocomplete,
        MatOption,
        PushPipe,
        NtkmeButtonModule,
        NgOptimizedImage,
        ReactiveFormsModule,
        MatFormField,
        MatLabel,
        MatInput,
        MatButton,
        NgTemplateOutlet
    ]
})
export class LoginComponent {
  private router = inject(Router);
  private loginService = inject(LoginService);
  private dialog = inject(MatDialog);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private userPreferences = inject(UserPreferences);
  private config = inject(ConfigurationService);
  private cdr = inject(ChangeDetectorRef);
  private ref = inject(ElementRef);
  private renderer = inject(Renderer2);
  private destroy = inject(DestroyRef);

  showSimpleLogin = input<boolean>();
  hideTou = input<boolean>();
  showBackground = input(true);
  errorTemplate = input<TemplateRef<unknown>>();
  private nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');
  private githubButton = viewChild(NtkmeButtonComponent);
  protected environment = this.config.configuration;
  protected loginMode = this.loginService.loginMode;

  protected showLogin = computed(() => this.showSimpleLogin() || [loginModes.password, loginModes.simple].includes(this.loginMode()));

  protected isInvite = this.router.url.includes('invite');
  protected loginForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required, Validators.minLength(1), Validators.maxLength(70), Validators.pattern(/.*\S.*/)]),
    password: new FormControl<string>('', [Validators.minLength(1)]),
  });

  options: any[] = [];
  filteredOptions$: Observable<any[]>;
  public loginModeEnum = loginModes;

  protected loginFailed = signal(false);
  protected showSpinner = signal<boolean>(null);
  protected loginTitle = signal<string>(this.isInvite ? '' : 'Login');
  touLink = computed(() => this.environment().legal.TOULink);
  protected notice = computed(() => this.environment().loginNotice);
  protected showGitHub = computed(() => !this.environment().enterpriseServer && !this.environment().communityServer);
  private redirectUrl: string;

  private theme = this.store.selectSignal(selectUserTheme);
  private originalTheme = signal(this.theme());

  get buttonCaption() {
    return this.loginMode() === loginModes.simple ? 'START' : 'LOGIN';
  }

  constructor() {
    this.setTheme(this.environment().communityServer ? 'light' : 'dark');

    this.store.dispatch(setBreadcrumbs({
      breadcrumbs: [[{
        name: 'Login',
        type: CrumbTypeEnum.Feature
      }]]}));

    toObservable(this.githubButton)
      .pipe(
        takeUntilDestroyed(),
        switchMap(() => interval(100)),
        filter(() => !!this.githubButton()?.counter),
        tap(() => this.cdr.markForCheck()),
        takeWhile(() => !this.githubButton()?.counter),
      )
      .subscribe();

    effect(() => {
      this.nameInput()?.nativeElement.focus();
    });

    this.store.select(selectCurrentUser)
      .pipe(
        takeUntilDestroyed(),
        filter(user => !!user),
      )
      .subscribe(() => {
        this.router.navigateByUrl(this.getNavigateUrl());
      });

    this.store.select(selectInviteId).pipe(
      filter(invite => !!invite),
      take(1),
      mergeMap(inviteId => this.loginService.getInviteInfo(inviteId))
    ).subscribe((inviteInfo: any) => {
      const shorterName = inviteInfo.user_given_name || inviteInfo.user_name?.split(' ')[0];
      this.loginTitle.set(!shorterName ? '' : `Accept ${shorterName ? shorterName + '\'s' : ''} invitation and
      join their team`);
    });

    this.route.queryParams
      .pipe(
        filter(params => !!params),
        take(1)
      )
      .subscribe((params: Params) => {
        this.redirectUrl = params['redirect'] || '';
        this.redirectUrl = this.redirectUrl.replace('/login', '/dashboard');
      });

    this.loginService.getLoginMode()
      .pipe(
        takeUntilDestroyed(),
        finalize(() => {
          if (this.loginMode() === loginModes.simple) {
            this.loginService.getUsers()
              .pipe(take(1))
              .subscribe(users => {
                this.options = users;
                this.cdr.markForCheck();
              });
            if (this.environment().autoLogin && this.redirectUrl && !['/dashboard'].includes(this.redirectUrl)) {
              this.loginForm.controls['name'].setValue((new Date()).getTime().toString());
              this.simpleLogin()
                .pipe(take(1))
                .subscribe();
            }
          }
        }))
      .subscribe((loginMode: LoginMode) => {
        if (loginMode === loginModes.password) {
          this.loginForm.controls['password'].addValidators(Validators.required);
        }
        this.cdr.markForCheck();
      });

    this.filteredOptions$ = this.loginForm.controls.name.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value))
      );

    // this.loginForm.controls.name.valueChanges
    //   .pipe(takeUntilDestroyed())
    //   .subscribe((val: string) => {
    //     this.loginForm.value.name = val.trim();
    //     this.cdr.detectChanges();
    //   });

    this.destroy.onDestroy(() => {
      this.setTheme(this.originalTheme());
    });
  }

  login() {
    this.showSpinner.set(true);
    if (this.loginMode() === loginModes.password) {
      const user = this.loginForm.controls.name.value.trim();
      const password = this.loginForm.controls.password.value.trim();
      this.loginService.passwordLogin(user, password)
        .pipe(
          catchError(() => {
            this.loginFailed.set(true);
            return EMPTY;
          }),
          take(1),
          switchMap(() => this.afterLogin()),
          finalize( () => this.showSpinner.set(false))
        )
        .subscribe();
    } else {
      this.simpleLogin()
        .pipe(
          take(1),
          catchError(() => EMPTY),
          finalize( () => this.showSpinner.set(false))
        )
        .subscribe();
    }
  }

  simpleLogin() {
    const userName = this.loginForm.controls.name.value.trim();
    const user = this.options.find(x => x.name === userName);
    if (user) {
      return this.loginService.login(user.id)
        .pipe(
          switchMap(() => this.afterLogin())
        );
    } else {
      const name = this.loginForm.value.name.trim();
      return this.loginService.autoLogin(name)
        .pipe(
          switchMap(() => this.afterLogin())
        )
    }
  }

  private afterLogin() {

    return this.userPreferences.loadPreferences()
      .pipe(
        take(1),
        catchError(() => {
          return this.router.navigateByUrl(this.getNavigateUrl());
        }),
        map(res => this.store.dispatch(setPreferences({payload: res}))),
        tap(() => {
          this.store.dispatch(fetchCurrentUser());
          this.openLoginNotice();
        }),
      );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.options.filter((option: any) => option.name.toLowerCase().includes(filterValue.toLowerCase()));
  }

  getNavigateUrl(): string {
    return this.redirectUrl ? this.redirectUrl : '/dashboard';
  }


  private openLoginNotice() {
    if (this.environment().loginPopup) {
      this.dialog.open(ConfirmDialogComponent, {
        disableClose: true,
        data: {
          body: this.environment().loginPopup,
          yes: 'OK',
          iconClass: 'al-ico-alert',
          iconColor: 'var(--color-warning)'
        }
      });
    }
  }

  private setTheme(theme: 'light' | 'dark' | 'system') {
    this.store.dispatch(userThemeChanged({theme}));
  }
}
