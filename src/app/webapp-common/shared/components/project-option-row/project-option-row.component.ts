import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {Project} from '~/business-logic/model/projects/project';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {SearchTextDirective} from '@common/shared/ui-components/directives/searchText.directive';

export interface ProjectWithSelected extends Project {
  selected?: boolean;
}

@Component({
    selector: 'sm-project-option-row',
    standalone: true,
    templateUrl: './project-option-row.component.html',
    styleUrls: ['./project-option-row.component.scss'],
  imports: [
    MatCheckboxModule,
    ShowTooltipIfEllipsisDirective,
    TooltipDirective,
    SearchTextDirective
  ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectOptionRowComponent {
  project = input<ProjectWithSelected>();
  selected = input<boolean>();
  optionClicked = output<MouseEvent>();
  toggleSelection = output();
  searchedText = input<string>();
}
