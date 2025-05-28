import {ItemFooterModel, IFooterState} from './footer-items.models';
import {IconNames, ICONS} from '@common/constants';
import {MenuItems} from '../items.utils';

export class DeleteFooterItem extends ItemFooterModel {

  constructor() {
    super();
    this.id = MenuItems.delete;
    this.emit = true;
    this.icon = ICONS.REMOVE as Partial<IconNames>;
    this.disableDescription = 'Delete';
  }

  getItemState(state: IFooterState<{id: string}>): { icon?: IconNames; title?: string; description?: string; disable?: boolean; disableDescription?: string; emit?: boolean; emitValue?: boolean; preventCurrentItem?: boolean; class?: string; wrapperClass?: string } {
    return {
      preventCurrentItem: !state.selectionAllIsArchive,
      disable: state.data[this.id]?.disable,
      description: this.menuItemText.transform(state.data[MenuItems.delete]?.available , 'Delete'),
    };
  }
}
