import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {inject} from '@angular/core';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {forkJoin, lastValueFrom, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {sortByField} from '@common/tasks/tasks.utils';

interface ProjectSettingsState {
  scalars: MetricVariantResult[];
  projectId: string;
}

const initialState: ProjectSettingsState = {
  scalars: [],
  projectId: null,
};

export const ProjectSettingsStore = signalStore(
  withState(initialState),
  withMethods((store, projectsApi = inject(ApiProjectsService)) => ({
    async loadScalars() {
      const experimentsMetrics: Observable<MetricVariantResult[]> = projectsApi.projectsGetUniqueMetricVariants({
        project: store.projectId() === '*' ? null : store.projectId(),
        include_subprojects: false
      }).pipe(map(res => res.metrics))
      const modelsMetrics: Observable<MetricVariantResult[]> = projectsApi.projectsGetUniqueMetricVariants({
        project: store.projectId() === '*' ? null : store.projectId(),
        include_subprojects: false,
        model_metrics: true
      }).pipe(map(res => res.metrics))
      const scalars = await lastValueFrom(forkJoin([experimentsMetrics, modelsMetrics]));
      // const scalars = toSignal(experimentsMetrics);
      patchState(store, { scalars: sortByField(scalars?.flat(), 'metric') || [] });
    },

    setProject(projectId: string): void {
      patchState(store, () => ({ projectId: projectId }));
    },
  }))
);
