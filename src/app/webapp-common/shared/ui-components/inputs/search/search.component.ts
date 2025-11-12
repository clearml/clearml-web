import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  OnChanges,
  OnDestroy,
  OnInit,
  output,
  signal,
  SimpleChanges,
  viewChild
} from '@angular/core';
import {Subject, Subscription, timer} from 'rxjs';
import {debounce, filter, tap} from 'rxjs/operators';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {HesitateDirective} from '@common/shared/ui-components/directives/hesitate.directive';


@Component({
  selector: 'sm-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIcon,
    MatIconButton,
    HesitateDirective,
  ]
})
export class SearchComponent implements OnInit, OnChanges, OnDestroy {
  public value$ = new Subject();
  public empty = signal(true);
  public active = true;
  public focused: boolean;
  private subs = new Subscription();

  minimumChars = input(3);
  debounceTime = input(300);
  placeholder = input<string>('Type to search');
  hideIcons = input<boolean>(false);
  expandOnHover = input(false);
  disabled = input(false);
  disableAnimation = input(false);
  enableNavigation = input(false);
  enableSearchOnSubmit = input(false);
  searchResultsCount = input<number>(null);
  searchCounterIndex = input(-1);
  value = input<string>('');

  valueChanged = output<string>();
  validateValueChange = output<string>();
  searchBarInput = viewChild<ElementRef>('searchBar');
  protected valueHasChanged = signal(false);

  constructor() {
    effect(() => {
      this.searchBarInput().nativeElement.value = this.value() || '';
    });
  }

  ngOnInit(): void {
    this.subs.add(this.value$.pipe(
      tap((val: string) => this.empty.set(val?.length === 0)),
      debounce((val: string) => val.length > 0 ? timer(this.debounceTime()) : timer(0)),
      filter((val) => val !== this.value()),
      filter(val => val.length >= this.minimumChars() || val.length === 0)
    )
      .subscribe((value: string) => {
        if (value.length >= this.minimumChars()) {
          this.valueChanged.emit(value);
        } else {
          // in case user backspace all chars
          this.valueChanged.emit('');
          this.clear(true);
        }
        // this.cdr.markForCheck();
      }));
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
  }

  onKeyDown(event) {
    if (event.key === 'Escape' || event.key === 'Esc') {
      this.clear();
    } else if (event.key === 'Enter' &&
      (!this.enableNavigation() || (this.searchCounterIndex() + 1 < this.searchResultsCount())) &&
      this.searchBarInput().nativeElement.value.length > 0 && !this.disabled()
    ) {
      window.setTimeout(() => this.valueHasChanged.set(false), this.debounceTime());
      this.valueChanged.emit(this.searchBarInput().nativeElement.value);
    }
  }

  onValueChange() {
    window.setTimeout(() => this.valueHasChanged.set(false), this.debounceTime());
    this.value$.next(this.searchBarInput().nativeElement.value);
  }

  validateValue() {
    this.valueHasChanged.set(true)
    this.empty.set(this.searchBarInput().nativeElement.value.length === 0);
    this.validateValueChange.emit(this.searchBarInput().nativeElement.value);
  }

  clear(focus = true) {
    this.value$.next('');
    this.searchBarInput().nativeElement.value = '';
    if (focus) {
      this.searchBarInput().nativeElement.focus();
    }
  }

  updateActive(active: boolean) {
    if (this.expandOnHover()) {
      if (this.empty()) {
        this.active = active;
        this.searchBarInput().nativeElement.focus();
      } else {
        this.active = true;
      }
    }
  }

  findNext(backward?: boolean) {
    this.valueChanged.emit(backward ? null : this.searchBarInput().nativeElement.value);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.expandOnHover) {
      this.active = !changes.expandOnHover.currentValue;
    }
  }

  focusInput($event: boolean) {
    this.focused = $event;
  }

  getFocus() {
    this.searchBarInput().nativeElement.focus();
  }
}
