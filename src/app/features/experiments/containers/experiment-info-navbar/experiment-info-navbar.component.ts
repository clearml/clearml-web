import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {infoTabLinks} from '~/features/experiments/experiments.consts';
import {RouterTabNavBarComponent} from '@common/shared/components/router-tab-nav-bar/router-tab-nav-bar.component';


@Component({
  selector: 'sm-experiment-info-navbar',
  templateUrl: './experiment-info-navbar.component.html',
  styleUrls: ['./experiment-info-navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterTabNavBarComponent
  ]
})
export class ExperimentInfoNavbarComponent {

  splitSize = input<number>();
  minimized = input.required<boolean>();

  links = computed(() => infoTabLinks.map(link => ({
    ...link,
    url: link.url
  })));
}
