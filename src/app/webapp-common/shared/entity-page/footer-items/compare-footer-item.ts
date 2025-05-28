import {IconNames, ICONS} from '@common/constants';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {MenuItems} from '../items.utils';
import { ItemFooterModel} from './footer-items.models';
export const compareLimitations = 100;
export class CompareFooterItem extends ItemFooterModel  {
  override id = MenuItems.compare;
  override icon = ICONS.COMPARE as Partial<IconNames>;
  override class = 'compare';
  override title = 'COMPARE';
  override emit = true;

  constructor(public entitiesType: EntityTypeEnum) {
    super();
    this.disableDescription = `${compareLimitations} or fewer ${this.entitiesType}s can be compared`;
  }
  getItemState(state) {
    return {
      disable: state.selected.length > compareLimitations || state.selected?.length <2,
    };

  }
}
