import {Component, inject, output, input } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Queue} from '@common/workers-and-queues/actions/queues.actions';

@Component({
    selector: 'sm-queues-menu',
    templateUrl: './queues-menu.component.html',
    styleUrls: ['./queues-menu.component.scss'],
    standalone: false
})
export class QueuesMenuComponent  {
  private route = inject(ActivatedRoute);

  protected queuesManager = this.route.snapshot.data.queuesManager;

  menuOpen = input<boolean>();
  selectedQueue = input<Queue>();
  menuPosition = input<{x: number; y: number}>();
  deleteQueue = output<Queue>();
  renameQueue = output<Queue>();
  clearQueue = output<Queue>();
}
