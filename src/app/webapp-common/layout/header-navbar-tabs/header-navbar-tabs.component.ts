import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectIsArchivedMode} from '@common/core/reducers/projects.reducer';
import {selectHeaderMenu, selectHeaderMenuIndex} from '@common/core/reducers/view.reducer';
import {headerActions} from '@common/core/actions/router.actions';
import {MatTab, MatTabChangeEvent, MatTabGroup, MatTabLabel} from '@angular/material/tabs';
import {CheckPermissionDirective} from '~/shared/directives/check-permission.directive';
import {Router} from '@angular/router';
import {UpperCasePipe} from '@angular/common';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {SafeHtmlPipe} from 'primeng/menu';


@Component({
    selector: 'sm-header-navbar-tabs',
    templateUrl: './header-navbar-tabs.component.html',
    styleUrls: ['./header-navbar-tabs.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTabGroup,
    MatTab,
    CheckPermissionDirective,
    MatTabLabel,
    UpperCasePipe,
    TooltipDirective,
    SafeHtmlPipe
  ]
})
export class HeaderNavbarTabsComponent {
  private store = inject(Store);
  private router = inject(Router);

  protected contextNavbar = this.store.selectSignal(selectHeaderMenu);
  protected index = this.store.selectSignal(selectHeaderMenuIndex);
  protected archivedMode = this.store.selectSignal(selectIsArchivedMode);

  setFeature(event: MatTabChangeEvent) {
    const route = this.contextNavbar()?.[event.index];
    if (route?.link && event.index !== this.index()) {
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

}
