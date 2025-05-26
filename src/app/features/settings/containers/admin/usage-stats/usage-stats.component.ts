import {Component, computed, inject} from '@angular/core';
import {MatSlideToggle, MatSlideToggleChange} from '@angular/material/slide-toggle';
import {Store} from '@ngrx/store';
import {selectAllowed, selectStatsSupported} from '~/core/reducers/usage-stats.reducer';
import { updateUsageStats } from '~/core/actions/usage-stats.actions';
import {ConfigurationService} from '@common/shared/services/configuration.service';


@Component({
    selector: 'sm-usage-stats',
    templateUrl: './usage-stats.component.html',
    styleUrls: ['./usage-stats.component.scss'],
    imports: [
        MatSlideToggle
    ]
})
export class UsageStatsComponent {
  private store = inject(Store);
  private config = inject(ConfigurationService);
  public shown = true;
  public demo = computed(() => this.config.configuration().demo)
  protected allowed = this.store.selectSignal(selectAllowed);
  protected supported = this.store.selectSignal(selectStatsSupported);

  statsChange(toggle: MatSlideToggleChange) {
    this.store.dispatch(updateUsageStats({allowed: toggle.checked}));
  }
}
