import {Component, input, output} from '@angular/core';
import {MatIcon} from '@angular/material/icon';
import {
  MiniTagsListComponent
} from '@common/shared/ui-components/tags/user-tag/mini-tags-list/mini-tags-list.component';
import {StatusIconLabelComponent} from '@common/shared/experiment-status-icon-label/status-icon-label.component';

@Component({
  selector: 'sm-result-line',
  imports: [
    MatIcon,
    MiniTagsListComponent,
    StatusIconLabelComponent
  ],
  templateUrl: './result-line.component.html',
  styleUrl: './result-line.component.scss'
})
export class ResultLineComponent {

  public position = {x: 0, y: 0};


  fontIcon = input.required<string>();
  label = input.required<string>();
  status = input<string>();
  statusOptionsLabels = input.required<Record<string, string>>();

  tags = input.required<string[]>();

  itemSelected = output();
  toggleItemHoverActive = output<boolean>();

  itemClicked() {
    this.itemSelected.emit();
  }
}
