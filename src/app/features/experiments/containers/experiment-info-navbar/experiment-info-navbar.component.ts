import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {Link} from '@common/shared/components/router-tab-nav-bar/router-tab-nav-bar.component';


@Component({
    selector: 'sm-experiment-info-navbar',
    templateUrl: './experiment-info-navbar.component.html',
    styleUrls: ['./experiment-info-navbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ExperimentInfoNavbarComponent {
  public baseInfoRoute: string[];
  private _minimized: boolean;

  links = [
    {name: 'execution', url: ['execution']},
    {name: 'configuration', url: ['hyper-params', 'hyper-param', '_empty_'], activeBy: 'hyper-params'},
    {name: 'artifacts', url: ['artifacts']},
    {name: 'info', url: ['general']},
    {name: 'console', url: ['log'], output: true},
    {name: 'scalars', url: ['metrics','scalar'], output: true},
    {name: 'plots', url: ['metrics','plots'], output: true},
    {name: 'debug samples', url: ['debugImages'], output: true},
  ] as Link[];
  @Input() set minimized(minimized: boolean) {
    this.baseInfoRoute = minimized ? ['info-output'] : [];
    this.links = this.links.map(link => ({
      ...link,
      url: (link as any).output ? this.baseInfoRoute.concat(link.url) : link.url
    }));
    this._minimized = minimized;
  }
  get minimized(){
    return this._minimized;
  }

  @Input() splitSize: number;
}
