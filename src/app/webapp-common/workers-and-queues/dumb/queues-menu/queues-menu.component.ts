import {ChangeDetectionStrategy, Component, inject, input, output} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {Queue} from '@common/workers-and-queues/actions/queues.actions';
import {BaseContextMenuComponent} from '@common/shared/components/base-context-menu/base-context-menu.component';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {MatIconModule} from '@angular/material/icon';
import {MatDivider} from '@angular/material/divider';

@Component({
  selector: 'sm-queues-menu',
  templateUrl: './queues-menu.component.html',
  styleUrls: ['./queues-menu.component.scss'],
  imports: [
    MenuItemComponent,
    MenuComponent,
    MatIconModule,
    RouterLink,
    MatDivider,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QueuesMenuComponent extends BaseContextMenuComponent{
  private route = inject(ActivatedRoute);

  protected queuesManager = this.route.snapshot.data.queuesManager;

  menuOpen = input<boolean>();
  selectedQueue = input<Queue>();
  menuPosition = input<{x: number; y: number}>();
  deleteQueue = output<Queue>();
  renameQueue = output<Queue>();
  clearQueue = output<Queue>();
}
