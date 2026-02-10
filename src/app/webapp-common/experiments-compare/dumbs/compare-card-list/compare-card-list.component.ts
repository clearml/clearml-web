import {Component, ContentChild, EventEmitter, Input, Output, TemplateRef, ViewChild} from '@angular/core';
import {CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray} from '@angular/cdk/drag-drop';
import {Task} from '~/business-logic/model/tasks/task';
import {CompareCardBodyDirective} from '../compare-card-body.directive';
import {CompareCardExtraHeaderDirective} from '../compare-card-extra-header.directive';
import {CompareCardHeaderDirective} from '../compare-card-header.directive';
import {IExperimentDetail} from '~/features/experiments-compare/experiments-compare-models';
import {DrawerComponent} from '@common/shared/ui-components/panel/drawer/drawer.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {NgTemplateOutlet} from '@angular/common';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {CardComponent2} from '@common/shared/ui-components/panel/card2/card-component2.component';

@Component({
  selector: 'sm-compare-card-list',
  templateUrl: './compare-card-list.component.html',
  styleUrls: ['./compare-card-list.component.scss'],
  imports: [
    DrawerComponent,
    MatIconModule,
    TooltipDirective,
    CdkDrag,
    CdkDropList,
    CdkDragHandle,
    NgTemplateOutlet,
    MatIconButton,
    CardComponent2
  ]
})
export class CompareCardListComponent {

  @Input() experiments: IExperimentDetail[];
  @Input() tasksLimitExceeded: boolean;
  @Input() baseExperiment: IExperimentDetail;
  @Output() experimentListChanged = new EventEmitter<IExperimentDetail[]>();
  @Output() toggled = new EventEmitter<boolean>();

  @ContentChild(CompareCardBodyDirective, { read: TemplateRef }) bodyTemplate;
  @ContentChild(CompareCardExtraHeaderDirective, { read: TemplateRef }) extraHeaderTemplate;
  @ContentChild(CompareCardHeaderDirective, { read: TemplateRef }) headerTemplate;

  @ViewChild('detailsContainer', {static: true}) detailsContainer;

  hovered = [];

  constructor() {
  }

  experimentRemoved(experiment: IExperimentDetail) {
    this.experimentListChanged.emit(this.experiments.filter(exp => exp !== experiment));
  }

  setAsBase(experiment: IExperimentDetail) {
    this.detailsContainer.nativeElement.scrollLeft = 0;
    this.reorderExperiments(this.experiments.indexOf(experiment), 0);
  }

  reorderExperiments(prevIndex, currentIndex) {
    const newExperiments = [].concat(this.experiments);
    moveItemInArray(newExperiments, prevIndex, currentIndex);
    this.experimentListChanged.emit(newExperiments);
  }

  drop(e: CdkDragDrop<Task[]>) {
    if (e.previousIndex === e.currentIndex) { return; }
    this.reorderExperiments(e.previousIndex, e.currentIndex);
  }

  trackByFn(index, item) {
    return item.id;
  }

  changeHovered(i, val) {
    this.hovered[i] = val;
  }
}
