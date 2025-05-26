import {ItemFooterModel} from './footer-items.models';
import {IconNames} from '@common/constants';

export class GenericFooterItem extends ItemFooterModel {
  constructor({icon = null,
                title = '',
                disable = false,
                disableDescription = '',
                className = ''
              } = {}) {
    super();
    this.icon = icon;
    this.title = title;
    this.disable = disable;
    this.disableDescription = disableDescription;
    this.class = className;
    this.emit = true;
  }

  getItemState(): { icon?: IconNames; title?: string; description?: string; disable?: boolean; disableDescription?: string; emit?: boolean; emitValue?: boolean; preventCurrentItem?: boolean; class?: string; wrapperClass?: string } {
    return {};
  }
}
