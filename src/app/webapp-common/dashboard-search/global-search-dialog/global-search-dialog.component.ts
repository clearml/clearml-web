import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject, linkedSignal,
  signal,
  viewChild
} from '@angular/core';
import {SearchComponent} from '@common/shared/ui-components/inputs/search/search.component';
import {DashboardSearchModule} from '~/features/dashboard-search/dashboard-search.module';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {Store} from '@ngrx/store';
import {
  searchActivated,
  searchDeactivate,
  searchSetTableFilters,
  searchSetTerm
} from '@common/dashboard-search/dashboard-search.actions';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {PushPipe} from '@ngrx/component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {distinctUntilChanged, filter} from 'rxjs/operators';
import {
  selectFilters,
  selectResultErrors,
  selectSearchTerm,
} from '@common/dashboard-search/dashboard-search.reducer';
import {MatDialogRef} from '@angular/material/dialog';
import {decodeFilter, encodeFilters} from '@common/shared/utils/tableParamEncode';
import {MultiLineTooltipComponent} from '@common/shared/components/multi-line-tooltip/multi-line-tooltip.component';
import {ActiveSearchLink, activeSearchLink} from '~/features/dashboard-search/dashboard-search.consts';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {DashboardSearchComponent} from '~/features/dashboard-search/containers/dashboard-search/dashboard-search.component';

@Component({
  selector: 'sm-global-search-dialog',
  templateUrl: './global-search-dialog.component.html',
  styleUrl: './global-search-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SearchComponent,
    DashboardSearchModule,
    DialogTemplateComponent,
    ClickStopPropagationDirective,
    MatIcon,
    MatIconButton,
    PushPipe,
    TooltipDirective,
    MultiLineTooltipComponent,
    DashboardSearchComponent
  ],
})
export class GlobalSearchDialogComponent {
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected readonly destroy = inject(DestroyRef);
  protected dialogRef = inject<MatDialogRef<GlobalSearchDialogComponent>>(MatDialogRef<GlobalSearchDialogComponent>);

  searchComponent = viewChild(SearchComponent);

  protected regExp = signal(false);
  protected advanced = signal(false);
  protected activeLink = signal<ActiveSearchLink>(null);
  protected placeholder = computed(() => this.advanced() ? 'eg.: {"status": ["stopped"], "order_by": ["-last_update"]}' : 'Type to search')
  jsonValid = signal(true);

  protected regexError = signal(false);
  private errors = this.store.selectSignal(selectResultErrors);
  protected resultErrors = linkedSignal(() => this.errors());
  protected filters = this.store.selectSignal(selectFilters);
  protected searchQuery$ = this.store.select(selectSearchTerm);
  private itemSelected = false;
  advancedTooltip = `Explicit DB query specification <br>
(JSON format. see e.g. <a target="_blank" title="https://clear.ml/docs/latest/docs/references/sdk/task/#taskquery_tasks" data-renderer-mark="true" href="https://clear.ml/docs/latest/docs/references/sdk/task/#taskquery_tasks">Task.query_tasks()</a>)`;

  constructor() {
    this.store.dispatch(searchActivated());
    this.route.queryParams.pipe(
      takeUntilDestroyed(),
      distinctUntilChanged((pre, current) => pre.gsfilter === current.gsfilter),
      filter(params => params.gsfilter !== undefined),
    ).subscribe(params => {
      if (typeof params.gsfilter === 'string') {
        const filters = params.gsfilter ? decodeFilter(params.gsfilter) : [];
        this.store.dispatch(searchSetTableFilters({filters, activeLink: params.tab || 'projects'}));
      }
    });

    this.router.events
      .pipe(
        takeUntilDestroyed(),
        filter(event => event instanceof NavigationEnd),
        distinctUntilChanged((pe: NavigationEnd, ce: NavigationEnd) => {
          const pURL = new URLSearchParams(pe.url.split('?')?.[1]);
          const cURL = new URLSearchParams(ce.url.split('?')?.[1]);
          return pURL.get('gq') === cURL.get('gq') && pURL.get('gqreg') === cURL.get('gqreg') && pURL.get('advanced') === cURL.get('advanced') && pURL.get('tab') === cURL.get('tab');
        })
      )
      .subscribe(() => {
        const query = this.route.snapshot.queryParams?.gq ?? '';
        const qregex = this.route.snapshot.queryParams?.gqreg === 'true';
        const advanced = this.route.snapshot.queryParams?.advanced === 'true';
        const tab = this.route.snapshot.queryParams?.tab ?? '';
        this.regExp.set(qregex);
        this.advanced.set(advanced);
        this.activeLink.set(tab);
        if (advanced && tab === activeSearchLink.modelEndpoints) {
          this.enableAdvancedSearch();
        }
        this.store.dispatch(searchSetTerm({
          query: query,
          regExp: qregex,
          advanced: advanced
        }));
      });

    this.destroy.onDestroy(() => {
      this.store.dispatch(searchDeactivate());
      if (!this.itemSelected) {
        this.router.navigate([], {
          relativeTo: this.route,
          replaceUrl: true,
          queryParamsHandling: 'merge',
          queryParams: {
            gq: undefined,
            gqreg: undefined,
            gsfilter: undefined,
            tab: undefined,
            advanced: undefined
          }
        });
      }
    })
  }

  search(query: string) {
    try {
      if (this.regExp()) {
        new RegExp(query);
      }
      this.regexError.set(null);
      this.resultErrors.set(null);

      this.router.navigate([], {
        relativeTo: this.route,
        replaceUrl: true,
        queryParamsHandling: 'merge',
        queryParams: {
          gq: query || undefined
        }
      });

    } catch (e) {
      this.regexError.set(e.message?.replace(/:.+:/, ':'));
    }
  }

  toggleRegExp() {
    const regExp = !this.regExp();
    if (!regExp) {
      this.regexError.set(null);
    }
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParamsHandling: 'merge',
      queryParams: {
        gqreg: regExp ?? undefined
      }
    });
  }

  closeDialog() {
    this.itemSelected = true;
    this.dialogRef.close();
  }

  enableAdvancedSearch() {
    if (this.advanced()) {
      this.searchComponent().clear();
    }
    const advanced = !this.advanced();
    this.regexError.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParamsHandling: 'merge',
      queryParams: {
        ...(advanced ?
          {
            advanced: advanced,
            gsfilter: undefined,
            gq: undefined,
            gqreg: undefined,
          } :
          {
            advanced:  undefined,
            gsfilter: encodeFilters(this.filters()[this.activeLink()])
          })
      }
    });
  }

  validateValue(json: string) {
    const jsonValid = this.validateJson(json);
    this.jsonValid.set(jsonValid.valid);
    this.regexError.set(jsonValid.error);
  }

  validateJson(obj) {
    if (!obj) return {valid: true};
    try {
      JSON.parse(obj);
    } catch (e) {
      return {valid: false, error: e.message};
    }
    return {valid: true};
  }
  protected readonly activeSearchLink = activeSearchLink;
}
