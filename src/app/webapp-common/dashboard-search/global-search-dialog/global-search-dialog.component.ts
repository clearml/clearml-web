import {Component, inject, OnDestroy} from '@angular/core';
import {SearchComponent} from '@common/shared/ui-components/inputs/search/search.component';
import {DashboardSearchModule} from '~/features/dashboard-search/dashboard-search.module';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {Store} from '@ngrx/store';
import {
  searchActivate,
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
import {selectSearchTerm} from '@common/dashboard-search/dashboard-search.reducer';
import {Observable} from 'rxjs';
import {MatDialogRef} from '@angular/material/dialog';
import {decodeFilter} from '@common/shared/utils/tableParamEncode';

@Component({
  selector: 'sm-global-search-dialog',
  imports: [
    SearchComponent,
    DashboardSearchModule,
    DialogTemplateComponent,
    ClickStopPropagationDirective,
    MatIcon,
    MatIconButton,
    PushPipe,
    TooltipDirective
  ],
  templateUrl: './global-search-dialog.component.html',
  styleUrl: './global-search-dialog.component.scss'
})
export class GlobalSearchDialogComponent implements OnDestroy {

  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public regExp = false;
  public regexError: boolean;
  protected dialogRef = inject<MatDialogRef<GlobalSearchDialogComponent>>(MatDialogRef<GlobalSearchDialogComponent>);


  public searchQuery$: Observable<{ query: string; regExp?: boolean; original?: string }>;
  private itemSelected = false;

  constructor() {
    this.store.dispatch(searchActivate())
    this.searchQuery$ = this.store.select(selectSearchTerm);
    this.route.queryParams.pipe(
      distinctUntilChanged((pre, current)=> pre.gsfilter === current.gsfilter)
    ).subscribe(params => {
      if (typeof params.gsfilter === 'string') {
        const filters = params.gsfilter? decodeFilter(params.gsfilter): [];
        this.store.dispatch(searchSetTableFilters({filters, activeLink: params.tab || 'projects'}));
      }
    });

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        distinctUntilChanged((pe: NavigationEnd, ce: NavigationEnd) => {
          const pURL = new URLSearchParams(pe.url.split('?')?.[1]);
          const cURL = new URLSearchParams(ce.url.split('?')?.[1]);
          return pURL.get('gq') === cURL.get('gq') && pURL.get('gqreg') === cURL.get('gqreg');
        })
      ).subscribe(() => {
      const query = this.route.snapshot.queryParams?.gq ?? '';
      const qregex = this.route.snapshot.queryParams?.gqreg === 'true';
      this.regExp = qregex;
      this.store.dispatch(searchSetTerm({
        query: qregex ? query : query.trim(),
        regExp: qregex,
      }));
    });
    if (this.route.snapshot.queryParams.gq) {
      const query = this.route.snapshot.queryParams?.gq ?? '';
      const qregex = this.route.snapshot.queryParams?.gqreg ?? false;
      this.store.dispatch(searchSetTerm({
        query: qregex ? query : query.trim(),
        regExp: qregex,
      }));
    }
  }

  ngOnDestroy(): void {
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
          tab: undefined
        }
      });
    }
  }


  public search(query: string) {
    try {
      if (this.regExp) {
        new RegExp(query);
      }
      this.regexError = null;
      this.router.navigate([], {
        relativeTo: this.route,
        replaceUrl: true,
        queryParamsHandling: 'merge',
        queryParams: {
          gq: query || undefined
        }
      });

    } catch (e) {
      this.regexError = e.message?.replace(/:.+:/, ':');
    }
  }

  toggleRegExp() {
    this.regExp = !this.regExp;
    if (!this.regExp) {
      this.regexError = null;
    }
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParamsHandling: 'merge',
      queryParams: {
        gqreg: this.regExp ? this.regExp : undefined
      }
    });
  }

  closeDialog() {
    this.itemSelected = true;
    this.dialogRef.close();
  }
}
