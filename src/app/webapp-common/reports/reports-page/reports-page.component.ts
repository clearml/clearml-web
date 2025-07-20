import {Component, OnDestroy, OnInit,} from '@angular/core';
import {Params} from '@angular/router';
import {ReportDialogComponent} from '../report-dialog/report-dialog.component';
import {
  addReportsTags,
  archiveReport,
  createReport,
  deleteReport,
  getReports,
  getReportsTags,
  moveReport,
  resetReports,
  restoreReport,
  setArchive,
  setReportsOrderBy,
  setReportsSearchQuery,
  updateReport
} from '../reports.actions';
import {
  selectArchiveView,
  selectNoMoreReports,
  selectReports,
  selectReportsOrderBy,
  selectReportsQueryString,
  selectReportsSortOrder,
  selectReportsTags
} from '../reports.reducer';
import {combineLatest, Observable, Subscription, take} from 'rxjs';
import {IReport} from '../reports.consts';
import {addMessage} from '../../core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '../../constants';
import {
  selectDefaultNestedModeForFeature,
  selectMainPageTagsFilter,
  selectMainPageTagsFilterMatchMode
} from '../../core/reducers/projects.reducer';
import {debounceTime, filter, map, tap, withLatestFrom} from 'rxjs/operators';
import {setBreadcrumbsOptions, setDefaultNestedModeForFeature} from '@common/core/actions/projects.actions';
import {isEqual} from 'lodash-es';
import {ClipboardService} from 'ngx-clipboard';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {CommonProjectsPageComponent} from '@common/projects/containers/projects-page/common-projects-page.component';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {Project} from '~/business-logic/model/projects/project';
import {selectShowOnlyUserWork} from '@common/core/reducers/users-reducer';
import {concatLatestFrom} from '@ngrx/operators';
import {selectActiveSearch} from '@common/dashboard-search/dashboard-search.reducer';

@Component({
  selector: 'sm-reports-page',
  templateUrl: './reports-page.component.html',
  styleUrls: ['./reports-page.component.scss'],
  standalone: false
})
export class ReportsPageComponent extends CommonProjectsPageComponent implements OnInit, OnDestroy {
  public reports$: Observable<IReport[]>;
  public archive$: Observable<boolean>;
  public reportsTags$: Observable<string[]>;
  private sub = new Subscription();
  public noMoreReports$: Observable<boolean>;
  public reportsOrderBy$: Observable<string>;
  public reportsSortOrder$: Observable<1 | -1>;
  public prevQueryParams: Params;


  constructor(
    private _clipboardService: ClipboardService
  ) {
    super();
    this.reports$ = this.store.select(selectReports);
    this.reportsTags$ = this.store.select(selectReportsTags);
    this.archive$ = this.store.select(selectArchiveView);
    this.noMoreReports$ = this.store.select(selectNoMoreReports);
    this.reportsOrderBy$ = this.store.select(selectReportsOrderBy);
    this.reportsSortOrder$ = this.store.select(selectReportsSortOrder);
    this.selectedProjectId$ = this.store.select(selectRouterParams).pipe(map((params: Params) => params?.projectId));

    this.store.dispatch(getReportsTags());
  }

  public openCreateReportDialog(projectId) {
    this.dialog.open(ReportDialogComponent, {
      data: {defaultProjectId: projectId},
      panelClass: 'light-theme',
    })
      .afterClosed()
      .subscribe(report => {
        if (report) {
          this.store.dispatch(createReport({reportsCreateRequest: report}));
        }
      });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.sub.unsubscribe();
    this.store.dispatch(setArchive({archive: false}));
    this.store.dispatch(resetReports());
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.sub.add(combineLatest([
        this.store.select(selectMainPageTagsFilter),
        this.store.select(selectMainPageTagsFilterMatchMode),
        this.store.select(selectShowOnlyUserWork),
        this.store.select(selectReportsQueryString),
        this.route.queryParams
          .pipe(
            map(params => {
              const {q, qreg, gq, gqreg, tab, gsfilter, ...filteredQueryParams} = params;
              return filteredQueryParams;
            }),
            filter(params => !isEqual(params, this.prevQueryParams)),
            tap((params) => {
              if (params?.archive !== this.prevQueryParams?.archive) {
                this.store.dispatch(setArchive({archive: params?.archive}));
              }
              this.prevQueryParams = params;
            })
          )
      ])
        .pipe(
          debounceTime(100),
        )
        .subscribe(() => {
          this.getReports();
        })
    );

    this.sub.add(this.searchQuery$.subscribe((searchQ) => {
      this.store.dispatch(setReportsSearchQuery(searchQ));
    }));
  }

  protected getReports() {
    this.store.dispatch(getReports());
  }

  reportSelected(report: IReport) {
    this.router.navigate(['reports', (report.project as Project)?.id ?? '*', report.id]);
  }

  toggleArchive(archive: boolean) {
    this.router.navigate(['.'], {relativeTo: this.route, queryParams: {...(archive && {archive})}});
  }

  reportCardUpdateName($event: { name: string; report: IReport }) {
    this.store.dispatch(updateReport({id: $event.report.id, changes: {name: $event.name}}));
  }

  moveTo(report: IReport) {
    this.store.dispatch(moveReport({report}));
  }

  share(report: IReport) {
    this._clipboardService.copyResponse$
      .pipe(take(1))
      .subscribe(() => this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'Report link copied to clipboard'))
      );
    this._clipboardService.copy(`${window.location.origin}/reports/${report.project.id}/${report.id}`);
  }

  addTag($event: { report: IReport; tag: string }) {
    const tags = [...$event.report.tags, $event.tag];
    tags.sort();
    this.store.dispatch(updateReport({id: $event.report.id, changes: {tags}}));
    this.store.dispatch(addReportsTags({tags: [$event.tag]}));
  }

  removeTag($event: { report: IReport; tag: string }) {
    this.store.dispatch(updateReport({
      id: $event.report.id,
      changes: {tags: $event.report.tags.filter(tag => tag !== $event.tag)}
    }));
  }

  override loadMore() {
    this.store.dispatch(getReports(true));
  }

  moveToArchive($event: { report: IReport; archive: boolean }) {
    if ($event.archive) {
      this.store.dispatch(archiveReport({report: $event.report, skipUndo: false}));
    } else {
      this.store.dispatch(restoreReport({report: $event.report, skipUndo: false}));
    }
  }

  override orderByChanged(sortByFieldName: string) {
    this.store.dispatch(setReportsOrderBy({orderBy: sortByFieldName}));
  }

  delete(report: IReport) {
    this.store.dispatch(deleteReport({report}));
  }

  toggleNestedView(nested: boolean) {
    this.store.dispatch(setDefaultNestedModeForFeature({feature: 'reports', isNested: nested}));
    if (nested) {
      this.router.navigate(['*', 'projects'], {relativeTo: this.route});
    } else {
      this.router.navigateByUrl('reports');
    }
  }

  override setupBreadcrumbsOptions() {
    this.subs.add(this.selectedProject$.pipe(
      withLatestFrom(this.store.select(selectDefaultNestedModeForFeature))
    ).subscribe(([selectedProject, defaultNestedModeForFeature]) => {
      this.store.dispatch(setBreadcrumbsOptions({
        breadcrumbOptions: {
          showProjects: !!selectedProject,
          featureBreadcrumb: {
            name: 'REPORTS',
            url: defaultNestedModeForFeature['reports'] ? 'reports/*/projects' : 'reports'
          },
          projectsOptions: {
            basePath: 'reports',
            filterBaseNameWith: ['.reports'],
            compareModule: null,
            showSelectedProject: selectedProject?.id !== '*',
            ...(selectedProject && selectedProject?.id !== '*' && {selectedProjectBreadcrumb: {name: selectedProject?.basename}})
          }
        }
      }));
    }));
  }

  protected override getName() {
    return EntityTypeEnum.report;
  }
}
