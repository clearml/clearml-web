import {ChangeDetectionStrategy, Component, inject, input, signal} from '@angular/core';
import {ChangesService} from '@common/shared/services/changes.service';
import {Store} from '@ngrx/store';
import {selectActiveWorkspace, selectCurrentUser, selectIsAdmin} from '../../core/reducers/users-reducer';
import {logout} from '../../core/actions/users.actions';
import {addMessage, setAutoRefresh} from '../../core/actions/layout.actions';
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
import {MESSAGES_SEVERITY} from '@common/constants';
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
  public activeWorkspace = toSignal<GetCurrentUserResponseUserObjectCompany>(this.store.select(selectActiveWorkspace)
    .pipe(
      filter(workspace => !!workspace),
      distinctUntilKeyChanged('id')
    )
  );
  private globalSearchIsOpen: boolean;

  constructor() {
    this.getRouteData();

    this.router.events
      .pipe(
        takeUntilDestroyed(),
        filter((event) => event instanceof NavigationEnd)
      )
      .subscribe(() => this.getRouteData());

    this.router.events
      .pipe(
        filter(()=> !this.globalSearchIsOpen),
        filter((event) => event instanceof NavigationEnd),
        filter(() => this.activeRoute.snapshot.queryParams.gq)
      )
      .subscribe(() => {
          this.openGlobalSearch();
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
  }

  logout() {
    this.loginService.clearLoginCache();
    this.store.dispatch(logout({}));
  }

  copyToClipboardSuccess() {
    this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'URL copied successfully'));
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
    this.globalSearchIsOpen = true;
    this.dialog.open(GlobalSearchDialogComponent, {
      width: '90vw',
      height: '90vh',
      enterAnimationDuration: 0
    }).afterClosed().subscribe(() => {
      this.globalSearchIsOpen = false;
    });
  }
}
