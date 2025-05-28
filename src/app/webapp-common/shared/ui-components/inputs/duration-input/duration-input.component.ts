import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, forwardRef, HostListener} from '@angular/core';
import {TemplateFormSectionBaseDirective} from '../../template-forms-ui/templateFormSectionBase';
import {FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
    selector: 'sm-duration-input',
    templateUrl: './duration-input.component.html',
    styleUrls: ['./duration-input.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DurationInputComponent),
            multi: true
        }
    ]
})
export class DurationInputComponent extends TemplateFormSectionBaseDirective {
  public ms = '0';
  public seconds = '0';
  public minutes = '0';
  public hours = '0';
  public inEdit: boolean;


  override set value(val) {  // this value is updated by programmatic changes if( ngModelValue !== undefined && this.ngModelValue !== ngModelValue){
    this.inEdit = false;
    if (val !== undefined) {
      this.val = val;
      this.msToHMSMS(val);
    }
  }

  constructor(private eRef: ElementRef, private cdr: ChangeDetectorRef) {
    super();
    this.val = 0;
  }

  @HostListener('document:click', ['$event'])
  clickOut(event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.value = this.val;
      this.cdr.detectChanges();
    }
  }

  private msToHMSMS(ms: number) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    ms = ms - (hours * (1000 * 60 * 60));
    const minutes = Math.floor(ms / (1000 * 60));
    ms = ms - (minutes * (1000 * 60));
    const seconds = Math.floor(ms / 1000);
    const convertedMs = ms - (seconds * 1000);

    this.hours = this.toTwoDigits(hours);
    this.minutes = this.toTwoDigits(minutes);
    this.seconds = this.toTwoDigits(seconds);
    this.ms = this.toThreeDigits(convertedMs);
    this.cdr.detectChanges();
  }

  toTwoDigits(n: number) {
    return n > 9 ? '' + n : '0' + n;
  }

  toThreeDigits(n: number) {
    return n > 99 ? ('' + n) : (n > 9 ? '0' + n : '00' + n);
  }

  onChangePartial($event: any) {
    this.inEdit = false;
    const ms = this.currentTimeInMs();
    this.val = ms;
    this.msToHMSMS(ms);
    this.onChange(ms);
  }

  checkChars($event: KeyboardEvent) {
    const isNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes($event.key);
    if (isNumbers) {
      this.inEdit = true;
    }
    return isNumbers;
  }

  focusOutInput() {
    const ms = this.currentTimeInMs();
    this.msToHMSMS(ms);
  }

  currentTimeInMs() {
    return (parseInt(this.ms) * 1 || 0) + (parseInt(this.seconds) * 1000 || 0) + (parseInt(this.minutes) * 1000 * 60 || 0) + (parseInt(this.hours) * 1000 * 60 * 60 || 0);
  }
}
