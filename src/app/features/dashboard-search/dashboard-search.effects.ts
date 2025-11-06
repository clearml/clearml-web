import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {catchError, map, mergeMap, switchMap} from 'rxjs/operators';
import {getEndpoints, getResultsCount, setLoadingEndpointsResults, setResultsCount} from '@common/dashboard-search/dashboard-search.actions';
import {getEntityStatQuery} from '@common/dashboard-search/dashboard-search.effects';
import {ApiOrganizationService} from '~/business-logic/api-services/organization.service';
import {Store} from '@ngrx/store';
import {selectHideExamples, selectShowHidden} from '@common/core/reducers/projects.reducer';
import {
  selectFilteredEndpointsResults, selectFilteredLoadingEndpointsResults,
  selectSearchIsAdvance,
  selectSearchTableFilters
} from '@common/dashboard-search/dashboard-search.reducer';
import { concatLatestFrom } from '@ngrx/operators';
import {ApiServingService} from '~/business-logic/api-services/serving.service';
import {ServingGetLoadingInstancesResponse} from '~/business-logic/model/serving/servingGetLoadingInstancesResponse';
import {deactivateLoader} from '@common/core/actions/layout.actions';
import {requestFailed} from '@common/core/actions/http.actions';
import {
  OrganizationGetEntitiesCountRequest
} from '~/business-logic/model/organization/organizationGetEntitiesCountRequest';
import {activeSearchLink} from '~/features/dashboard-search/dashboard-search.consts';


@Injectable()
export class DashboardSearchEffects {
  private actions = inject(Actions);
  private store = inject(Store);
  private organizationApi = inject(ApiOrganizationService);
  private readonly servingApi = inject(ApiServingService);

  getResultsCount = createEffect(() => this.actions.pipe(
      ofType(getResultsCount),
      concatLatestFrom(() => [
        this.store.select(selectSearchTableFilters),
        this.store.select(selectShowHidden),
        this.store.select(selectHideExamples),
        this.store.select(selectSearchIsAdvance),
      ]),
      switchMap(([action, filters, hidden, hideExamples, advanced]) => this.organizationApi.organizationGetEntitiesCount({
        // ...(filters.myWork?.value?.[0]==='true' && {active_users: [user.id]}),
        ...(hidden && {search_hidden: true}),
        ...(hideExamples && {allow_public: false}),
        ...getEntityStatQuery(action, hidden, filters, advanced),
        limit: 1,
      } as OrganizationGetEntitiesCountRequest)),
      concatLatestFrom(() => [this.store.select(selectFilteredEndpointsResults), this.store.select(selectFilteredLoadingEndpointsResults)]),
      map(([{ pipelines, pipeline_runs, datasets, dataset_versions, errors, ...rest},endpoints, loadingEndpoints]) =>
        setResultsCount({
          counts: {
            ...rest,
            [activeSearchLink.pipelines]: pipelines + pipeline_runs,
            [activeSearchLink.datasets]: datasets + dataset_versions,
            [activeSearchLink.modelEndpoints]: endpoints?.length + loadingEndpoints?.length
          },
          errors
        }))
    )
  );

  getLoadingEndpoints = createEffect(() => this.actions.pipe(
    ofType(getEndpoints),
    concatLatestFrom(() => [
      this.store.select(selectSearchIsAdvance),
    ]),
    switchMap(([action,]) => this.servingApi.servingGetLoadingInstances({})
      .pipe(
        mergeMap((res: ServingGetLoadingInstancesResponse) => [
          setLoadingEndpointsResults({instances: res.instances}),
          deactivateLoader(action.type)
        ]),
        catchError(error => [deactivateLoader(action.type), requestFailed(error)])
      )
    )
  ));
}
