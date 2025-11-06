import {ChangeDetectionStrategy, Component} from '@angular/core';
import {QueuesMenuComponent} from '@common/workers-and-queues/dumb/queues-menu/queues-menu.component';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {MatDivider} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'sm-queues-menu-extended',
  templateUrl: '../../../webapp-common/workers-and-queues/dumb/queues-menu/queues-menu.component.html',
  styleUrls: ['../../../webapp-common/workers-and-queues/dumb/queues-menu/queues-menu.component.scss'],
  imports: [
    MenuItemComponent,
    MenuComponent,
    MatIconModule,
    RouterLink,
    MatDivider,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QueuesMenuExtendedComponent extends QueuesMenuComponent{
  set contextMenu(data) {}
  get contextMenu() {
    return this;
  }
}
