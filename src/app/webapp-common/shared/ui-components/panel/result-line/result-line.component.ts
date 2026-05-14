import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatIcon} from '@angular/material/icon';
import {
  MiniTagsListComponent
} from '@common/shared/ui-components/tags/user-tag/mini-tags-list/mini-tags-list.component';
import {StatusIconLabelComponent} from '@common/shared/experiment-status-icon-label/status-icon-label.component';

@Component({
  selector: 'sm-result-line',
  templateUrl: './result-line.component.html',
  styleUrl: './result-line.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIcon,
    MiniTagsListComponent,
    StatusIconLabelComponent
  ],
})
export class ResultLineComponent {
  fontIcon = input.required<string>();
  label = input.required<string>();
  status = input<string>();
  statusOptionsLabels = input.required<Record<string, string>>();
  tags = input<string[]>();
  itemSelected = output();
  toggleItemHoverActive = output<boolean>();
}
