import {ChangeDetectorRef, Component, HostListener, OnInit, input, output, inject } from '@angular/core';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {MatDialog} from '@angular/material/dialog';
import {Queue} from '~/business-logic/model/queues/queue';
import {BlTasksService} from '~/business-logic/services/tasks.service';
import {SelectQueueComponent} from '@common/experiments/shared/components/select-queue/select-queue.component';
import {Task} from '~/business-logic/model/tasks/task';

@Component({
    selector: 'sm-queue-info',
    templateUrl: './queue-info.component.html',
    styleUrls: ['./queue-info.component.scss'],
    standalone: false
})
export class QueueInfoComponent implements OnInit {
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
    count: number;
  }>();

  public activeTab: string;
  public menuSelectedExperiment: Task;
  public menuOpen: boolean;
  public menuPosition: { x: number; y: number };
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
      this.menuOpen = false;
    }
  }

  get routerTab() {
    const url = new URL(window.location.href);
    return url.searchParams.get('tab');
  }

  ngOnInit() {
    this.activeTab = this.routerTab === 'workers' ? 'workers' : 'tasks';
  }

  findQueueById(id) {
    return this.queues().find(queue => queue.id === id);
  }

  deselectQueueClicked() {
    this.deselectQueue.emit();
  }

  experimentDropped($event: CdkDragDrop<unknown>) {
    this.moveExperimentInQueue.emit({
      task: (this.selectedQueue().entries[$event.previousIndex].task as Task).id,
      count: ($event.currentIndex - $event.previousIndex)
    });
    moveItemInArray(this.selectedQueue().entries, $event.previousIndex, $event.currentIndex);
  }

  openContextMenu(e, task) {
    this.menuSelectedExperiment = task;
    e.preventDefault();
    this.menuOpen = false;
    setTimeout(() => {
      this.menuPosition = {x: e.clientX, y: e.clientY};
      this.menuOpen     = true;
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
