import {IconNames} from '@common/constants';
import {Observable, of} from 'rxjs';
import { MenuItemTextPipe } from '@common/shared/pipes/menu-item-text.pipe';

export interface ItemState {
  icon?: IconNames;
  title?: string;
  description?: string;
  disable?: boolean;
  disableDescription?: string;
  emit?: boolean;
  emitValue?: unknown;
  preventCurrentItem?: boolean;
  class?: string;
  wrapperClass?: string;
  tags?: string[];
  tagSelected?: string[];
  projectTags?: string[];
  companyTags?: string[];
  tagsFilterByProject?: boolean;
}

export interface IItemFooterState {
  icon?: Partial<IconNames>;
  title?: string;
  description?: string;
  emitValue?: unknown;
  disableDescription?: string;
  disable?: boolean;
  class?: string;
  preventCurrentItem?: boolean;
}

export abstract class ItemFooterModel {
  id: string;
  icon: IconNames;
  title: string;
  description: string;
  disable: boolean;
  disableDescription: string;
  emit = true;
  isTag?: boolean;
  divider?: boolean;
  class = '';
  wrapperClass = '';
  state$: Observable<IItemFooterState> = of({});
  tags$?: Observable<string[]>;
  companyTags$?:   Observable<string[]>;
  projectTags$?: Observable<string[]>;
  tagsFilterByProject$?: Observable<boolean>;

  menuItemText = new MenuItemTextPipe();
  abstract getItemState(state: IFooterState<{id: string}>): ItemState;
}

export interface IFooterState<T extends {id: string}> {
  selectionHasExample: boolean;
  selectionAllHasExample: boolean;
  selected: T[];
  showAllSelectedIsActive: boolean;
  selectionAllIsArchive: boolean;
  selectionIsOnlyExamples: boolean;
  data: Record<string, {  available: number; disable: boolean; selectedFiltered: T[] }>;
  companyTags: string[];
  projectTags: string[];
  tagsFilterByProject: boolean;
}










