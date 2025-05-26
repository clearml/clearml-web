import {ItemFooterModel, IFooterState} from './footer-items.models';
import {TaskStatusEnum} from '~/business-logic/model/tasks/taskStatusEnum';
import {MenuItems} from '../items.utils';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {IconNames, ICONS} from '@common/constants';

export class ResetFooterItem<T extends {status: TaskStatusEnum}> extends ItemFooterModel {

  constructor(public entitiesType: EntityTypeEnum) {
    super();
    this.id = MenuItems.reset;
    this.emit = true;
    this.icon = ICONS.RESET as Partial<IconNames>;
  }

  getItemState(state: IFooterState<{id: string}>): { icon?: IconNames; title?: string; description?: string; disable?: boolean; disableDescription?: string; emit?: boolean; emitValue?: boolean; preventCurrentItem?: boolean; class?: string; wrapperClass?: string } {
    return {
      disable: state.data[this.id]?.disable,
      description: this.menuItemText.transform(state.data[this.id]?.available, 'Reset'),
      disableDescription: state.selectionIsOnlyExamples ? 'Reset' : `You can only reset non-draft, non-published ${this.entitiesType}s`
    };
  }
}
