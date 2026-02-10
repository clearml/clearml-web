import {ChangeDetectionStrategy, Component} from '@angular/core';
import {ExperimentMenuComponent} from '@common/experiments/shared/components/experiment-menu/experiment-menu.component';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {TagsMenuComponent} from '@common/shared/ui-components/tags/tags-menu/tags-menu.component';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MenuItemTextPipe} from '@common/shared/pipes/menu-item-text.pipe';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'sm-open-dataset-version-menu',
  templateUrl: './open-dataset-version-menu.component.html',
  styleUrls: ['../../experiments/shared/components/experiment-menu/experiment-menu.component.scss', './open-dataset-version-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TagsMenuComponent,
    MatIconModule,
    MatMenuTrigger,
    MatMenuItem,
    MatMenu,
    MenuItemTextPipe
  ]
})
export class OpenDatasetVersionMenuComponent extends ExperimentMenuComponent {
  entityTypeEnum = EntityTypeEnum;
}
