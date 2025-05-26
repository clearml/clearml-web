import {IFooterState, ItemFooterModel} from './footer-items.models';
import {IconNames, ICONS} from '@common/constants';
import {MenuItems, selectionDisabledAbortAllChildren} from '../items.utils';

export class AbortAllChildrenFooterItem extends ItemFooterModel {

  constructor() {
    super();
    this.id = MenuItems.abortAllChildren;
    this.emit = true;
    this.icon = ICONS.STOPPED_ALL as Partial<IconNames>;
  }

  getItemState(state: IFooterState<{id: string}>): { icon?: IconNames; title?: string; description?: string; disable?: boolean; disableDescription?: string; emit?: boolean; emitValue?: boolean; preventCurrentItem?: boolean; class?: string; wrapperClass?: string } {
    const {available, disable} = selectionDisabledAbortAllChildren(state.selected);
    return {
      disable,
      description: `Abort all children for (${available} items)`,
      disableDescription: state.selectionIsOnlyExamples ? 'Abort all children' : `You can only abort all children of tasks with Type Controller or Optimizer `
    };
  }

}
