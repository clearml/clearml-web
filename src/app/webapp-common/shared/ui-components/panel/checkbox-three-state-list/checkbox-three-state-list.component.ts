import {ChangeDetectionStrategy, Component, input, linkedSignal, output} from '@angular/core';
import {excludedKey} from '@common/shared/utils/tableParamEncode';
import {addOrRemoveFromArray} from '@common/shared/utils/shared-utils';
import {MatCheckboxChange, MatCheckboxModule} from '@angular/material/checkbox';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

import {MatMenuModule} from '@angular/material/menu';


const separateValueAndExcludeFromFilters=(filters: string[])=> (filters || []).reduce((state, currentFilter) => {
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

interface ProcessedState {
  checkedList: string[];
  excludeList: string[];
  indeterminateState: Record<string, CheckboxState>;
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
  options = input<{ label: string; value: string; tooltip?: string }[]>();
  supportExcludeFilter = input<boolean>();
  checkedList = input<string[]>();
  filterChanged = output<string[]>();

  processedState = linkedSignal<ProcessedState>(() => {
    const list = this.checkedList();
    if (this.supportExcludeFilter()) {
      const {value, exclude} = separateValueAndExcludeFromFilters(list);
      const indeterminateState: Record<string, CheckboxState> = {};
      exclude.forEach(v => indeterminateState[v] = CheckboxState.exclude);
      return { checkedList: value, excludeList: exclude, indeterminateState };
    }
    return { checkedList: list || [], excludeList: [], indeterminateState: {} };
  });

  public checkboxState = CheckboxState;

  onFilterChanged(val: MatCheckboxChange) {
    if (val) {
      if (this.supportExcludeFilter() && val.source.value !== null) {
        this.checkIndeterminateStateAndEmit(val);
        return;
      }

      const newValues = this.processedState().checkedList ? addOrRemoveFromArray<string>(this.processedState().checkedList, val.source.value) : [val.source.value];
      this.emitFilterChanged(newValues);
    }
  }

  emitFilterChanged(values?: string[], exclude = '') {
    const value = this.supportExcludeFilter()
      ? [...(values || this.processedState().checkedList || []), ...this.getExcludedValues(exclude)]
      : values;
    this.filterChanged.emit(value);
  }

  private getExcludedValues(exclude: string) {
    return (this.processedState().excludeList || []).concat(exclude).filter(Boolean).map(_exclude => excludedKey + _exclude);
  }

  private checkIndeterminateStateAndEmit(val: MatCheckboxChange) {
    const value = val.source.value;
    const state = this.processedState();
    const indeterminateCurrentState =
      state.indeterminateState[value] || (state.checkedList?.find(v => v === value) ? CheckboxState.checked : CheckboxState.empty);

    switch (indeterminateCurrentState) {
      case CheckboxState.checked: {
        val.source.checked = true;
        this.processedState.update(curr => ({
          ...curr,
          checkedList: curr.checkedList?.filter(v => v !== value),
          indeterminateState: {...curr.indeterminateState, [value]: CheckboxState.exclude}
        }));
        const newValues = this.processedState().checkedList;
        this.emitFilterChanged(newValues, value);
        break;
      }
      case CheckboxState.exclude:
        val.source.checked = true;
        this.processedState.update(curr => {
          const newExclude = curr.excludeList.filter(exclude => exclude !== value);
          const newIndeterminate = {...curr.indeterminateState};
          delete newIndeterminate[value];
          return {
            ...curr,
            excludeList: newExclude,
            indeterminateState: newIndeterminate
          };
        });
        this.emitFilterChanged();
        break;
      case CheckboxState.empty:
      default: {
        this.processedState.update(curr => ({
          ...curr,
          checkedList: curr.checkedList ? addOrRemoveFromArray(curr.checkedList, value) : [value],
          indeterminateState: {...curr.indeterminateState, [value]: CheckboxState.checked}
        }));
        const newValues: string[] = this.processedState().checkedList;
        this.emitFilterChanged(newValues);
      }
    }
    return;
  }
}


