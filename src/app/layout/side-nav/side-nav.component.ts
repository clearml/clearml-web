import {ChangeDetectionStrategy, Component, computed, ElementRef, inject, viewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectDefaultNestedModeForFeature} from '@common/core/reducers/projects.reducer';
import {fromEvent} from 'rxjs';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';
import {searchDeactivate} from '@common/dashboard-search/dashboard-search.actions';
import {ConfigurationService} from '@common/shared/services/configuration.service';
import {selectFirstRouterConfig} from '@common/core/reducers/router-reducer';
import {toSignal} from '@angular/core/rxjs-interop';
import {selectDarkTheme, selectHideEnterpriseFeatures} from '@common/core/reducers/view.reducer';
import {MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions} from '@angular/material/tooltip';

@Component({
  selector: 'sm-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss', '../../webapp-common/layout/side-navbar/side-navbar.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
      useValue: {showDelay: 0, position: 'right'} as MatTooltipDefaultOptions
    },
  ],
  standalone: false
})
export class SideNavComponent {
  public store = inject(Store);
  private configService = inject(ConfigurationService);

  private container = viewChild<ElementRef<HTMLDivElement>>('container');
  protected baseRouteConfig = this.store.selectSignal(selectFirstRouterConfig);
  protected environment = this.configService.configuration;
  protected defaultNestedModeForFeature = this.store.selectSignal(selectDefaultNestedModeForFeature);
  protected currentUser = this.store.selectSignal(selectCurrentUser);
  protected hideEnterpriseFeatures = this.store.selectSignal(selectHideEnterpriseFeatures);
  protected darkTheme = this.store.selectSignal(selectDarkTheme);

  private resize = toSignal(fromEvent(window, 'resize'));
  protected scrolling = computed(() => {
    this.resize();
    return this.container()?.nativeElement.scrollHeight > this.container()?.nativeElement.clientHeight
  });

  public resetSearch() {
    this.store.dispatch(searchDeactivate());
  }
}
