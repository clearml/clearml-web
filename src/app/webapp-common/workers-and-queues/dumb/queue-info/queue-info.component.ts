import {
  ChangeDetectorRef,
  Component,
  HostListener,
  input,
  output,
  inject,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {MatDialog} from '@angular/material/dialog';
import {Queue} from '~/business-logic/model/queues/queue';
import {BlTasksService} from '~/business-logic/services/tasks.service';
import {SelectQueueComponent} from '@common/experiments/shared/components/select-queue/select-queue.component';
import {Task} from '~/business-logic/model/tasks/task';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {RouterLink} from '@angular/router';
import {SimpleTableComponent} from '@common/shared/ui-components/data/simple-table/simple-table.component';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatIconButton} from '@angular/material/button';
import {MatTab, MatTabGroup} from '@angular/material/tabs';
import {MatIconModule} from '@angular/material/icon';
import {SelectQueueModule} from '@common/experiments/shared/components/select-queue/select-queue.module';

@Component({
  selector: 'sm-queue-info',
  templateUrl: './queue-info.component.html',
  styleUrls: ['./queue-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MenuItemComponent,
    MenuComponent,
    RouterLink,
    SimpleTableComponent,
    MatIconModule,
    ShowTooltipIfEllipsisDirective,
    TooltipDirective,
    MatIconButton,
    MatTab,
    MatTabGroup,
    SelectQueueModule
  ]
})
export class QueueInfoComponent {
  private changeDetector = inject(ChangeDetectorRef);
  private blTaskService = inject(BlTasksService);
  private dialog = inject(MatDialog);

  selectedQueue = input<Queue>();
  queues = input<Queue[]>();
  deselectQueue = output();
  moveExperimentToTopOfQueue = output<Task>();
  moveExperimentToBottomOfQueue = output<Task>();
  moveExperimentToOtherQueue = output<{queue: Queue, task: Task}>();
  removeExperimentFromQueue = output<Task>();
  moveExperimentInQueue = output<{
    task: string;
    current: number;
    previous: number;
  }>();

  public menuSelectedExperiment: Task;
  public menuOpen = signal(false);
  public menuPosition = signal<{ x: number; y: number }>(null);
  public readonly experimentsCols = [
    {header: '', class: ''},
    {header: '', class: ''},
  ];
  public readonly workersCols     = [
    {header: 'NAME', class: ''},
    {header: 'IP', class: ''},
    {header: 'CURRENTLY EXECUTING', class: ''},
  ];

  @HostListener('document:click', ['$event'])
  clickHandler(event) {
    if (event.button != 2) { // Bug in firefox: right click triggers `click` event
      this.menuOpen.set(false);
    }
  }

  get routerTab() {
    const url = new URL(window.location.href);
    return url.searchParams.get('tab');
  }

  findQueueById(id) {
    return this.queues().find(queue => queue.id === id);
  }

  deselectQueueClicked() {
    this.deselectQueue.emit();
  }

  experimentDropped(event: CdkDragDrop<unknown>) {
    this.moveExperimentInQueue.emit({
      task: (this.selectedQueue().entries[event.previousIndex].task as Task).id,
      current: event.currentIndex,
      previous: event.previousIndex
    });
  }

  openContextMenu(e, task) {
    this.menuSelectedExperiment = task;
    e.preventDefault();
    this.menuOpen.set(false);
    setTimeout(() => {
      this.menuPosition.set({x: e.clientX, y: e.clientY});
      this.menuOpen.set(true);
      this.changeDetector.detectChanges();
    }, 0);
  }

  moveToTop() {
    this.moveExperimentToTopOfQueue.emit(this.menuSelectedExperiment);
  }

  moveToBottom() {
    this.moveExperimentToBottomOfQueue.emit(this.menuSelectedExperiment);

  }

  moveToQueue() {
    this.enqueuePopup();
  }

  removeFromQueue() {
    this.removeExperimentFromQueue.emit(this.menuSelectedExperiment);
  }

  enqueuePopup() {
    this.dialog.open<SelectQueueComponent, unknown, {confirmed?: boolean; queue: Queue}>(SelectQueueComponent, {data: {}}).afterClosed()
      .subscribe((res) => {
        if (res?.confirmed) {
          this.moveExperimentToOtherQueue.emit({queue: res.queue, task: this.menuSelectedExperiment});
          this.blTaskService.setPreviouslyUsedQueue(res.queue);
        }
      });
  }
}
