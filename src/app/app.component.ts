import {selectCurrentUser} from '@common/core/reducers/users-reducer';
import {Component, ViewEncapsulation, HostListener, Renderer2, inject, ChangeDetectionStrategy} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {selectRouterUrl} from '@common/core/reducers/router-reducer';
import {getAllSystemProjects, setSelectedProjectId} from '@common/core/actions/projects.actions';
import {selectRouterProjectId} from '@common/core/reducers/projects.reducer';
import {getTutorialBucketCredentials} from '@common/core/actions/common-auth.actions';
import {termsOfUseAccepted} from '@common/core/actions/users.actions';
import {distinctUntilChanged, filter, map} from 'rxjs/operators';
import {ServerUpdatesService} from '@common/shared/services/server-updates.service';
import {selectAvailableUpdates} from './core/reducers/view.reducer';
import {UPDATE_SERVER_PATH} from './app.constants';
import {aceReady, firstLogin, plotlyReady, setScaleFactor, visibilityChanged} from '@common/core/actions/layout.actions';
import {UiUpdatesService} from '@common/shared/services/ui-updates.service';
import {getScaleFactor} from '@common/shared/utils/shared-utils';
import {ConfigurationService} from '@common/shared/services/configuration.service';
import {selectIsSharedAndNotOwner} from './features/experiments/reducers';
import {TipsService} from '@common/shared/services/tips.service';
import {USER_PREFERENCES_KEY} from '@common/user-preferences';
import {loadExternalLibrary} from '@common/shared/utils/load-external-library';
import {BreadcrumbsService} from '@common/shared/services/breadcrumbs.service';
import {ThemeService} from '@common/shared/services/theme.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {RouterEffects} from '@common/core/effects/router.effects';

@Component({
    selector: 'sm-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [ThemeService],
    standalone: false
})
export class AppComponent {
  private router = inject(Router);
  private store = inject(Store);
  public serverUpdatesService = inject(ServerUpdatesService);
  private uiUpdatesService = inject(UiUpdatesService);
  private tipsService = inject(TipsService);
  private renderer = inject(Renderer2);
  private config = inject(ConfigurationService);
  private routerSerice = inject(RouterEffects);
  private breadcrumbsService = inject(BreadcrumbsService); // don't delete
  private themeService = inject(ThemeService); // don't delete

  protected updatesAvailable$ = this.store.select(selectAvailableUpdates);
  protected currentUser = this.store.selectSignal(selectCurrentUser);
  protected isSharedAndNotOwner = this.store.selectSignal(selectIsSharedAndNotOwner);

  protected loginContext = this.store.select(selectRouterUrl).pipe(map(url => url?.includes('login')));

  @HostListener('document:visibilitychange') onVisibilityChange() {
    this.store.dispatch(visibilityChanged({visible: !document.hidden}));
  }

  constructor() {

    window.addEventListener('message', e => {
      if (e.data.maximizing) {
        const drawerContent = document.querySelector('sm-report mat-drawer-container');
        const iframeElement = document.querySelector(`iframe[name="${e.data.name}"]`);
        if (iframeElement?.classList.contains('iframe-maximized')) {
          this.renderer.removeClass(iframeElement, 'iframe-maximized');
          this.renderer.removeClass(drawerContent, 'iframe-maximized');
        } else {
          this.renderer.addClass(iframeElement, 'iframe-maximized');
          this.renderer.addClass(drawerContent, 'iframe-maximized');
        }
      }
    });

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.routerSerice.routerNavigationEnd());

    this.store.select(selectCurrentUser)
      .pipe(
        takeUntilDestroyed(),
        filter(user => !!user?.id),
        distinctUntilChanged((prev, next) => prev?.id === next?.id)
      )
      .subscribe(() => {
        this.store.dispatch(getAllSystemProjects());
        this.store.dispatch(getTutorialBucketCredentials());
        this.store.dispatch(termsOfUseAccepted());
        this.uiUpdatesService.checkForUiUpdate();
        this.tipsService.initTipsService(false);
        this.serverUpdatesService.checkForUpdates(UPDATE_SERVER_PATH);
        let loginTime = parseInt(localStorage.getItem(USER_PREFERENCES_KEY.firstLogin) || '0', 10);
        if (!loginTime) {
          this.store.dispatch(firstLogin({first: true}));
          loginTime = Date.now();
          localStorage.setItem(USER_PREFERENCES_KEY.firstLogin, `${loginTime}`);
        }
      });

    this.store.select(selectRouterProjectId).subscribe((projectId: string) => {
      this.store.dispatch(setSelectedProjectId({projectId}));
    });

    if (window.localStorage.getItem('disableHidpi') !== 'true') {
      this.setScale();
    }

    loadExternalLibrary(this.store, this.config.configuration().plotlyURL, plotlyReady);
    loadExternalLibrary(this.store, 'assets/ace-builds/ace.js', aceReady);
  }

  private setScale() {
    const dimensionRatio = getScaleFactor();
    this.store.dispatch(setScaleFactor({scale: dimensionRatio}));
    const scale = 100 / dimensionRatio;
    this.renderer.setStyle(document.body, 'transform', `scale(${scale})`);
    this.renderer.setStyle(document.body, 'transform-origin', '0 0');
    this.renderer.setStyle(document.body, 'height', `${dimensionRatio}vh`);
    this.renderer.setStyle(document.body, 'width', `${dimensionRatio}vw`);
  }

  versionDismissed(version: string) {
    this.serverUpdatesService.setDismissedVersion(version);
  }
}
