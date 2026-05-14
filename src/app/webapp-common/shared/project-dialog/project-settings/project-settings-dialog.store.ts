import {patchState, signalStoreFeature, withComputed, withMethods, withState} from '@ngrx/signals';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {computed, inject} from '@angular/core';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {forkJoin, lastValueFrom, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {sortByField} from '@common/tasks/tasks.utils';
import {environment} from '../../../../../environments/environment';

interface ProjectSettingsState {
  scalars: MetricVariantResult[];
  projectId: string;
  readOnly: boolean;
}

const initialState: ProjectSettingsState = {
  scalars: [],
  projectId: null,
  readOnly: false,
};

export const withProjectSettingsStore = signalStoreFeature(
  environment.storeDevToolsFeature('project-settings'),
  withState(initialState),
  withComputed(({readOnly}) => ({
    isReadOnly: computed(() => readOnly())
  })),
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
