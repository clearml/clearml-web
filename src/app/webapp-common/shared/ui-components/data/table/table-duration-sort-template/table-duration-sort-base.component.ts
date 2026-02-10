import {ChangeDetectorRef, Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {getValueOrDefault, hasValue} from '../../../../utils/helpers.util';
import {ErrorStateMatcher} from '@angular/material/core';

export interface IDurationThan {
  checked: boolean;
  value: any;
}

export const emptyDuration ={
  checked: false,
  value: 0
};

export type DurationParameters = 'lessThan' | 'greaterThan';


const enum SERVER_POSITION {
  GREATER_THAN,
  LESS_THAN
}
/**
 * Server communication helper;
 * to the server [greaterThan, lessThan]
 * from the server [greaterThan, lessThan] -> {greaterThan, lessThan}
 */
export class DataInputOutputHelper {
    static encodeToServerData(
                              data: { greaterThan: IDurationThan; lessThan: IDurationThan },
                              prepareDataToServerFunction: (data) => string | number
    ): Array<string | number | null> {
      let greaterThan = null;
      let lessThan = null;
      const positions = [] as Array<string | number | null>;

      if (data?.greaterThan?.checked) {
        greaterThan = prepareDataToServerFunction(data.greaterThan.value);
      }
      if (data?.lessThan?.checked) {
        lessThan = prepareDataToServerFunction(data.lessThan.value);
      }

      if (lessThan !== null || greaterThan !== null) {
        positions[SERVER_POSITION.LESS_THAN] = lessThan;
        positions[SERVER_POSITION.GREATER_THAN] = greaterThan;
      }

      return positions;
    }
  static decodeFromServerData(
    data: Array<string | number | null> | null = [],
    useOldValues?: {greaterThan?: IDurationThan; lessThan?: IDurationThan},
    parseServerDataFunction?: (data) => number
  ): {greaterThan: IDurationThan; lessThan: IDurationThan} {
    // no data from the store
    if(data.length === 0) {
      return {
        greaterThan: {
          value: useOldValues?.greaterThan.value ?? null,
          checked: false
        },
        lessThan: {
          value: useOldValues?.lessThan.value ?? null,
          checked: false
        }
      };
    }
    // got data from the store
    return {
      greaterThan: {
        value: (getValueOrDefault(parseServerDataFunction(data[SERVER_POSITION.GREATER_THAN]), useOldValues?.greaterThan.value ?? null) ),
        checked: data[SERVER_POSITION.GREATER_THAN] !== null && data[SERVER_POSITION.GREATER_THAN] !== ''
      },
      lessThan: {
        value: (getValueOrDefault(parseServerDataFunction(data[SERVER_POSITION.LESS_THAN]), useOldValues?.lessThan.value ?? null) ),
        checked: data[SERVER_POSITION.LESS_THAN] !== null && data[SERVER_POSITION.LESS_THAN] !== ''
      }
    };
  }
}


@Component({
    template: 'sm-table-duration-base',
})
export abstract class TableDurationSortBaseComponent {
  protected cdr: ChangeDetectorRef;

  @Output() filterChanged = new EventEmitter<{ value: any }>();
  @Output() hasError = new EventEmitter<boolean>();

  @Input() set value(value: Array<string | number | null>) {
    this.updateValue(value);
  }

  abstract parseServerDataFunction(data: null | string | number): number;
  abstract prepareDataToServerFunction(data: null | string | number): string | number | null;

  constructor() {
    this.cdr = inject(ChangeDetectorRef);
  }

  lessThan: IDurationThan = {
    checked: false,
    value: null
  };

  greaterThan: IDurationThan = {
    checked: false,
    value: null
  };

  hasTimeError = false;
  private isFirstTimeUpdate = true;
  public updateValue(value: Array<string | number | null>): void {
    if (!hasValue(value) || value.length === 0) {
      this.greaterThan = emptyDuration;
      this.lessThan = emptyDuration;
      this.isFirstTimeUpdate = true; // Reset the flag for the next real value
      return; // <-- The crucial change: DO NOT call _updateValue()
    }
    // This part now only runs when a valid, non-empty value is received for the first time
    if (this.isFirstTimeUpdate) {
      this.isFirstTimeUpdate = false;
      const data = DataInputOutputHelper.decodeFromServerData(value, {greaterThan: this.greaterThan, lessThan: this.lessThan}, this.parseServerDataFunction);
      this.greaterThan = data.greaterThan;
      this.lessThan    = data.lessThan;
      this._updateValue();
    }
  }
  abstract _updateValue(): void;

  get isFiltered(): boolean {
    return this.shouldValidate();
  }

  public setCheckBox(checked: boolean, checkBoxName: DurationParameters, shouldValidate = true): void {
    this[checkBoxName] = {...this[checkBoxName], checked};
    shouldValidate && this.validateAfterChanges();
  }

  public timeStampChanged(value: number | string | null, valueName: DurationParameters): void {
    if (this.checkIfSameValues(value, valueName)) {
      return;
    }
    if (!hasValue(this[valueName].value) && hasValue(value)) {
      this.setCheckBox(true, valueName, false);
    } else if (!hasValue(value)) {
      this.setCheckBox(false, valueName);
    }

    this[valueName] = {...this[valueName], value};

    if (this[valueName]?.checked) {
      this.validateAfterChanges();
    }

  }

  private checkIfSameValues(value: number | string | null, valueName: DurationParameters) {
    return value === this[valueName].value;
  }

  private validateAfterChanges() {
    if (this.shouldValidate()) {
      const isValidAfterChanges = this.isValidAfterChanges();
      this.hasTimeError = !isValidAfterChanges;
      this.hasError.emit(!isValidAfterChanges);
      if (isValidAfterChanges) {
        this.updateState();
      } else {
        this.cdr.detectChanges();
      }
      return;
    }

    if (!this.lessThan.checked && !this.greaterThan.checked) {
      this.resetValues();
      return;
    }
  }

  private resetValues() {
    this.updateState();
  }

  private shouldValidate() {
    return this.greaterThan.checked || this.lessThan.checked;
  }

  private isValidAfterChanges() {
    if (this.greaterThan.checked && this.lessThan.checked) {
      return this.lessThan.value >= this.greaterThan.value;
    }
    return this.greaterThan.checked || this.lessThan.checked;
  }

  /**
   * Update the Store;
   *
   * @private
   */
  private updateState() {
    const value = DataInputOutputHelper.encodeToServerData({greaterThan: this.greaterThan, lessThan: this.lessThan}, this.prepareDataToServerFunction);
    this.filterChanged.emit({value});
  }
}

export class ImmediateErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control) {
    return control && control.invalid; // will show error in every case when control is invalid. i.e. field will be red from the very beginning.
  }
}
