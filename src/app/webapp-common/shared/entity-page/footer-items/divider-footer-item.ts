import {GenericFooterItem} from './generic-footer-item';

export class DividerFooterItem extends GenericFooterItem {
  override id = 'divider'
  override divider = true;

  override getItemState()
  {
    return {};
  }
}
