import {ItemFooterModel, IFooterState} from './footer-items.models';
import {IconNames, ICONS} from '@common/constants';

export class HasReadOnlyFooterItem extends ItemFooterModel {
  override id = 'exampleItem';
  override emit = true;
  override icon = ICONS.ALERT as Partial<IconNames>;
  override description = `Selected read-only items cannot be modified`;
  override warning = true;

  getItemState(state: IFooterState<{id: string}>): { icon?: IconNames; title?: string; description?: string; disable?: boolean; disableDescription?: string; emit?: boolean; emitValue?: boolean; preventCurrentItem?: boolean; class?: string; wrapperClass?: string } {
    return {
      preventCurrentItem: !state.selectionHasExample,
      title: `Selected read-only items cannot be modified`
    };
  }
}
