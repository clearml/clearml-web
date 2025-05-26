import {Component} from '@angular/core';
import {ExperimentMenuComponent} from '@common/experiments/shared/components/experiment-menu/experiment-menu.component';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';

@Component({
    selector: 'sm-open-dataset-version-menu',
    templateUrl: './open-dataset-version-menu.component.html',
    styleUrls: ['../../experiments/shared/components/experiment-menu/experiment-menu.component.scss', './open-dataset-version-menu.component.scss'],
    standalone: false
})
export class OpenDatasetVersionMenuComponent extends ExperimentMenuComponent {
  entityTypeEnum = EntityTypeEnum;
}
