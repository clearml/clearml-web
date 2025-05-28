import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {IFooterState, ItemFooterModel} from './footer-items.models';
import {MenuItems} from '../items.utils';

export class ShowItemsFooterSelected extends ItemFooterModel {

  constructor(public entitiesType: EntityTypeEnum) {
    super();
    this.id = MenuItems.showAllItems;
    this.emit = true;
    this.class = 'show-all';

  }

  getItemState(state: IFooterState<{id: string}>) {
    return {
      title: state.showAllSelectedIsActive ?
        `SHOW ALL ${this.entitiesType.toUpperCase()}S` :
        `SHOW ${state.selected.length} ${this.entitiesType.toUpperCase()}S SELECTED`,
      emitValue: state.showAllSelectedIsActive,
      preventCurrentItem: false
    };
  }
}
