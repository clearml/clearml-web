import {ChangeDetectionStrategy, Component, computed, input, output, viewChild } from '@angular/core';
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';

import {CopyClipboardComponent} from '@common/shared/ui-components/indicators/copy-clipboard/copy-clipboard.component';
import {SearchComponent} from '@common/shared/ui-components/inputs/search/search.component';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

@Component({
    selector: 'sm-scroll-textarea',
    templateUrl: './scroll-textarea.component.html',
    styleUrls: ['./scroll-textarea.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CopyClipboardComponent,
        SearchComponent,
        CdkVirtualScrollViewport,
        CdkVirtualForOf,
        MatProgressSpinnerModule,
        CdkFixedSizeVirtualScroll,
    ]
})
export class ScrollTextareaComponent {
  search = '';
  searchResultsCount = 0;

  public indexes: number[] = [];
  public index = 0;
  public minimumChars = 1;
  private searchLowercase: string;

  formData = input<string>();
  isInDev = input(false);
  editable = input<boolean>();
  disabled = input<boolean>();
  showSpinner = input<boolean>();
  forceEmpty = input(false);
  emptyMessage = input('No changes logged');
  minHeight = input('250px');
  freezeForm = output();
  scroll = viewChild(CdkVirtualScrollViewport);

  protected lines = computed<string[]>(() => this.formData()?.split('\n')
    .map(line => line.length > 800 ? line.substring(0, 800) + '...' : line) ?? []
  );

  onFindNextResult(value?: string) {
    const searchBackward = value === null;
    if (value != this.search && !searchBackward) {
      this.resetSearch(value);
      if (value.length > 0 && value.length >= this.minimumChars) {
        this.searchResultsCount = this.lines().filter(line => line.toLowerCase().includes(this.searchLowercase)).length;
      }
    } else {
      this.index = searchBackward ? this.index - 1 : this.index + 1;
    }
      if (this.search?.length > 0) {
        if (this.indexes[this.index] === undefined) {
          const pos = this.lines().slice((this.indexes[this.index - 1] ?? -1) + 1).findIndex(line => line.toLowerCase().includes(this.searchLowercase));
          if (pos > -1) {
            const newIndex = pos + (this.indexes[this.index - 1] ?? -1) + 1;
            this.indexes.push(newIndex);
            this.index = this.indexes.length - 1;
          }
        }
      }
    this.scroll().scrollToIndex(this.indexes[this.index] - 3);
  }

  resetSearch(value?: string) {
    this.indexes = [];
    this.index = 0;
    this.searchResultsCount = 0;
    this.search = value || '';
    this.searchLowercase = value?.toLowerCase() || '';
  }

  split(line: string, search: string) {
    const regex = new RegExp(search, 'gi');
    const match = line.match(regex);
    return line.split(regex).map( (part, i) => [part, match?.[i]]);
  }
}
