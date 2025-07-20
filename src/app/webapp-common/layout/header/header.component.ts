import {ChangeDetectionStrategy, Component, inject, input, signal, Type} from '@angular/core';
import {ChangesService} from '@common/shared/services/changes.service';
import {Store} from '@ngrx/store';
import {selectActiveWorkspace, selectCurrentUser, selectIsAdmin} from '../../core/reducers/users-reducer';
import {logout} from '../../core/actions/users.actions';
import {setAutoRefresh} from '../../core/actions/layout.actions';
import {MatDialog} from '@angular/material/dialog';
import {ConfigurationService} from '../../shared/services/configuration.service';
import {
  GetCurrentUserResponseUserObjectCompany
} from '~/business-logic/model/users/getCurrentUserResponseUserObjectCompany';
import {distinctUntilKeyChanged, filter} from 'rxjs/operators';
import {selectRouterUrl} from '../../core/reducers/router-reducer';
import {TipsService} from '../../shared/services/tips.service';
import {WelcomeMessageComponent} from '../welcome-message/welcome-message.component';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {LoginService} from '~/shared/services/login.service';
import {selectUserSettingsNotificationPath} from '~/core/reducers/view.reducer';
import {selectInvitesPending} from '~/core/reducers/users.reducer';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {selectDarkTheme, selectForcedTheme} from '@common/core/reducers/view.reducer';
import {AppearanceComponent} from '../appearance/appearance.component';
import {
  GlobalSearchDialogComponent
} from '@common/dashboard-search/global-search-dialog/global-search-dialog.component';

@Component({
  selector: 'sm-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'globalSearchTrigger($event)'
  },
  standalone: false
})
export class HeaderComponent {
  private store = inject(Store);
  private dialog = inject(MatDialog);
  public tipsService = inject(TipsService);
  public changesService = inject(ChangesService);
  private loginService = inject(LoginService);
  private router = inject(Router);
  private activeRoute = inject(ActivatedRoute);
  private configService = inject(ConfigurationService);
  private searchComponentPromise: Promise<Type<GlobalSearchDialogComponent>>;

  isShareMode = input<boolean>();
  isLogin = input<boolean>();
  hideMenus = input<boolean>();

  protected environment = this.configService.configuration;
  protected url = this.store.selectSignal(selectRouterUrl);
  protected user = this.store.selectSignal(selectCurrentUser);
  protected isAdmin = this.store.selectSignal(selectIsAdmin);
  protected userNotificationPath = this.store.selectSignal(selectUserSettingsNotificationPath);
  protected invitesPending = this.store.selectSignal(selectInvitesPending);
  protected darkTheme = this.store.selectSignal(selectDarkTheme);
  protected forcedTheme = this.store.selectSignal(selectForcedTheme);
  protected userFocus = signal<boolean>(false);
  protected hideSideNav = signal<boolean>(false);
  protected showAutoRefresh = signal<boolean>(false);
  protected searchActive = signal(false);
  protected widerTabs = signal(false);
  public activeWorkspace = toSignal<GetCurrentUserResponseUserObjectCompany>(this.store.select(selectActiveWorkspace)
    .pipe(
      filter(workspace => !!workspace),
      distinctUntilKeyChanged('id')
    )
  );

  // Ctrl + K -> Global Search Dialog
  globalSearchTrigger(e: KeyboardEvent): void {
    const isModifierPressed = e.metaKey || e.ctrlKey;
    const isKPressed = e.key.toLowerCase() === 'k';
    if (isModifierPressed && isKPressed && this.dialog.openDialogs.length === 0) {
      e.preventDefault();
      e.stopPropagation();
      document.body.querySelectorAll('.cdk-overlay-backdrop').forEach((c: HTMLDivElement) => c.click());
      document.body.querySelectorAll('.cdk-overlay-container').forEach((c: HTMLDivElement) => c.click());
      this.openGlobalSearch();
    }
  }

  constructor() {
    this.getRouteData();

    this.router.events
      .pipe(
        takeUntilDestroyed(),
        filter((event) => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        if ( this.dialog.openDialogs.length === 0 && this.activeRoute.snapshot.queryParams.gq) {
          this.openGlobalSearch();
        }
        this.getRouteData()
      });
  }

  getRouteData() {
    this.userFocus.set(!!this.activeRoute?.firstChild?.snapshot.data?.userFocus);
    this.hideSideNav.set(this.activeRoute?.firstChild?.snapshot.data.hideSideNav);
    let active = false;
    let last = this.activeRoute;
    while (last.firstChild) {
      if (last.snapshot.data.search !== undefined) {
        active = last.snapshot.data.search;
      }
      last = last.firstChild
    }
    this.showAutoRefresh.set(last.snapshot.data.showAutoRefresh);
    this.searchActive.set(active || last.snapshot.data.search);
    this.widerTabs.set(last.snapshot.data.widerTabs);
  }

  logout() {
    this.loginService.clearLoginCache();
    this.store.dispatch(logout({}));
  }

  openWelcome(event: MouseEvent) {
    event.preventDefault();
    this.dialog.open(WelcomeMessageComponent, {data: {step: 2}});
  }

  openAppearance(event: MouseEvent) {
    event.preventDefault();
    this.dialog.open(AppearanceComponent);
  }

  toggleAutoRefresh(autoRefresh: boolean) {
    this.store.dispatch(setAutoRefresh({autoRefresh}));
  }

  openGlobalSearch() {
    if (!this.searchComponentPromise) {
      this.searchComponentPromise = import(
        '@common/dashboard-search/global-search-dialog/global-search-dialog.component'
        ).then(({GlobalSearchDialogComponent}) => GlobalSearchDialogComponent);
    }

    this.searchComponentPromise.then(component => {
      this.dialog.open(component, {
        width: '900px',
        enterAnimationDuration: 0
      });
    });
  }
}
