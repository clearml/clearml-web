import {ChangeDetectionStrategy, Component, computed, inject, viewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectHeaderMenu, selectHeaderMenuIndex} from '@common/core/reducers/view.reducer';
import {headerActions} from '@common/core/actions/router.actions';
import {MatTab, MatTabGroup, MatTabLabel} from '@angular/material/tabs';
import {CheckPermissionDirective} from '~/shared/directives/check-permission.directive';
import {NavigationCancel, NavigationCancellationCode, NavigationEnd, Router} from '@angular/router';
import {UpperCasePipe} from '@angular/common';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {SafeHtmlPipe} from 'primeng/menu';
import {MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions} from '@angular/material/tooltip';
import {FormsModule} from '@angular/forms';
import {explicitEffect} from 'ngxtension/explicit-effect';


@Component({
  selector: 'sm-header-navbar-tabs',
  templateUrl: './header-navbar-tabs.component.html',
  styleUrls: ['./header-navbar-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
    useValue: {showDelay: 500, position: 'below'} as MatTooltipDefaultOptions
  }],
  imports: [
    MatTabGroup,
    MatTab,
    CheckPermissionDirective,
    MatTabLabel,
    UpperCasePipe,
    TooltipDirective,
    SafeHtmlPipe,
    FormsModule
  ]
})
export class HeaderNavbarTabsComponent {
  private store = inject(Store);
  private router = inject(Router);

  protected contextNavbar = this.store.selectSignal(selectHeaderMenu);
  contextNavbarLength = computed(() => {
    return this.contextNavbar()?.length;
  });
  protected index = this.store.selectSignal(selectHeaderMenuIndex);

  private tabGroup = viewChild(MatTabGroup);
  private lastKnownGoodIndex = this.getCurrentTabIndexFromRoute();
  private lastKnownGoodContextTabs = this.contextNavbar();

  setFeature(index) {
    const route = this.contextNavbar()?.[index];
    if (route?.link && index !== this.index()) {
      this.store.dispatch(headerActions.setActiveTab({activeFeature: route.featureName ?? route.header}));
      if (typeof route.link === 'string') {
        this.router.navigateByUrl(route.link as string);
      } else {
        this.router.navigate(route.link as [], {
          queryParamsHandling: 'merge',
          ...(route.queryParams && {queryParams: route.queryParams, replaceUrl: true})
        });
      }
    }
  }

  constructor() {
    explicitEffect([this.contextNavbarLength],([currentTabsLength]) => {
      const tabGroupInstance = this.tabGroup();
      const currentIndex = this.index();

      if (tabGroupInstance && currentTabsLength) {
        window.setTimeout(() => {
          tabGroupInstance.selectedIndex = currentIndex;
          tabGroupInstance.updatePagination();
        });
      }
    });


    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.lastKnownGoodIndex = this.getCurrentTabIndexFromRoute();
        this.lastKnownGoodContextTabs = this.contextNavbar();
      } else if (event instanceof NavigationCancel && event.code === NavigationCancellationCode.GuardRejected) {
        if (this.lastKnownGoodContextTabs && (this.tabGroup()?.selectedIndex !== this.lastKnownGoodIndex || this.lastKnownGoodContextTabs?.length !== this.contextNavbar()?.length)) {
          this.store.dispatch(headerActions.setTabs({
            contextMenu: this.lastKnownGoodContextTabs,
            active: this.lastKnownGoodContextTabs?.[this.lastKnownGoodIndex]?.header
          }));
        }
      }
    });
  }

  getCurrentTabIndexFromRoute(): number {
    return this.index() ?? 0;
  }
}
