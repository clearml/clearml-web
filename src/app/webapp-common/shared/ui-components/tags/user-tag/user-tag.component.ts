import {Component, Output, EventEmitter, input, ChangeDetectionStrategy} from '@angular/core';
import {TagColor} from '@common/core/actions/projects.actions';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';

import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

@Component({
    selector: 'sm-user-tag',
    templateUrl: './user-tag.component.html',
    styleUrls: ['./user-tag.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        TooltipDirective,
        MatProgressSpinnerModule
    ]
})
export class UserTagComponent {
  caption = input<string>();
  colors = input<TagColor>();
  foreground = input<string>();
  tooltip = input<boolean>();
  disabledRemove = input<string>();
  readonly = input<boolean>(false);
  @Output() remove = new EventEmitter<string>();
  @Output() add = new EventEmitter<MouseEvent>();

  onRemoveClicked(caption: string) {
    this.remove.emit(caption);
  }
}
