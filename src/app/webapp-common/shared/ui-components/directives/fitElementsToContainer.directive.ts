import {AfterViewInit, ChangeDetectorRef, ContentChild, ContentChildren, Directive, ElementRef, EventEmitter, Input, OnDestroy, Output, QueryList, Renderer2} from '@angular/core';
import {Subscription} from 'rxjs';
import {ChipsComponent} from '@common/shared/ui-components/buttons/chips/chips.component';

const isElementOverflow = ({clientWidth, clientHeight, scrollWidth, scrollHeight}) =>
  Math.abs(scrollHeight - clientHeight) > 10 || Math.abs(scrollWidth - clientWidth) > 10;

@Directive({
  selector: '[smFitElementsToContainer]',
})
export class FitElementsToContainerDirective implements AfterViewInit, OnDestroy {

  @ContentChildren(ChipsComponent) chips: QueryList<ChipsComponent>;
  @ContentChild('other') others: ElementRef;

  @Output() smFitElementsToContainer = new EventEmitter<number>();

  @Input() set overflowTrigger(name) {
    this.hideChips();
  }

  private sub = new Subscription();
  private readonly host: Element;
  private chipsWidth = {};

  constructor(_host: ElementRef, private cdr: ChangeDetectorRef, private renderer: Renderer2) {
    this.host = _host.nativeElement;
  }

  ngAfterViewInit(): void {
    this.chips.forEach(chip => this.chipsWidth[chip.label] = chip.elRef.nativeElement.clientWidth);
    this.sub.add(this.chips.changes.subscribe((chips) => {
      chips.forEach(chip => this.chipsWidth[chip.label] = chip.elRef.nativeElement.clientWidth);
      this.hideChips();
    }));
    this.hideChips();
    //   this.sub.add(fromEvent(window, 'resize')
    //     .pipe(debounceTime(50))
    //     .subscribe(() => this.isEllipsis()));
    //
    //   window.setTimeout(() => this.isEllipsis(), this.overflowDelay);
  }

  hideChips() {
    let totalWidth = 0;
    let numberOfHidden = 0;
    this.chips?.forEach(chip => {
      if (totalWidth + this.chipsWidth[chip.label] > this.host.clientWidth - 20) {
        numberOfHidden++;
        this.renderer.addClass(chip.elRef.nativeElement, 'hidden');
      } else {
        totalWidth += this.chipsWidth[chip.label];
        this.renderer.removeClass(chip.elRef.nativeElement, 'hidden');
      }
    });

    this.smFitElementsToContainer.emit(numberOfHidden);
    // if (this.others) {
    //   this.others.nativeElement.innerText = numberOfHidden ? `+ ${numberOfHidden}` : '';
    // }
    // this.smFitElementsToContainer.emit(numberOfHidden);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
