import {ItemFooterModel, IFooterState} from './footer-items.models';
import {IconNames, ICONS} from '@common/constants';
import {MenuItems, selectionDisabledAbort} from '../items.utils';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';

export class AbortFooterItem extends ItemFooterModel {

  constructor(public entitiesType: EntityTypeEnum) {
    super();
    this.id = MenuItems.abort;
    this.emit = true;
    this.icon = ICONS.STOPPED as Partial<IconNames>;
  }
  getItemState(state: IFooterState<{id: string}>) {
    const {available, disable} = selectionDisabledAbort(state.selected);
    return {
      disable,
      description: `Abort (${available} items)`,
      disableDescription: state.selectionIsOnlyExamples ? 'Abort' : `You can only abort ${this.entitiesType}s with ‘Running’ status`
    };
  }
}
