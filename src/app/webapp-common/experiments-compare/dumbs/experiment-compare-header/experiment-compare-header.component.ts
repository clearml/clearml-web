import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatSelectChange} from '@angular/material/select';
import {Store} from '@ngrx/store';
import {selectHideIdenticalFields, selectShowRowExtremes} from '../../reducers';
import {Observable, Subscription} from 'rxjs';
import {
  refreshIfNeeded,
  setExportTable,
  setHideIdenticalFields,
  setShowGlobalLegend,
  setShowRowExtremes,
  setShowSearchExperimentsForCompare
} from '../../actions/compare-header.actions';
import {ActivatedRoute, Router} from '@angular/router';
import {selectRouterParams, selectRouterQueryParams, selectRouterUrl} from '@common/core/reducers/router-reducer';
import {setAutoRefresh} from '@common/core/actions/layout.actions';
import {filter, map} from 'rxjs/operators';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';
import {compareLimitations} from '@common/shared/entity-page/footer-items/compare-footer-item';
import {
  SelectExperimentsForCompareComponent,
  allowAddExperiment$
} from '../../containers/select-experiments-for-compare/select-experiments-for-compare.component';
import {RefreshService} from '@common/core/services/refresh.service';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {paramsActions} from '@common/experiments-compare/actions/experiments-compare-params.actions';
import {SelectModelComponent} from '@common/select-model/select-model.component';
import {MatDialog} from '@angular/material/dialog';
import {setArchive} from '@common/core/actions/projects.actions';

@Component({
  selector: 'sm-experiment-compare-header',
  templateUrl: './experiment-compare-header.component.html',
  styleUrls: ['./experiment-compare-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class ExperimentCompareHeaderComponent implements OnInit, OnDestroy {

  viewModeToIcon = {
    graph: 'al-ico-charts-view',
    scatter: 'al-ico-scatter-view',
  };

  private routerSubscription: Subscription;
  public selectHideIdenticalFields$: Observable<boolean>;
  public selectShowRowExtremes$: Observable<boolean>;

  public viewMode: string;
  public currentPage: string;
  public compareLimitations = compareLimitations;
  public allowAddExperiment$: Observable<boolean>;
  public queryParamsViewMode$: Observable<string>;
  private autorRefreshSub: Subscription;
  private showMenuSub: Subscription;
  private selectedIds: string;

  @Input() entityType: EntityTypeEnum;

  constructor(
    private store: Store,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private refresh: RefreshService,
    private dialog: MatDialog
  ) {
    this.selectHideIdenticalFields$ = this.store.select(selectHideIdenticalFields);
    this.selectShowRowExtremes$ = this.store.select(selectShowRowExtremes);
    this.queryParamsViewMode$ = this.store.select(selectRouterQueryParams)
      .pipe(map(params => params[this.currentPage]));
    this.routerSubscription = this.store.select(selectRouterParams).subscribe((params) => {
      this.selectedIds = params?.ids;
    });
  }

  ngOnInit() {
    this.store.dispatch(setArchive({archive: false}));
    this.autorRefreshSub = this.refresh.tick
      .pipe(filter(auto => auto === null))
      .subscribe(() => this.store.dispatch(refreshIfNeeded({payload: true, autoRefresh: true, entityType: this.entityType})));

    this.routerSubscription = this.store.select(selectRouterUrl).subscribe(() => {
      const currentPage = this.route?.snapshot?.firstChild?.url?.[0]?.path;
      const viewMode = this.route?.snapshot?.firstChild?.url?.[1]?.path;
      if (currentPage && viewMode && (currentPage !== this.currentPage || viewMode !== this.viewMode)) {
        this.store.dispatch(paramsActions.setView({primary: currentPage, secondary: viewMode}));
      }
      this.currentPage = currentPage;
      this.viewMode = viewMode;
      this.cdr.detectChanges();
    });

    this.allowAddExperiment$ = allowAddExperiment$(this.store.select(selectRouterParams));
  }

  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
    this.autorRefreshSub.unsubscribe();
    this.showMenuSub?.unsubscribe();
  }

  changeView(event: MatSelectChange) {
    const page = event.value.replace(/.*_/, '');
    this.router.navigate([`./${this.currentPage}/${page}`], {
      relativeTo: this.route,
      queryParams: {params: undefined},
      queryParamsHandling: 'merge'
    });
  }

  openAddExperimentSearch() {
    if (this.entityType === EntityTypeEnum.model) {
      const selectedIds = this.selectedIds?.split(',') ?? [];
      this.dialog.open(SelectModelComponent, {
        data: {
          selectionMode: 'multiple',
          selectedModels: selectedIds,
          header: 'Select compared model'
        },
        panelClass: 'full-screen',
      }).afterClosed().pipe(filter(ids => !!ids)).subscribe(ids => this.updateUrl(ids));
    } else {
      this.dialog.open(SelectExperimentsForCompareComponent, {
        data: {entityType: this.entityType},
        panelClass: 'full-screen',
      }).afterClosed().pipe(filter(ids => !!ids)).subscribe(ids => this.updateUrl(ids));
    }
  }

  updateUrl(ids: string[]) {
    this.router.navigate(
      [{ids}, ...this.route.firstChild?.snapshot.url.map(segment => segment.path)],
      {
        queryParamsHandling: 'preserve',
        relativeTo: this.route,
      });
  }

  hideIdenticalFieldsToggled(event: MatSlideToggleChange) {
    this.store.dispatch(setHideIdenticalFields({payload: event.checked}));
  }

  showExtremesToggled(event: MatSlideToggleChange) {
    this.store.dispatch(setShowRowExtremes({payload: event.checked}));
  }

  setAutoRefresh($event: boolean) {
    this.store.dispatch(setAutoRefresh({autoRefresh: $event}));
  }

  menuClosed() {
    this.store.dispatch(setShowSearchExperimentsForCompare({payload: false}));
  }

  exportCSV() {
    this.store.dispatch(setExportTable({export: true}));
  }

  showGlobalLegend() {
    this.store.dispatch(setShowGlobalLegend());

  }
}
