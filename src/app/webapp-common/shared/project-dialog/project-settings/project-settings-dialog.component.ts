import {ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal, Signal} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatButton} from '@angular/material/button';
import {groupByCharts, GroupByCharts, setExperimentSettings} from '@common/experiments/actions/common-experiment-output.actions';
import {smoothTypeEnum, SmoothTypeEnum} from '@common/shared/single-graph/single-graph.utils';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {Store} from '@ngrx/store';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogRef} from '@angular/material/dialog';
import {selectHasScalarSingleValue, selectSelectedExperimentSettings, selectSelectedSettingsHiddenScalar} from '@common/experiments/reducers';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {Project} from '~/business-logic/model/projects/project';
import {MatTab, MatTabGroup} from '@angular/material/tabs';
import {EditProjectFormComponent} from '@common/shared/project-dialog/edit-project-form/edit-project-form.component';
import {ProjectsCreateRequest} from '~/business-logic/model/projects/projectsCreateRequest';
import {SelectableGroupedFilterListComponent} from '@common/shared/ui-components/data/selectable-grouped-filter-list/selectable-grouped-filter-list.component';
import {GroupedList} from '@common/tasks/tasks.model';
import {sortByFieldSummaryFirst} from '@common/tasks/tasks.utils';
import {singleValueChartTitle} from '@common/experiments/shared/common-experiments.const';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {PlotData} from 'plotly.js';
import {GraphSettingsBarComponent} from '@common/shared/experiment-graphs/graph-settings-bar/graph-settings-bar.component';
import {updateProject as dialogUpdateProject} from '@common/shared/project-dialog/project-dialog.actions';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ProjectSettingsStore} from '@common/shared/project-dialog/project-settings/project-settings-dialog.store';
import {SingleGraphStateModule} from '@common/shared/single-graph/single-graph-state.module';

export interface ProjectSettingsDialogConfig {
  project: Project;
}

@Component({
  selector: 'sm-project-settings',
  templateUrl: './project-settings-dialog.component.html',
  styleUrls: ['./project-settings-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProjectSettingsStore],
  imports: [
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatButton,
    SingleGraphStateModule,
    DialogTemplateComponent,
    MatTabGroup,
    MatTab,
    EditProjectFormComponent,
    MatDialogActions,
    SelectableGroupedFilterListComponent,
    GraphSettingsBarComponent,
    TooltipDirective
  ]
})
export class ProjectSettingsDialogComponent {
  private store = inject(Store);
  private settingsStore = inject(ProjectSettingsStore);
  private dialogRef = inject(MatDialogRef);
  protected readonly data: ProjectSettingsDialogConfig = inject(MAT_DIALOG_DATA);
  groupByOptions = [
    {
      name: 'Metric',
      value: groupByCharts.metric
    },
    {
      name: 'None',
      value: groupByCharts.none
    }
  ];

  private defaultSettings = {
    groupBy: groupByCharts.metric,
    smoothWeight: 0,
    smoothSigma: 2,
    smoothType: smoothTypeEnum.exponential,
    xAxisType: ScalarKeyEnum.Iter,
    hiddenMetricsScalar: [],
    showOriginals: true,
    projectLevel: false
  };

  protected hasSingleValues = this.store.selectSignal(selectHasScalarSingleValue);
  protected searchTerm = signal('');
  protected storeListOfHidden = this.store.selectSignal(selectSelectedSettingsHiddenScalar(this.data.project.id));
  protected listOfHidden = linkedSignal(() => [...this.storeListOfHidden()]);

  protected storeSettings = this.store.selectSignal(selectSelectedExperimentSettings(this.data.project.id));
  protected settings = linkedSignal(() => ({...this.defaultSettings, ...this.storeSettings()}));
  protected settingsGroupBy = computed(() => this.settings().groupBy);

  protected scalarsWithoutSummary = computed(() => this.settingsStore.scalars().map(variant => variant.metric === singleValueChartTitle ? {...variant, variant: null} : variant))
  protected originalScalarList = computed(() => [
    ...this.scalarsWithoutSummary().map(({metric, variant}) => ({
      metric,
      variant
    }))
  ]);

  protected scalarList: Signal<GroupedList> = computed(() => ({
    ...this.groupByMetric(this.scalarsWithoutSummary(), this.settingsGroupBy() === 'none')
  }));

  protected selectedMetrics = computed(() => {
    const selectedMetrics = this.settingsGroupBy() === 'metric' ? this.originalScalarList().filter(({metric}) => !this.listOfHidden().includes(metric)) :
      this.originalScalarList().filter(({metric, variant}) => variant !== null ?
      !this.listOfHidden().includes(`${metric}${variant}`) && !this.listOfHidden().includes(metric) :
      !this.listOfHidden().includes(metric)
    );

    const metricsWithoutVariants = selectedMetrics
      .map(({metric}) => metric)
      .filter(m => !!m);
    return Array.from(new Set([
      ...selectedMetrics.map(({metric, variant}) => `${metric}${variant}`),
      ...metricsWithoutVariants
    ]));
  });

  private project: Project;
  protected scalarSettingsChanged = signal(false);
  protected generalChanged= signal(false);
  protected hiddenChanged= signal(false);
  dialogTitle = signal<string>(`PROJECT SETTINGS: "${this.data.project.name}"`);

  constructor() {
    this.settingsStore.setProject(this.data.project.id);
    this.settingsStore.loadScalars();
  }

  changeSmoothness($event: number) {
    this.scalarSettingsChanged.set(true);
    this.settings.update(settings => ({...settings, smoothWeight: $event}));
  }
  changeSigma($event: number) {
    this.scalarSettingsChanged.set(true);
    this.settings.update(settings => ({...settings, smoothSigma: $event}));
  }

  changeSmoothType($event: SmoothTypeEnum) {
    this.scalarSettingsChanged.set(true);
    this.settings.update(settings => ({
      ...settings, smoothType: $event,
      ...(settings.smoothType !== smoothTypeEnum.gaussian && {smoothSigma: 2})
    }));
  }

  changeXAxisType($event: ScalarKeyEnum) {
    this.scalarSettingsChanged.set(true);
    this.settings.update(settings => ({...settings, xAxisType: $event}));
  }

  changeGroupBy($event: GroupByCharts) {
    this.scalarSettingsChanged.set(true);
    this.settings.update(settings => ({...settings, groupBy: $event}));
  }

  changeShowOriginals($event: boolean) {
    this.scalarSettingsChanged.set(true);
    this.settings.update(settings => ({...settings, showOriginals: $event}));
  }

  closeDialog() {
    this.dialogRef.close();
  }

  updateProject(projectForm) {
    this.generalChanged.set(true);
    this.project = this.convertFormToProject(projectForm);
  }

  private convertFormToProject(projectForm: any): ProjectsCreateRequest {
    return {
      name: `${projectForm.parent === 'Projects root' ? '' : projectForm.parent + '/'}${projectForm.name}`,
      ...(projectForm.description && {description: projectForm.description}),
      ...(projectForm.system_tags && {system_tags: projectForm.system_tags}),
      default_output_destination: projectForm.default_output_destination
    };
  }


  groupByMetric(variants: MetricVariantResult[], groupBy:boolean): GroupedList {
    const result: GroupedList = {};

    sortByFieldSummaryFirst(variants, 'metric').forEach((variant) => {
      if (!result[variant.metric]) {
        result[variant.metric] = {};
      }

      if(groupBy && variant.variant) {
        result[variant.metric][variant.variant] = {} as PlotData;
      }
    });

    return result;
  }

  hiddenListChanged(hiddenList: string[]) {
    if (Object.keys(this.scalarList() ?? {}).length > 0) {
      this.hiddenChanged.set(true);
    }
    const metrics = Object.keys(this.scalarList());
    const variants = metrics.map((metric) => Object.keys(this.scalarList()[metric]).map(v => metric + v)).flat(2);
    this.listOfHidden.set([...metrics, ...variants].filter(metric => !hiddenList.includes(metric)));
  }

  searchTermChanged(searchTerm: string) {
    this.searchTerm.set(searchTerm);
  }

  save() {
    if (this.scalarSettingsChanged() || this.hiddenChanged()) {
      this.store.dispatch(setExperimentSettings({
        id: this.data.project.id,
        changes: {
          ...{
            ...this.settings(),
            hiddenMetricsScalar: this.settings().hiddenMetricsScalar?.length > 0 ? this.settings().hiddenMetricsScalar : undefined,
            projectLevel: true},
          ...(this.hiddenChanged() && {hiddenMetricsScalar: this.listOfHidden()})
        }
      }));
      if (!this.generalChanged()) {
        this.dialogRef.close();
      }
    }
    if (this.generalChanged()) {
      this.store.dispatch(dialogUpdateProject({req: {...this.project, project: this.data.project.id}, dialogId: this.dialogRef.id}));
    }
  }
}

