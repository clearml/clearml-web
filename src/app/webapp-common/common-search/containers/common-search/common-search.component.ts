import {ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, viewChild} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {resetSearch, setSearching, setSearchQuery} from '../../common-search.actions';
import {
  selectIsSearching,
  selectPlaceholder,
  selectSearchQuery,
  selectSearchQueryRegex
} from '../../common-search.reducer';
import {Observable, timer} from 'rxjs';
import {debounce, filter} from 'rxjs/operators';
import {SearchComponent} from '@common/shared/ui-components/inputs/search/search.component';
import {PushPipe} from '@ngrx/component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {concatLatestFrom} from '@ngrx/operators';

@Component({
  selector: 'sm-common-search',
  templateUrl: './common-search.component.html',
  styleUrls: ['./common-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SearchComponent,
    PushPipe,
    TooltipDirective,
    ClickStopPropagationDirective,
    MatIconButton,
    MatIcon
  ]
})
export class CommonSearchComponent implements OnDestroy {
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public searchActive = input(false);

  private closeTimer: number;
  protected minChars = 3;
  protected regexError: boolean;
  protected searchQuery$ = this.store.select(selectSearchQuery);
  protected regExp = this.store.selectSignal(selectSearchQueryRegex);
  protected searching = this.store.selectSignal(selectIsSearching);
  protected searchPlaceholder = this.store.selectSignal(selectPlaceholder);
  protected isSearching = computed(() => this.searching() || this.searchActive());

  protected searchElem = viewChild(SearchComponent);
  private waitForRegex = false
  protected showRegex$: Observable<boolean>;

  constructor() {
    this.showRegex$ = toObservable(this.isSearching).pipe(debounce((isSearching) => timer(isSearching ? 350 : 0)));

    this.router.events
      .pipe(
        takeUntilDestroyed(),
        filter(event => event instanceof NavigationEnd),
        concatLatestFrom(() => this.store.select(selectSearchQuery)),
        filter(([ce, storedQuery]) => {
          const cURL = new URLSearchParams(ce.url.split('?')?.[1]);
          return storedQuery?.query !== (cURL.get('q') ?? '') || storedQuery?.regExp !== (cURL.get('qreg') === 'true');
        })
      )
      .subscribe(() => {
        const query = this.route.snapshot.queryParams?.q ?? '';
        const qregex = this.route.snapshot.queryParams?.qreg === 'true';
        this.store.dispatch(setSearchQuery({
          query: qregex ? query : query.trim(),
          regExp: qregex,
          original: query
        }));
        if (query) {
          this.openSearch();
        } else {
          if (document.activeElement !== this.searchElem()?.searchBarInput().nativeElement) {
            this.store.dispatch(setSearching({payload: false}));
          }
        }
      });
    if (this.route.snapshot.queryParams.q) {
      const query = this.route.snapshot.queryParams?.q ?? '';
      const qregex = this.route.snapshot.queryParams?.qreg ?? false;
      this.store.dispatch(setSearchQuery({
        query: qregex ? query : query.trim(),
        regExp: qregex,
        original: query
      }));
      setTimeout(() => this.openSearch());
    }
  }

  ngOnDestroy(): void {
    this.store.dispatch(resetSearch());
  }



  public search(query: string) {
    try {
      if (this.regExp()) {
        new RegExp(query);
      }
      this.regexError = null;
      this.router.navigate([], {
        relativeTo: this.route,
        replaceUrl: true,
        queryParamsHandling: 'merge',
        queryParams: {
          q: query || undefined,
          ...(this.regExp() && {qreg: true})
        }
      });

    } catch (e) {
      this.regexError = e.message?.replace(/:.+:/, ':');
    }
  }

  openSearch() {
    window.clearTimeout(this.closeTimer);
    this.searchElem()?.searchBarInput().nativeElement.focus();
    this.store.dispatch(setSearching({payload: true}));
  }

  onSearchFocusOut() {
    window.clearTimeout(this.closeTimer);
    if (!this.waitForRegex && !this.searchElem()?.searchBarInput().nativeElement.value) {
      this.closeTimer = window.setTimeout(() => this.store.dispatch(setSearching({payload: false})), 200);
    }
  }


  clearSearch() {
    this.searchElem()?.clear();
    this.store.dispatch(setSearching({payload: false}));
    document.body.focus();
    setTimeout(() => this.searchElem().searchBarInput().nativeElement.blur(), 100);
  }

  toggleRegExp() {
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParamsHandling: 'merge',
      queryParams: {qreg: !this.regExp() ? true : undefined}
    });
    this.waitForRegex = true;
    window.setTimeout(() => this.waitForRegex = false, 200);
    this.searchElem().searchBarInput().nativeElement.focus();
  }
}
