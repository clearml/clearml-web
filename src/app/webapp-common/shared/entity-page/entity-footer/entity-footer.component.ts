import {ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {IFooterState, ItemFooterModel} from '../footer-items/footer-items.models';
import {BaseContextMenuComponent} from '@common/shared/components/base-context-menu/base-context-menu.component';
import {ICONS} from '@common/constants';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatMenuModule} from '@angular/material/menu';
import {TagsMenuComponent} from '@common/shared/ui-components/tags/tags-menu/tags-menu.component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

@Component({
    selector: 'sm-entity-footer',
    templateUrl: './entity-footer.component.html',
    styleUrls: ['./entity-footer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        TooltipDirective,
        MatMenuModule,
        TagsMenuComponent,
        MatButton,
        MatIconButton,
        MatIcon
    ]
})
export class EntityFooterComponent<E extends {id: string}> extends BaseContextMenuComponent {

  entitiesType = input<EntityTypeEnum>();
  footerItems = input<ItemFooterModel[]>([]);
  footerState = input<IFooterState<E>>();
  footerItemClick = output<{
        item: ItemFooterModel;
        emitValue: any;
    }>();
  tagSelected = output<{tag: string, emitValue: any}>();

  icons = ICONS;
}
