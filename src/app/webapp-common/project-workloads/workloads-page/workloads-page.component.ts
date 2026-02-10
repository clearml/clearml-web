import {ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked} from '@angular/core';
import {DateFnsAdapter, MAT_DATE_FNS_FORMATS, provideDateFnsAdapter} from '@angular/material-date-fns-adapter';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import {addDays, format, parseISO, startOfDay, subSeconds} from 'date-fns';
import {enGB} from 'date-fns/locale';
import {HeaderMenuService} from '~/shared/services/header-menu.service';
import {selectIsDeepMode, selectSelectedProject} from '@common/core/reducers/projects.reducer';
import {isExample} from '@common/shared/utils/shared-utils';
import {Store} from '@ngrx/store';
import {setBreadcrumbsOptions} from '@common/core/actions/projects.actions';
import {rxResource, toSignal} from '@angular/core/rxjs-interop';
import {ApiOrganizationService} from '~/business-logic/api-services/organization.service';
import {of} from 'rxjs';
import {MatSelectModule} from '@angular/material/select';
import {TIME_INTERVALS} from '@common/workers-and-queues/workers-and-queues.consts';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {LineChartComponent} from '@common/shared/components/charts/line-chart/line-chart.component';
import {DonutComponent} from '@common/shared/components/charts/donut/donut.component';
import {catchError, map, startWith} from 'rxjs/operators';
import {MatDivider} from '@angular/material/divider';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {ColorHashService} from '@common/shared/services/color-hash/color-hash.service';
import {rgbList2Hex} from '@common/shared/services/color-hash/color-hash.utils';
import {MatIconModule} from '@angular/material/icon';
import {activeLoader, deactivateLoader} from '@common/core/actions/layout.actions';
import {getStatsData, getTotalsData} from '@common/project-workloads/util';
import {injectQueryParams} from 'ngxtension/inject-query-params';
import {
  OrganizationGetProjectWorkloadsResponse
} from '~/business-logic/model/organization/organizationGetProjectWorkloadsResponse';
import {Workloads} from '~/business-logic/model/organization/workloads';
import {PeriodSelectorComponent} from '@common/shared/components/period-selector/period-selector.component';

@Component({
  selector: 'sm-workloads-page',
  templateUrl: './workloads-page.component.html',
  styleUrl: './workloads-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatSelectModule,
    ReactiveFormsModule,
    LineChartComponent,
    DonutComponent,
    MatDivider,
    MatDatepickerModule,
    MatSlideToggle,
    FormsModule,
    MatIconModule,
    PeriodSelectorComponent,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: enGB},
    { provide: DateAdapter, useClass: DateFnsAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MAT_DATE_FNS_FORMATS },
    provideDateFnsAdapter()
  ],
})
export class WorkloadsPageComponent {
  private readonly contextMenuService = inject(HeaderMenuService);
  private readonly store = inject(Store);
  private readonly orgService = inject(ApiOrganizationService);
  private readonly colorHash = inject(ColorHashService);
  private archive = injectQueryParams('archive');

  // 1. Change the control to match the object structure of PeriodSelector
  protected rangeControl = new FormControl({
    period: (TIME_INTERVALS.WEEK).toString(),
    from: null,
    to: null
  });

  // 2. Create a signal from the control value
  protected range = toSignal(this.rangeControl.valueChanges.pipe(
    startWith(this.rangeControl.value)
  ));

  protected timeFrameOptions = [
    {label: '1 Week', value: (TIME_INTERVALS.WEEK).toString()},
    {label: '1 Month', value: (TIME_INTERVALS.MONTH).toString()},
    {label: '3 Months', value: (TIME_INTERVALS.MONTH * 3).toString()},
    {label: '6 Months', value: (TIME_INTERVALS.MONTH * 6).toString()},
  ];
  protected nominalOptions = [
    {label: 'Running Hours', value: 'running'},
    {label: 'GPU Hours', value: 'gpu'},
  ];
  protected timeControl = new FormControl<string>({value: this.timeFrameOptions[0].value, disabled: false});
  protected localRunsControl = new FormControl<boolean>(false);
  protected nominalControl = new FormControl<string>(this.nominalOptions[0].value);
  protected timeFrame = toSignal(this.timeControl.valueChanges
    .pipe(startWith(this.timeFrameOptions[0].value))
  );
  protected localRuns = toSignal(this.localRunsControl.valueChanges
    .pipe(startWith(false))
  );
  protected nominal = toSignal(this.nominalControl.valueChanges
    .pipe(startWith(this.nominalOptions[0].value))
  );


  protected project = this.store.selectSignal(selectSelectedProject);
  protected isDeep = this.store.selectSignal(selectIsDeepMode);
  protected example = computed(() => isExample(this.project()));
  private projectId = computed(() => this.project()?.id);
  protected data = rxResource({
    params: () => ({
      projects: this.projectId(),
      local: this.localRuns(),
      range: this.range(),
    }),
    stream: ({params}) => {
      let from_date: string;
      let to_date: string;
      const formatStr = `yyyy-MM-dd'T'HH:mm:ss.SSSXXX`;

      const { period, from, to } = params.range;

      if (period === 'custom') {
        // PeriodSelector provides ISO strings or Date objects depending on implementation
        // Based on its writeValue, it expects parseable dates
        from_date = from ? format(parseISO(from), formatStr) : null;
        to_date = to ? format(parseISO(to), formatStr) : null;
      } else {
        const current = new Date();
        const timeFrame = parseInt(period, 10);
        to_date = format(current, formatStr);
        const startDate = subSeconds(current, timeFrame);
        const nextDay = addDays(startDate, 1);
        const roundedStartDate = startOfDay(nextDay);
        from_date = format(roundedStartDate, formatStr);
      }

      if (!params.projects || !from_date || (period === 'custom' && !to_date)) {
        return of(null);
      }

      return this.orgService.organizationGetProjectWorkloads({
        projects: [params.projects],
        include_development: params.local,
        from_date,
        ...(to_date && {to_date}),
        usage_fields : ['duration']
      }).pipe(
        catchError(() => of(null)),
        map((res: OrganizationGetProjectWorkloadsResponse) => res)
      );
    }
  });

  protected queueStats = computed(() => getStatsData(this.data.value()?.queues, this.nominal() === 'gpu', this.localRunsControl.value));
  protected projectsStats = computed(() => getStatsData(this.data.value()?.projects, this.nominal() === 'gpu', this.localRunsControl.value));
  protected usersStats = computed(() => getStatsData(this.data.value()?.users, this.nominal() === 'gpu', this.localRunsControl.value));

  protected queueTotals = computed(() => getTotalsData(this.data.value()?.queues, this.nominal() === 'gpu', this.localRunsControl.value));
  protected projectsTotals = computed(() => getTotalsData(this.data.value()?.projects, this.nominal() === 'gpu', this.localRunsControl.value));
  protected usersTotals = computed(() => getTotalsData(this.data.value()?.users, this.nominal() === 'gpu', this.localRunsControl.value));

  protected noData= computed(() => this.queueTotals().length < 1 &&this.projectsTotals().length < 1 && this.usersTotals().length < 1);

  protected queueTotalsColors = computed(() => this.queueTotals().map(label => {
    const color = this.colorHash.colorsSignal()[label.name];
    return color ? rgbList2Hex(color) : this.colorHash.hex(label.name);
  }));


  protected projectTotalsColors = computed(() => this.projectsTotals().map(label => {
    const color = this.colorHash.colorsSignal()[label.name];
    return color ? rgbList2Hex(color) : this.colorHash.hex(label.name);
  }));


  protected usersTotalsColors = computed(() => this.usersTotals().map(label => {
    const color = this.colorHash.colorsSignal()[label.name];
    return color ? rgbList2Hex(color) : this.colorHash.hex(label.name);
  }));
  private readonly period = injectQueryParams('period');
  private readonly from = injectQueryParams('from');
  private readonly to = injectQueryParams('to');


  constructor() {
    if (this.period()) {
      this.rangeControl.patchValue({
        period: this.period(),
        from: this.from(),
        to: this.to()})
    }
    effect(() => {
      if (this.projectId()) {
        untracked(() => this.contextMenuService.setupProjectContextMenu('workloads', this.projectId(), this.archive() === 'true'));
      }
    });

    effect(() => {this.store.dispatch(
      setBreadcrumbsOptions({
        breadcrumbOptions: {
          showProjects: !!this.project(),
          featureBreadcrumb: {
            name: 'PROJECTS',
            url: 'projects'
          },
          ...(this.isDeep() && this.project()?.id !== '*' && {
            subFeatureBreadcrumb: {
              name: 'All Tasks'
            }
          }),
          projectsOptions: {
            basePath: 'projects',
            filterBaseNameWith: null,
            compareModule: null,
            showSelectedProject: this.project()?.id !== '*',
            ...(this.project() && {
              selectedProjectBreadcrumb: {
                name: this.project()?.id === '*' ? 'All Tasks' : this.project()?.basename,
                url: `projects/${this.project()?.id}/projects`
              }
            })
          }
        }
      })
    )
    });

    effect(() => {
      if (this.data.isLoading()) {
        this.store.dispatch(activeLoader('project workloads'));
      } else {
        this.store.dispatch(deactivateLoader('project workloads'));
      }
    });
  }
  protected formatter = (n: number) => `${Math.floor(n * 1000) / 1000}`;

  usesDefaultWeight(usage: Workloads) {
    return usage.series.some(series => series.gpu_usage_artifical_weights);
  }
}
