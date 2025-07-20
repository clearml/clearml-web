import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {map, switchMap} from 'rxjs/operators';
import {getResultsCount, setResultsCount} from '@common/dashboard-search/dashboard-search.actions';
import {getEntityStatQuery} from '@common/dashboard-search/dashboard-search.effects';
import {ApiOrganizationService} from '~/business-logic/api-services/organization.service';
import {Store} from '@ngrx/store';
import {selectHideExamples, selectShowHidden} from '@common/core/reducers/projects.reducer';
import {selectSearchTableFilters} from '@common/dashboard-search/dashboard-search.reducer';
import { concatLatestFrom } from '@ngrx/operators';


@Injectable()
export class DashboardSearchEffects {
  constructor(
    private actions: Actions,
    private store: Store,
    private organizationApi: ApiOrganizationService,
  ) {}

  getResultsCount = createEffect(() => this.actions.pipe(
    ofType(getResultsCount),
    concatLatestFrom(() => [
      this.store.select(selectSearchTableFilters),
      this.store.select(selectShowHidden),
      this.store.select(selectHideExamples),
    ]),
    switchMap(([action, filters, hidden, hideExamples]) => this.organizationApi.organizationGetEntitiesCount({
      // ...(filters.myWork?.value?.[0]==='true' && {active_users: [user.id]}),
      ...(hidden && {search_hidden: true}),
      ...(hideExamples && {allow_public: false}),
      ...getEntityStatQuery(action, hidden, filters),
      limit: 1,
    })),
    map(({ pipelines, pipeline_runs, datasets, dataset_versions, ...rest}) =>
      setResultsCount({counts: {...rest, pipelines: pipelines+ pipeline_runs, datasets: datasets + dataset_versions }}))
    )
  );
}
