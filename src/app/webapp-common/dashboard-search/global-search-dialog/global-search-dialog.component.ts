import {ChangeDetectorRef, Component, inject, OnDestroy} from '@angular/core';
import {SearchComponent} from '@common/shared/ui-components/inputs/search/search.component';
import {DashboardSearchModule} from '~/features/dashboard-search/dashboard-search.module';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {Store} from '@ngrx/store';
import {searchSetTerm} from '@common/dashboard-search/dashboard-search.actions';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {PushPipe} from '@ngrx/component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {distinctUntilChanged, filter} from 'rxjs/operators';
import {selectSearchTerm} from '@common/dashboard-search/dashboard-search.reducer';
import {Observable} from 'rxjs';
import {ShowOnlyUserWorkComponent} from '@common/shared/components/show-only-user-work/show-only-user-work.component';
import {MatDialogRef} from '@angular/material/dialog';

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
    TooltipDirective,
    ShowOnlyUserWorkComponent
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
    this.searchQuery$ = this.store.select(selectSearchTerm);
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
    if (!this.itemSelected) {
      this.router.navigate([], {
        relativeTo: this.route,
        replaceUrl: true,
        queryParamsHandling: 'merge',
        queryParams: {
          gq: undefined,
          gqreg: undefined,
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
    if(!this.regExp) {
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
