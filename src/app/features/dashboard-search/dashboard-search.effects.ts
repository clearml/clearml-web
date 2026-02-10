import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {map, switchMap} from 'rxjs/operators';
import {getResultsCount, setResultsCount} from '@common/dashboard-search/dashboard-search.actions';
import {getEntityStatQuery} from '@common/dashboard-search/dashboard-search.effects';
import {ApiOrganizationService} from '~/business-logic/api-services/organization.service';
import {Store} from '@ngrx/store';
import {selectHideExamples, selectShowHidden} from '@common/core/reducers/projects.reducer';
import {
  selectAdvancedSearch,
  selectFilteredEndpointsResults, selectFilteredLoadingEndpointsResults,
  selectTabFilters
} from '@common/dashboard-search/dashboard-search.reducer';
import {concatLatestFrom} from '@ngrx/operators';


@Injectable()
export class DashboardSearchEffects {
  private actions = inject(Actions);
  private store = inject(Store);
  private organizationApi = inject(ApiOrganizationService);
  getResultsCount = createEffect(() => this.actions.pipe(
      ofType(getResultsCount),
      concatLatestFrom(() => [
        this.store.select(selectTabFilters),
        this.store.select(selectShowHidden),
        this.store.select(selectHideExamples),
        this.store.select(selectAdvancedSearch),
      ]),
      switchMap(([action, filters, hidden, hideExamples, advanced]) => this.organizationApi.organizationGetEntitiesCount({
        // ...(filters.myWork?.value?.[0]==='true' && {active_users: [user.id]}),
        ...(hidden && {search_hidden: true}),
        ...(hideExamples && {allow_public: false}),
        ...getEntityStatQuery(action, hidden, filters, advanced),
        limit: 1,
      })),
    concatLatestFrom(() => [this.store.select(selectFilteredEndpointsResults), this.store.select(selectFilteredLoadingEndpointsResults)]),
    map(([{pipelines, pipeline_runs, datasets, dataset_versions, errors, ...rest}, endpoints, loadingEndpoints]) =>
        setResultsCount({
          counts: {
            ...rest,
            pipelines: pipelines + pipeline_runs,
            datasets: datasets + dataset_versions,
            modelEndpoints: endpoints?.length + loadingEndpoints?.length
          },
          errors
        }))
    )
  );
}
