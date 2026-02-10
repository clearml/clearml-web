import {Component, signal} from '@angular/core';
import {ModelMenuComponent} from '@common/models/containers/model-menu/model-menu.component';
import {TagsMenuComponent} from '@common/shared/ui-components/tags/tags-menu/tags-menu.component';
import {MatIconModule} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MenuItemTextPipe} from '@common/shared/pipes/menu-item-text.pipe';

@Component({
  selector: 'sm-model-menu-extended',
  templateUrl: '../../../../webapp-common/models/containers/model-menu/model-menu.component.html',
  styleUrls: ['../../../../webapp-common/models/containers/model-menu/model-menu.component.scss'],
  imports: [
    TagsMenuComponent,
    MatIconModule,
    MatIconButton,
    MatMenuTrigger,
    MatMenuItem,
    MatMenu,
    MenuItemTextPipe
  ]
})
export class ModelMenuExtendedComponent extends ModelMenuComponent {

  contextMenu = signal(this);
}
