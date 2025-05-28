import {Component, computed} from '@angular/core';
import {ExperimentMenuComponent} from '@common/experiments/shared/components/experiment-menu/experiment-menu.component';

@Component({
    selector: 'sm-experiment-menu-extended',
    templateUrl: '../../../../webapp-common/experiments/shared/components/experiment-menu/experiment-menu.component.html',
    styleUrls: ['../../../../webapp-common/experiments/shared/components/experiment-menu/experiment-menu.component.scss'],
    standalone: false
})
export class ExperimentMenuExtendedComponent extends ExperimentMenuComponent{
  contextMenu = computed(() => this as ExperimentMenuComponent);
}
