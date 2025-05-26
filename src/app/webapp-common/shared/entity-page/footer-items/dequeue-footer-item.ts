import {ItemFooterModel, IFooterState} from './footer-items.models';
import {IconNames, ICONS} from '@common/constants';
import {MenuItems} from '../items.utils';

export class DequeueFooterItem extends ItemFooterModel {

  constructor() {
    super();
    this.id = MenuItems.dequeue;
    this.emit = true;
    this.icon = ICONS.DEQUEUE as Partial<IconNames>;
  }

  getItemState(state: IFooterState<{id: string}>): { icon?: IconNames; title?: string; description?: string; disable?: boolean; disableDescription?: string; emit?: boolean; emitValue?: boolean; preventCurrentItem?: boolean; class?: string; wrapperClass?: string } {
    const dequeue = state.data[this.id];
    return {
      preventCurrentItem: dequeue?.disable,
      disable:  dequeue?.disable,
      description: this.menuItemText.transform(dequeue?.available, 'Dequeue'),
      disableDescription: state.selectionIsOnlyExamples ? 'Dequeue' : `You can only dequeue tasks with ‘Pending’ status`
    };
  }
}
