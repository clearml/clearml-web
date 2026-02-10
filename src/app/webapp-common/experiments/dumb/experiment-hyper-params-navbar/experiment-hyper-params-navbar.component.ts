import {ChangeDetectionStrategy, Component, input, output, computed} from '@angular/core';
import {Params, RouterLink} from '@angular/router';
import {MatExpansionPanel, MatExpansionPanelHeader} from '@angular/material/expansion';
import {FilterOutPipe} from '@common/shared/pipes/filterOut.pipe';
import {ReplaceViaMapPipe} from '@common/shared/pipes/replaceViaMap';
import {SortPipe} from '@common/shared/pipes/sort.pipe';
import {safeAngularUrlParameterPipe} from '@common/shared/pipes/safeAngularUrlParameter.pipe';
import {KeyValuePipe} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'sm-experiment-hyper-params-navbar',
  templateUrl: './experiment-hyper-params-navbar.component.html',
  styleUrls: ['./experiment-hyper-params-navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    MatExpansionPanelHeader,
    MatExpansionPanel,
    RouterLink,
    SortPipe,
    FilterOutPipe,
    safeAngularUrlParameterPipe,
    ReplaceViaMapPipe,
    KeyValuePipe
  ]
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
