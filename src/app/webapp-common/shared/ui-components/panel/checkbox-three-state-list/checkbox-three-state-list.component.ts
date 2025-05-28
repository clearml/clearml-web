import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {excludedKey} from '@common/shared/utils/tableParamEncode';
import {addOrRemoveFromArray} from '@common/shared/utils/shared-utils';
import {MatCheckboxChange, MatCheckboxModule} from '@angular/material/checkbox';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

import {MatMenuModule} from '@angular/material/menu';


const separateValueAndExcludeFromFilters=(filters: string[])=> filters.reduce((state, currentFilter) => {
  if (currentFilter === null || !currentFilter.startsWith(excludedKey)) {
    state.value.push(currentFilter);
  } else {
    state.exclude.push(currentFilter.substring(excludedKey.length));
  }
  return state;
}, {value: [], exclude: []});


export enum CheckboxState {
  empty,
  checked,
  exclude
}

@Component({
    selector: 'sm-checkbox-three-state-list',
    templateUrl: './checkbox-three-state-list.component.html',
    styleUrls: ['./checkbox-three-state-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatCheckboxModule,
        TooltipDirective,
        ShowTooltipIfEllipsisDirective,
        MatProgressSpinnerModule,
        MatMenuModule
    ]
})
export class CheckboxThreeStateListComponent {
  @Input() options: { label: string; value: string; tooltip?: string }[];
  @Input() supportExcludeFilter: boolean;

  @Input() set checkedList(checkedList: string[]) {
    if (Array.isArray(checkedList)) {
      if (this.supportExcludeFilter) {
        const {value, exclude} = separateValueAndExcludeFromFilters(checkedList);
        this._checkedList = value;
        this.indeterminateState = {};
        this.excludeList = exclude;
        return;
      }
      this._checkedList = checkedList;
    } else {
      this._checkedList = checkedList;
    }
  }

  get checkedList() {
    return this._checkedList;
  }

  @Output() filterChanged = new EventEmitter();

  get excludeList() {
    return this._excludeList;
  }

  set excludeList(excludeList: string[]) {
    this._excludeList = excludeList;
    (excludeList || []).forEach(_value => this.indeterminateState[_value] = CheckboxState.exclude);
  }

  public indeterminateState: Record<string, CheckboxState> = {};
  public checkboxState = CheckboxState;
  public trackByValFn = (index, item) => item.value;

  private _checkedList: string[];
  private _excludeList: string[];

  onFilterChanged(val: MatCheckboxChange) {
    if (val) {
      if (this.supportExcludeFilter && val.source.value !== null) {
        this.checkIndeterminateStateAndEmit(val);
        return;
      }

      const newValues = this.checkedList? addOrRemoveFromArray<string>(this.checkedList, val.source.value) : [val.source.value];
      this.emitFilterChanged(newValues);
    }
  }

  emitFilterChanged(values?: string[], exclude = '') {
    const value = this.supportExcludeFilter
      ? [...(values || this.checkedList || []), ...this.getExcludedValues(exclude)]
      : values;
    this.filterChanged.emit(value);
  }

  private getExcludedValues(exclude) {
    return (this._excludeList || []).concat(exclude).filter(Boolean).map(_exclude => excludedKey + _exclude);
  }

  private checkIndeterminateStateAndEmit(val: MatCheckboxChange) {
    const value = val.source.value;
    const indeterminateCurrentState =
      this.indeterminateState[value] || (this.checkedList?.find(v => v === value) ? CheckboxState.checked : CheckboxState.empty);

    switch (indeterminateCurrentState) {
      case CheckboxState.checked: {
        val.source.checked = true;
        this.indeterminateState[value] = CheckboxState.exclude;
        const newValues = this.checkedList?.filter(v => v !== value);
        this.emitFilterChanged(newValues, value);
        break;
      }
      case CheckboxState.exclude:
        val.source.checked = true;
        this.indeterminateState[value] = CheckboxState.empty;
        this._excludeList = this.excludeList.filter(exclude => exclude !== value);
        this.emitFilterChanged();
        break;
      case CheckboxState.empty:
      default: {
        this.indeterminateState[value] = CheckboxState.checked;
        const newValues: string[] = this.checkedList ? addOrRemoveFromArray(this.checkedList, value) : [value];
        this.emitFilterChanged(newValues);
      }
    }
    return;
  }
}


