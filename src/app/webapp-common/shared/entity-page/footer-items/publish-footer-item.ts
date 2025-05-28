import {IFooterState, ItemFooterModel} from './footer-items.models';
import {IconNames, ICONS} from '@common/constants';
import {MenuItems} from '../items.utils';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';

export class PublishFooterItem extends ItemFooterModel {

  constructor(private entityType: EntityTypeEnum) {
    super();
    this.disableDescription = entityType === EntityTypeEnum.experiment ? this.disableDescription : ``;
    this.id = MenuItems.publish;
    this.emit = true;
    this.icon = ICONS.PUBLISHED as Partial<IconNames>;
  }

  getItemState(state: IFooterState<{id: string}>): { icon?: IconNames; title?: string; description?: string; disable?: boolean; disableDescription?: string; emit?: boolean; emitValue?: boolean; preventCurrentItem?: boolean; class?: string; wrapperClass?: string } {
    return {
      disable: state.data[this.id]?.disable,
      description: this.menuItemText.transform(state.data[MenuItems.publish]?.available, 'Publish'),
      disableDescription: state.selectionIsOnlyExamples ? 'Publish' : `You can only publish ${this.entityType}s that have already been executed`
    };
  }
}
