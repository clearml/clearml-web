import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {Project} from '~/business-logic/model/projects/project';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';

@Component({
  selector: 'sm-project-selected-row',
  standalone: true,
  templateUrl: './project-selected-row.component.html',
  styleUrls: ['./project-selected-row.component.scss'],
  imports: [
    MatIcon,
    MatIconButton,
    ShowTooltipIfEllipsisDirective,
    TooltipDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectSelectedRowComponent {
  project = input<Project>();
  hideTrash = input(false);
  toggleSelection = output();
}
