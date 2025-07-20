import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  HostListener,
  inject,
  signal
} from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder, FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  KeydownStopPropagationDirective
} from '@common/shared/ui-components/directives/keydown-stop-propagation.directive';
import {MatInput} from '@angular/material/input';

@Component({
  selector: 'sm-duration-input',
  templateUrl: './duration-input.component.html',
  styleUrls: ['./duration-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatIconButton,
    MatIconModule,
    TooltipDirective,
    KeydownStopPropagationDirective,
    MatInput,
    ReactiveFormsModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DurationInputComponent),
      multi: true
    }
  ]
})
export class DurationInputComponent implements ControlValueAccessor  {
  private eRef = inject(ElementRef);
  private builder = inject(FormBuilder);

  protected form = this.builder.group({
    ms: ['0', [Validators.maxLength(3)]],
    seconds: ['0', [Validators.maxLength(2)]],
    minutes: ['0', [Validators.maxLength(2)]],
    hours: ['0', [Validators.maxLength(2)]],
  });

  public inEdit = signal(false);
  private epoch: number;

  onChange: (any) => void;
  onTouch: (any) => void;

  writeValue(epoch: number): void {
    this.epoch = epoch;
    this.msToHMSMS(epoch);
  }
  registerOnChange(fn: (any) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouch = fn;
  }

  @HostListener('document:click', ['$event'])
  clickOut(event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.msToHMSMS(this.epoch);
    }
  }

  private msToHMSMS(ms: number) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    ms = ms - (hours * (1000 * 60 * 60));
    const minutes = Math.floor(ms / (1000 * 60));
    ms = ms - (minutes * (1000 * 60));
    const seconds = Math.floor(ms / 1000);
    const convertedMs = ms - (seconds * 1000);

    this.form.patchValue({
      hours: this.toTwoDigits(hours),
      minutes: this.toTwoDigits(minutes),
      seconds: this.toTwoDigits(seconds),
      ms: this.toThreeDigits(convertedMs),
    }, {emitEvent: false});
  }

  toTwoDigits(n: number) {
    return n > 9 ? '' + n : '0' + n;
  }

  toThreeDigits(n: number) {
    return n > 99 ? ('' + n) : (n > 9 ? '0' + n : '00' + n);
  }

  onChangePartial() {
    this.inEdit.set(false);
    const ms = this.currentTimeInMs();
    this.epoch = ms;
    this.msToHMSMS(ms);
    this.onChange(ms);
  }

  checkChars($event: KeyboardEvent) {
    const isNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes($event.key);
    if (isNumbers) {
      this.inEdit.set(true);
    }
    return isNumbers || ['ArrowRight', 'ArrowLeft', 'Tab'].includes($event.key);
  }

  focusOutInput() {
    const ms = this.currentTimeInMs();
    this.msToHMSMS(ms);
  }

  currentTimeInMs() {
    const result = this.form.value;
    return (parseInt(result.ms) || 0) +
      (parseInt(result.seconds) * 1000 || 0) +
      (parseInt(result.minutes) * 1000 * 60 || 0) +
      (parseInt(result.hours) * 1000 * 60 * 60 || 0);
  }

  increase(control: FormControl, max = 99) {
    let val = parseInt(control.value, 10);
    if (val < max) {
      val += 1;
    }
    control.setValue((`${val}`));
    this.inEdit.set(true);
  }

  decrease(control: FormControl) {
    let val = parseInt(control.value, 10);
    if (val > 0) {
      val -= 1;
    }
    control.setValue(`${val}`);
    this.inEdit.set(true);
  }
}
