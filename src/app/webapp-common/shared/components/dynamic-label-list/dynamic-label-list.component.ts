import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  input,
  TemplateRef,
  viewChildren
} from '@angular/core';
import {injectResize} from 'ngxtension/resize';
import {combineLatest, map, distinctUntilChanged} from 'rxjs';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {NgTemplateOutlet} from '@angular/common';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {debounceTime} from 'rxjs/operators';

@Component({
  selector: 'sm-dynamic-label-list',
  imports: [
    NgTemplateOutlet,
    TooltipDirective
  ],
  templateUrl: './dynamic-label-list.component.html',
  styleUrl: './dynamic-label-list.component.scss'
})
export class DynamicLabelListComponent {
  private readonly ref = inject(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private overflowTrigger = injectResize()
    .pipe(
      map(res => res.width),
      distinctUntilChanged()
    );
  items = input<string[]>();
  itemTemplate= input<TemplateRef<{$implicit: string}>>();

  private itemContainers = viewChildren<ElementRef<HTMLDivElement>>('itemContainer');

  protected visibleLabelsLen = 0;
  protected hiddenLabels = [];
  protected measure = true;

  constructor() {
    combineLatest([
      toObservable(this.itemContainers),
      this.overflowTrigger
    ])
      .pipe(
        takeUntilDestroyed(),
        debounceTime(0)
      )
      .subscribe(([containers, resize]) => {
        if (containers && resize) {
          this.visibleLabelsLen = containers.length;
          this.measure = true;
          this.cdr.detectChanges();
          const itemsLengths = containers.map(container => container.nativeElement.offsetWidth);
          let totalWidth = 32;
          let len = 0
          const offsetWidth = this.ref.nativeElement.offsetWidth;
          while (totalWidth < offsetWidth) {
            totalWidth += itemsLengths[len];
            len++;
          }
          this.visibleLabelsLen = Math.max(len - 2, 0);
          this.hiddenLabels = this.items()?.slice(len - 1) ?? [];
          this.measure = false;
          this.cdr.markForCheck();
        }
      });
  }
}
