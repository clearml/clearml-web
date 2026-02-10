import {Component, computed} from '@angular/core';
import {ExperimentMenuComponent} from '@common/experiments/shared/components/experiment-menu/experiment-menu.component';
import {MatIconModule} from '@angular/material/icon';
import {TagsMenuComponent} from '@common/shared/ui-components/tags/tags-menu/tags-menu.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatIconButton} from '@angular/material/button';
import {MenuItemTextPipe} from '@common/shared/pipes/menu-item-text.pipe';
import {SelectQueueModule} from '@common/experiments/shared/components/select-queue/select-queue.module';

@Component({
  selector: 'sm-experiment-menu-extended',
  templateUrl: '../../../../webapp-common/experiments/shared/components/experiment-menu/experiment-menu.component.html',
  styleUrls: ['../../../../webapp-common/experiments/shared/components/experiment-menu/experiment-menu.component.scss'],
  imports: [
    MatIconModule,
    TagsMenuComponent,
    TooltipDirective,
    ShowTooltipIfEllipsisDirective,
    MatMenuItem,
    MatMenuTrigger,
    MatMenu,
    MatIconButton,
    MenuItemTextPipe,
    SelectQueueModule
  ]
})
export class ExperimentMenuExtendedComponent extends ExperimentMenuComponent{
  contextMenu = computed(() => this as ExperimentMenuComponent);
}
