import {ChangeDetectionStrategy, Component} from '@angular/core';
import {DurationParameters, TableDurationSortBaseComponent} from '../table-duration-sort-base.component';
import {TIME_IN_MILLI} from '../../../../../utils/time-util';
import {MAT_DATE_FORMATS, MAT_DATE_LOCALE, provideNativeDateAdapter} from '@angular/material/core';
import {isNil} from 'lodash-es';
import {hasValue} from '../../../../../utils/helpers.util';
import {FormsModule} from '@angular/forms';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {
  KeydownStopPropagationDirective
} from '@common/shared/ui-components/directives/keydown-stop-propagation.directive';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle
} from '@angular/material/datepicker';
import {
  DurationInputListComponent
} from '@common/shared/ui-components/inputs/duraion-input-list/duration-input-list.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';

import {
  TableFilterDurationErrorComponent
} from '@common/shared/ui-components/data/table/table-duration-sort-template/table-filter-duration-error/table-filter-duration-error.component';
import {MatFormField, MatInput} from '@angular/material/input';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  },
};

type PrivateParameters = '_lessThan' | '_greaterThan';
const fromPrivateToGlobal = (privateParameters: PrivateParameters) => privateParameters.replace('_', '') as DurationParameters;
const fromGlobalToPrivate = (parameter: DurationParameters) => '_' + parameter.replace('_', '') as PrivateParameters;
const addUserTimezoneToIsoDate = (data) => {
  const myDate = new Date(data);
  const offset = myDate.getTimezoneOffset() * TIME_IN_MILLI.ONE_MIN;

  const withOffset = myDate.getTime();
  return  withOffset - offset;
};

const mutedDateToNoHourMinutesSeconds = (_date: Date | number) => {
  const date = new Date(_date);
  date.setSeconds(0);
  date.setMinutes(0);
  date.setHours(0);
  return date;
};

/**
 * Get how many seconds in the Date object;
 *
 * @example getTimeInSecondsFromDate(01-01-2021 00:01:00)  => 60 seconds
 * @param _date
 */
export const getTimeInSecondsFromDate = (_date: number | Date): number => {
  if (_date === 0) {
    return 0;
  }

  const date = new Date(_date);
  const seconds = date.getSeconds();
  const minutes = date.getMinutes() * 60;
  const hours = date.getHours() * 60 * 60;
  return seconds + minutes + hours;
};

@Component({
    selector: 'sm-table-filter-duration-date-time',
    templateUrl: './table-filter-duration-date-time.component.html',
    styleUrls: ['./table-filter-duration-date-time.component.scss'],
    providers: [
        { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
        { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
        provideNativeDateAdapter()
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,
        ClickStopPropagationDirective,
        KeydownStopPropagationDirective,
        DurationInputListComponent,
        TooltipDirective,
        TableFilterDurationErrorComponent,
        MatDatepickerInput,
        MatDatepickerToggle,
        MatDatepicker,
        MatInput,
        MatFormField,
        MatIconButton,
        MatIcon
    ]
})
export class TableFilterDurationDateTimeComponent  extends TableDurationSortBaseComponent {
  _lessThan = {
    date: undefined,
    time: 0
  };
  _greaterThan = {
    date: undefined,
    time: 0
  };
  isFakeNowCheckbox = false;
  MINIMUM_TIME_DISPLAY = 0.001;
  get hasGreaterThanValue() {
    return this._greaterThan.date || this._greaterThan.time;
  }
  get hasLessThanValue() {
    return this.isFakeNowCheckbox || this._lessThan.date || this._lessThan.time;
  }
  parseServerDataFunction(data): number {
    if (data) {
      return addUserTimezoneToIsoDate(data);
    }
    return +new Date(data || 0);
  }

  prepareDataToServerFunction(data): string | null {
    return  isNil(data) || data === '' || isNaN(data) ? null : new Date(data).toISOString().split('.')[0];
  }


  _updateValue() {
    const {lessThan: {value: lessThanValue}, greaterThan: {value: greaterThanValue}} = this;

    let lessThanDate;
    let greaterThanDate;

    if (lessThanValue) {
      lessThanDate = mutedDateToNoHourMinutesSeconds(new Date(lessThanValue));
    }
    if (greaterThanValue) {
      greaterThanDate = mutedDateToNoHourMinutesSeconds(new Date(greaterThanValue));
    }
    const lessThanTime = lessThanValue || 0;
    const greaterThanTime = greaterThanValue || 0;

    this._lessThan = {time: getTimeInSecondsFromDate(lessThanTime), date: lessThanDate};
    this._greaterThan = {time: getTimeInSecondsFromDate(greaterThanTime), date: greaterThanDate};
  }

  /**
   * Handle the change in mat datepicker
   */
  onDateHandler(value: Date, valueName: PrivateParameters, emitValue = true): void {
    this[valueName] = {...this[valueName], date: value};
    if (!hasValue(value)) {
      this[valueName] = {...this[valueName], time: null};
      this.setCheckBox(false, fromPrivateToGlobal(valueName));
    }else if (!hasValue(this[valueName].time) || this[valueName].time < this.MINIMUM_TIME_DISPLAY) {
      this.onTimeHandler(this.MINIMUM_TIME_DISPLAY, valueName, false);
    }
    emitValue && this.combineDateAndTimeAndEmitValue(valueName);
  }

  /**
   * Handle changed in the time component
   */
  onTimeHandler(value: number, valueName: PrivateParameters, emitValue = true): void {
    this[valueName] = {...this[valueName], time: value};
    emitValue && this.combineDateAndTimeAndEmitValue(valueName);
  }

  combineDateAndTimeAndEmitValue(valueName: PrivateParameters): void {
    const {time: timeInSeconds, date} = this[valueName];

    const timeObject = new Date(+date + timeInSeconds * TIME_IN_MILLI.ONE_SEC);

    const parameterName = valueName.substr(1) as DurationParameters;
    const returnDateObject = date ? +timeObject : undefined;

    this.timeStampChanged(returnDateObject, parameterName);
  }

  onResetToDateInput() {
    this.isFakeNowCheckbox = false;
    this.onResetHandler('lessThan');
  }
  onResetHandler(paramName: DurationParameters): void {
    const privateParam = fromGlobalToPrivate(paramName);

    this.setCheckBox(false, paramName);
    this.onDateHandler(null, privateParam, false);
    this.onTimeHandler(0, privateParam);
  }

  onAutoFillCurrentTimeHandler(paramName: DurationParameters) {
    const privateParam = `_${paramName}` as PrivateParameters;

    let currentTime = new Date();

    const timeInSecondsFromDate = getTimeInSecondsFromDate(currentTime);

    this.onTimeHandler(timeInSecondsFromDate, privateParam as PrivateParameters, true);
    currentTime = mutedDateToNoHourMinutesSeconds(currentTime);

    this.onDateHandler(currentTime, privateParam);

    return true;
  }

  onFakeNowCheckbox() {
      this.isFakeNowCheckbox = true;
  }
}

