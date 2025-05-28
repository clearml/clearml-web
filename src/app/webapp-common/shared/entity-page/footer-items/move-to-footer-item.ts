import {ItemFooterModel, IFooterState} from './footer-items.models';
import {IconNames, ICONS} from '@common/constants';
import {MenuItems} from '../items.utils';

export class MoveToFooterItem extends ItemFooterModel {
  constructor() {
    super();
    this.id = MenuItems.moveTo;
    this.emit = true;
    this.icon = ICONS.MOVE_TO as Partial<IconNames>;
    this.disableDescription = 'Move To';
  }

  getItemState(state: IFooterState<{id: string}>): { icon?: IconNames; title?: string; description?: string; disable?: boolean; disableDescription?: string; emit?: boolean; emitValue?: boolean; preventCurrentItem?: boolean; class?: string; wrapperClass?: string } {
    return {
      disable: state.data[this.id]?.disable,
      description: this.menuItemText.transform(state.data[MenuItems.moveTo]?.available, 'Move To') ,
      // disableDescription: selectionIsOnlyExamples ? 'Move To' : this.disableDescription
    };
  }
}
