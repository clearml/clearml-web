import {TemplateFormSectionBaseDirective} from '../../template-forms-ui/templateFormSectionBase';
import {ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {TIME_IN_MILLI} from '../../../utils/time-util';

@Component({
  template: '',
})
export abstract class DurationInputBase  extends TemplateFormSectionBaseDirective {
  public ms = '000';
  public seconds = '00';
  public minutes = '00';
  public hours = '00';
  public days = '000';

  hasTimes = {
    ms: true,
    seconds: false,
    minutes: false,
    hours: false,
    days: false,
  };

  @Input() returnFactor = 1;
  @Input() readonly = false;

  @Output() onEditing = new EventEmitter<boolean>();
  @Output() onDurationChanged = new EventEmitter();

  override get value() {return this.ngModelValue;}
  override set value(val) {  // this value is updated by programmatic changes if( ngModelValue !== undefined && this.ngModelValue !== ngModelValue){
    if (val !== undefined && val !== this.val && val !== '0') {

      val = `${val || 0}`;
      const _val = +val * this.returnFactor;
      this.onEditing.emit(false);
      this.ngModelValue = val;
      this.val = val;

      // calc the ms,seconds,min with the value * factor
      this.msToHMSMS(_val);
      this.cdr?.detectChanges();
    /*  // return
      this.onChange(val);
      this.onTouch(val);*/
    }
  }

  constructor(private eRef: ElementRef, protected cdr?: ChangeDetectorRef) {
    super();
    this.valueFromInherit = false
  }

  get hasNoValues() {
    return  this.seconds === '00' &&
            this.minutes === '00' &&
            this.hours === '00' &&
            this.ms === '000' &&
            this.days === '000';
  }
  @HostListener('document:click', ['$event'])
  clickOut(event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.value = this.ngModelValue;
    }
  }

  msToHMSMS(ms: number): void {
    const days = Math.floor(ms / TIME_IN_MILLI.ONE_DAY);
    ms = ms - (days * TIME_IN_MILLI.ONE_DAY);
    const hours = Math.floor(ms / TIME_IN_MILLI.ONE_HOUR);
    ms = ms - (hours * TIME_IN_MILLI.ONE_HOUR);
    const minutes = Math.floor(ms / TIME_IN_MILLI.ONE_MIN);
    ms = ms - (minutes * TIME_IN_MILLI.ONE_MIN);

    const seconds = Math.floor(ms / TIME_IN_MILLI.ONE_SEC);
    const convertedMs = ms - (seconds * TIME_IN_MILLI.ONE_SEC);
    this.days = this.toThreeDigits(days);
    this.hours = this.toTwoDigits(hours);
    this.minutes = this.toTwoDigits(minutes);
    this.seconds = this.toTwoDigits(seconds);
    this.ms = this.toThreeDigits(convertedMs);
  }

  currentTimeInMs() {
    return  (+this.ms || 0) +
            (this.hasTimes.seconds ? +this.seconds * TIME_IN_MILLI.ONE_SEC || 0 : 0) +
            (this.hasTimes.minutes ? +this.minutes * TIME_IN_MILLI.ONE_MIN || 0 : 0) +
            (this.hasTimes.hours ? +this.hours * TIME_IN_MILLI.ONE_HOUR || 0 : 0) +
            (this.hasTimes.days ?  +this.days * TIME_IN_MILLI.ONE_DAY || 0 : 0);
  }

  toTwoDigits(n: number) {
    return n > 9 ? '' + n : '0' + n;
  }

  toThreeDigits(n: number) {
    return n > 99 ? ('' + n) : (n > 9 ? '0' + n : '00' + n);
  }

  onChangePartial($event: any) {
    this.onEditing.emit(false);

    const ms = this.currentTimeInMs();
    this.msToHMSMS(ms);
    this.val = ms;
    const res = ms / this.returnFactor
    // this.onChange(res);
    this.onDurationChanged.emit(res)
  }

  checkChars($event: KeyboardEvent) {
    const isNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes($event.key);
    if (isNumbers) {
      this.onEditing.emit(true);

    }
    return isNumbers;
  }

  focusOutInput() {
    const ms = this.currentTimeInMs();
    this.msToHMSMS(ms);
    this.val = ms;
    const res = ms / this.returnFactor;
    // this.onChange(res);
    this.onDurationChanged.emit(res);
  }

}
