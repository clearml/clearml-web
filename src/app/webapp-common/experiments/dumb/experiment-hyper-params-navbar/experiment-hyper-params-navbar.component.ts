import {ChangeDetectionStrategy, Component, input, output, computed} from '@angular/core';
import {Params} from '@angular/router';

@Component({
    selector: 'sm-experiment-hyper-params-navbar',
    templateUrl: './experiment-hyper-params-navbar.component.html',
    styleUrls: ['./experiment-hyper-params-navbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ExperimentHyperParamsNavbarComponent {
  sectionReplaceMap= {
    _legacy:'General',
    properties: 'User Properties',
    design: 'General'
  };
  hyperParams = input<Record<string, any>>();
  configuration = input<Record<string, any>>();
  selectedObject = input();
  routerConfig = input<string>();
  disableAdd = input(true);
  routerParams = input<Params>();
  artifactSelected = output();

  protected selectedHyperParam = computed(() => this.routerParams()?.hyperParamId || null);
  protected selected = computed(() => this.routerParams() ? decodeURIComponent(this.routerParams()?.configObject) : this.selectedObject());
}
