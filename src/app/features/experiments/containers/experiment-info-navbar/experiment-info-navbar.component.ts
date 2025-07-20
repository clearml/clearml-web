import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {infoTabLinks} from '~/features/experiments/experiments.consts';


@Component({
    selector: 'sm-experiment-info-navbar',
    templateUrl: './experiment-info-navbar.component.html',
    styleUrls: ['./experiment-info-navbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ExperimentInfoNavbarComponent {

  splitSize = input<number>();
  minimized = input.required<boolean>();

  links = computed(() => infoTabLinks.map(link => ({
    ...link,
    url: link.url
  })));
}
