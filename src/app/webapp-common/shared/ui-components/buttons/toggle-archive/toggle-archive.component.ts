import {Component, input, output } from '@angular/core';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';


@Component({
    selector: 'sm-toggle-archive',
    templateUrl: './toggle-archive.component.html',
    styleUrls: ['./toggle-archive.component.scss'],
    imports: [
        TooltipDirective,
        MatButton,
        MatIcon
    ]
})
export class ToggleArchiveComponent {
  showArchived = input<boolean>();
  minimize = input<boolean>();
  toggleArchived = output<boolean>();
}
