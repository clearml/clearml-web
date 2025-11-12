import {inject, Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import * as actions from './select-model.actions';
import {getNextModels, getSelectedModels, setSelectedModels, setSelectedModelsList} from './select-model.actions';
import * as exSelectors from './select-model.reducer';
import {selectTableSortFields} from './select-model.reducer';
import {MODELS_PAGE_SIZE} from '../models/models.consts';
import {catchError, debounceTime, map, mergeMap, switchMap} from 'rxjs/operators';
import {get} from 'lodash-es';
import {MODEL_TAGS, MODELS_TABLE_COL_FIELDS} from '../models/shared/models.const';
import {ApiModelsService} from '~/business-logic/api-services/models.service';
import {requestFailed} from '../core/actions/http.actions';
import {activeLoader, addMessage, deactivateLoader, setServerError} from '../core/actions/layout.actions';
import {addMultipleSortColumns} from '../shared/utils/shared-utils';
import {of} from 'rxjs';
import {FilterMetadata} from 'primeng/api';
import {ModelsGetAllExRequest} from '~/business-logic/model/models/modelsGetAllExRequest';
import {SortMeta} from 'primeng/api';
import {createFiltersFromStore, encodeOrder, excludedKey, getTagsFilters} from '../shared/utils/tableParamEncode';
import {escapeRegex} from '@common/shared/utils/escape-regex';
import {selectRouterProjectId} from '@common/core/reducers/projects.reducer';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';

@Injectable()
export class SelectModelEffects {
  private selectModelsOnlyFields = ['created', 'framework', 'id', 'labels', 'name', 'ready', 'tags', 'system_tags', 'task.name', 'uri', 'user.name', 'parent', 'design', 'company', 'project.name', 'comment', 'last_update'];

  private actions$ = inject(Actions);
  private store = inject(Store);
  private apiModels = inject(ApiModelsService);
  private apiProjects = inject(ApiProjectsService);

  activeLoader = createEffect(() => this.actions$.pipe(
    ofType(actions.getNextModels, actions.globalFilterChanged, actions.tableSortChanged, actions.tableFilterChanged),
    map(action => activeLoader(action.type))
  ));

  getFrameworksEffect = createEffect(() => this.actions$.pipe(
    ofType(actions.getFrameworks),
    concatLatestFrom(() =>
      this.store.select(selectRouterParams).pipe(map(params => params?.projectId ?? '*')),
    ),
    switchMap(([, projectId]) => this.apiModels.modelsGetFrameworks({projects: projectId !== '*' ? [projectId] : []})
      .pipe(
        mergeMap(res => [
          actions.setFrameworks({frameworks: res.frameworks.concat(null)}),
        ]),
        catchError(error => [
          requestFailed(error),
          addMessage('warn', 'Fetch frameworks failed', [{
            name: 'More info',
            actions: [setServerError(error, null, 'Fetch frameworks failed')]
          }])]
        )
      )
    )
  ));

  getTagsEffect = createEffect(() => this.actions$.pipe(
    ofType(actions.getTags),
    concatLatestFrom(() => this.store.select(selectRouterParams).pipe(map(params => params?.projectId ?? '*'))),
    switchMap(([, projectId]) => this.apiProjects.projectsGetModelTags({
      projects: (projectId === '*') ? [] : [projectId]
    }).pipe(
      mergeMap(res => [
        actions.setTags({tags: res.tags.concat(null)}),
      ]),
      catchError(error => [
        requestFailed(error),
        addMessage('warn', 'Fetch tags failed', [{
          name: 'More info',
          actions: [setServerError(error, null, 'Fetch tags failed')]
        }])]
      )
    ))
  ));

  tableSortChange = createEffect(() => this.actions$.pipe(
    ofType(actions.tableSortChanged),
    concatLatestFrom(() => this.store.select(selectTableSortFields)),
    switchMap(([action, oldOrders]) => {
      const orders = addMultipleSortColumns(oldOrders, action.colId, action.isShift);
      return [actions.setTableSort({orders})];
    })
  ));

  modelsFilterChanged = createEffect(() => this.actions$.pipe(
    ofType(actions.globalFilterChanged, actions.tableSortChanged, actions.tableFilterChanged, actions.showArchive, actions.clearTableFilter),
    debounceTime(0), // Let other effects finish first
    switchMap((action) => this.fetchModels$(null)
      .pipe(
        mergeMap(res => [
          actions.setNoMoreModels({noMore: res.models.length < MODELS_PAGE_SIZE}),
          actions.setModels({models: res.models}),
          actions.setCurrentScrollId({scrollId: res.scroll_id}),
          deactivateLoader(action.type)
        ]),
        catchError(error => [requestFailed(error), deactivateLoader(action.type), setServerError(error, null, 'Fetch Models failed')])
      )
    )
  ));

  getModels = createEffect(() => this.actions$.pipe(
    ofType(getNextModels),
    concatLatestFrom(() => this.store.select(exSelectors.selectCurrentScrollId)),
    switchMap(([action, scrollId]) =>
      this.fetchModels$(scrollId)
        .pipe(
          mergeMap(res => [
            actions.setNoMoreModels({noMore: res.models.length < MODELS_PAGE_SIZE}),
            actions.addModels({models: res.models}),
            actions.setCurrentScrollId({scrollId: res.scroll_id}),
            deactivateLoader(action.type)
          ]),
          catchError(error => [requestFailed(error), deactivateLoader(action.type), setServerError(error, null, 'Fetch Models failed')])
        )
    )
  ));

  getSelectedModels = createEffect(() => this.actions$.pipe(
    ofType(getSelectedModels),
    switchMap(action => this.apiModels.modelsGetAllEx({
      id: action.selectedIds,

      only_fields: this.selectModelsOnlyFields
    })),
    mergeMap(res => [
      setSelectedModelsList({models: res.models}),
      setSelectedModels({models: res.models})
    ])
  ));

  getGetAllQuery(
    scrollId: string, projectId: string, searchQuery: string, orderFields: SortMeta[],
    tableFilters: Record<string, FilterMetadata>, showArchived: boolean
  ): ModelsGetAllExRequest {
    const userFilter = get(tableFilters, [MODELS_TABLE_COL_FIELDS.USER, 'value']);
    const tagsFilter = tableFilters?.[MODELS_TABLE_COL_FIELDS.TAGS]?.value;
    const tagsFilterAnd = tableFilters?.[MODELS_TABLE_COL_FIELDS.TAGS]?.matchMode === 'AND';
    const projectFilter = get(tableFilters, [MODELS_TABLE_COL_FIELDS.PROJECT, 'value']);
    const systemTags = tableFilters?.system_tags?.value;
    const systemTagsFilter = (showArchived ? [] :
      ['__$and', excludedKey, MODEL_TAGS.HIDDEN]).concat(systemTags ? systemTags : []);
    const filters = createFiltersFromStore(tableFilters, true);
    delete filters['tags'];
    return {
      ...filters,
      _any_: searchQuery ? {
        pattern: escapeRegex(searchQuery),
        fields: ['id', 'name', 'framework', 'system_tags', 'uri']
      } : undefined,

      project: projectFilter,
      scroll_id: scrollId || null, // null to create new scroll (undefined doesn't generate scroll)
      size: MODELS_PAGE_SIZE,
      order_by: encodeOrder(orderFields),
      ...(tagsFilter?.length > 0 && {
        filters: {
          tags: getTagsFilters(tagsFilterAnd, tagsFilter),
        }
      }),
      system_tags: (systemTagsFilter && systemTagsFilter.length > 0) ? systemTagsFilter : [],
      only_fields: this.selectModelsOnlyFields,
      ...(tableFilters?.[MODELS_TABLE_COL_FIELDS.READY]?.value.length == 1 && !!tableFilters) ?
        {ready: tableFilters?.[MODELS_TABLE_COL_FIELDS.READY]?.value[0] === 'true'} : {ready: undefined},
      ...(!window.location.href.includes('compare') && {ready: true}),
      framework: tableFilters?.[MODELS_TABLE_COL_FIELDS.FRAMEWORK]?.value ?? undefined,
      user: (userFilter && userFilter.length > 0) ? userFilter : undefined

    };
  }

  fetchModels$(scrollId1: string) {
    return of(scrollId1)
      .pipe(
        concatLatestFrom(() => [
          // TODO: refactor with ngrx router.
          this.store.select(selectRouterProjectId),
          this.store.select(exSelectors.selectGlobalFilter),
          this.store.select(exSelectors.selectTableSortFields),
          this.store.select(exSelectors.selectSelectModelTableFilters),
          this.store.select(exSelectors.selectShowArchive)
        ]),
        switchMap(([scrollId, projectId, gb, sortFields, filters, showArchive]) =>
          this.apiModels.modelsGetAllEx(this.getGetAllQuery(scrollId, projectId, gb, sortFields, filters, showArchive))
        )
      );
  }

  getReadyFilter(tableFilters) {
    switch (tableFilters?.ready?.value?.length) {
      case 0:
        return null;
      case 1:
        return tableFilters.ready.value[0] === 'true';
      case 2:
        return null;
      default:
        return null;
    }
  }
}
