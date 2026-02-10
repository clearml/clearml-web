import {Component, DestroyRef, forwardRef, inject, input} from '@angular/core';
import {ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {format, isValid, parseISO} from 'date-fns';
import {dateRangeValidator} from '@common/shared/ui-components/template-forms-ui/date-range-validator.directive';
import {MatFormField, MatInputModule} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatDivider} from '@angular/material/list';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from "@angular/material/core";
import {enGB} from 'date-fns/locale';
import {DateFnsAdapter, MAT_DATE_FNS_FORMATS, provideDateFnsAdapter} from '@angular/material-date-fns-adapter';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {MatIconModule} from '@angular/material/icon';
import {MatFormFieldModule} from "@angular/material/form-field";
import {ActivatedRoute, Router} from "@angular/router";

// ... other imports (MatSelect, MatDatepicker, etc.)

@Component({
  selector: 'sm-period-selector',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormField,
    MatSelect,
    MatOption,
    MatDivider,
    ClickStopPropagationDirective
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PeriodSelectorComponent),
      multi: true
    },
    {provide: MAT_DATE_LOCALE, useValue: enGB},
    {provide: DateAdapter, useClass: DateFnsAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MAT_DATE_FNS_FORMATS},
    provideDateFnsAdapter()  ],
  templateUrl: './period-selector.component.html',
  styleUrl: './period-selector.component.scss'

})
export class PeriodSelectorComponent implements ControlValueAccessor {
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  timeFrameOptions = input([
    { label: 'Current month', value: 'currentMonth' },
    { label: 'Last 7 days', value: 'week' },
    { label: 'Last 30 days', value: 'thirtyDays' },
    { label: 'Last 60 days', value: 'sixtyDays' },
  ]);
  // Internal form to manage the UI state
  protected rangeControl = new FormGroup({
    from: new FormControl<Date>(null),
    to: new FormControl<Date>(null),
    period: new FormControl<string>(this.timeFrameOptions()[0].value)
  }, { validators: [dateRangeValidator] });

  // CVA Callbacks
  onChange: any = () => {};
  onTouched: any = () => {};



  constructor() {
    this.rangeControl.get('period').valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(period => {
        if (period !== 'custom') {
          this.rangeControl.patchValue({ from: null, to: null }, { emitEvent: false });
          this.applyChanges();
        }
      });
  }

  protected applyChanges(): void {
    const rawValue = this.rangeControl.getRawValue();
    const { from, to, period } = rawValue;

    // 1. If dates are being entered, ensure the period is set to 'custom'
    if ((from || to) && period !== 'custom') {
      this.rangeControl.get('period').setValue('custom', { emitEvent: false });
    }

    // 2. Determine if the current state is "completable"
    const isCustomAndIncomplete = period === 'custom' && (!from || !to);

    // 3. Only propagate if the form is valid AND custom range is complete
    if (this.rangeControl.valid && !isCustomAndIncomplete) {
      const externalValue = this.mapToExternalValue(this.rangeControl.getRawValue());
      this.onChange(externalValue);
      this.updateUrl(externalValue);

    }
  }
  private updateUrl(value: any): void {
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        period: value.period,
        from: value.from, // mapToExternalValue already formatted these
        to: value.to
      },
      queryParamsHandling: 'merge'
    });
  }

  writeValue(val: any): void {
    if (!val) return;
    this.rangeControl.patchValue({
      period: val.period,
      from: val.from ? parseISO(val.from) : null,
      to: val.to ? parseISO(val.to) : null
    }, { emitEvent: false }); // Don't trigger onChange loop
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.rangeControl.disable() : this.rangeControl.enable();
  }

  // --- Helpers ---

  private mapToExternalValue(value: any) {
    const formatStr = 'yyyy-MM-dd';
    const result: any = { period: value.period };
    if (value.period === 'custom') {
      result.from = value.from && isValid(value.from) ? format(value.from, formatStr) : null;
      result.to = value.to && isValid(value.to) ? format(value.to, formatStr) : null;
    } else {
      result.from = null;
      result.to = null;
    }

    return result;
  }
}
