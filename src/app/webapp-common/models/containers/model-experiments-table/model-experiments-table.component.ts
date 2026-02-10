import {Component, effect, EventEmitter, inject, OnDestroy, viewChild, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';
import {
  selectExperimentsList,
  selectGlobalFilter,
  selectNoMoreExperiments,
  selectTableFilters,
  selectSplitSize,
} from '@common/experiments/reducers';
import {uniq} from 'lodash-es';
import {ColHeaderTypeEnum, ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import * as experimentsActions from '../../../experiments/actions/common-experiments-view.actions';
import {resetExperiments, resetGlobalFilter} from '@common/experiments/actions/common-experiments-view.actions';
import {selectProjectSystemTags} from '@common/core/reducers/projects.reducer';
import {SortMeta} from 'primeng/api';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {ExperimentsTableComponent} from '@common/experiments/dumb/experiments-table/experiments-table.component';
import {
  modelExperimentsTableFilterChanged,
  modelsExperimentsTableClearAllFilters
} from '@common/models/actions/models-info.actions';
import {EXPERIMENTS_TABLE_COL_FIELDS} from '~/features/experiments/shared/experiments.const';
import {MatFormField, MatInput} from '@angular/material/input';
import {
  ClearFiltersButtonComponent
} from '@common/shared/components/clear-filters-button/clear-filters-button.component';
import {FormsModule} from '@angular/forms';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {PushPipe} from '@ngrx/component';
import {selectModelId} from '@common/models/reducers';

export const INITIAL_MODEL_EXPERIMENTS_TABLE_COLS: ISmCol[] = [
  {
    id: EXPERIMENTS_TABLE_COL_FIELDS.NAME,
    headerType: ColHeaderTypeEnum.title,
    sortable: false,
    header: 'NAME',
    style: {width: '400px'},
  },
  {
    id: EXPERIMENTS_TABLE_COL_FIELDS.TAGS,
    getter: ['tags', 'system_tags'],
    headerType: ColHeaderTypeEnum.sortFilter,
    filterable: true,
    searchableFilter: true,
    sortable: false,
    header: 'TAGS',
    style: {width: '300px'},
    excludeFilter: true,
    andFilter: true,
    columnExplain: 'Click to include tag. Click again to exclude.',
  },
  {
    id: EXPERIMENTS_TABLE_COL_FIELDS.STATUS,
    headerType: ColHeaderTypeEnum.sortFilter,
    filterable: true,
    header: 'STATUS',
    style: {width: '130px', minWidth: '130px'},
  },
  {
    id: EXPERIMENTS_TABLE_COL_FIELDS.ID,
    headerType: ColHeaderTypeEnum.title,
    header: 'ID',
    style: {width: '100px'},
  }
];

@Component({
  selector: 'sm-model-experiments-table',
  templateUrl: './model-experiments-table.component.html',
  styleUrls: ['./model-experiments-table.component.scss'],
  imports: [
    ExperimentsTableComponent,
    ClearFiltersButtonComponent,
    MatFormField,
    MatInput,
    FormsModule,
    ClickStopPropagationDirective,
    ClickStopPropagationDirective,
    PushPipe
  ]
})
export class ModelExperimentsTableComponent implements OnDestroy {
  private store = inject(Store);
  public tableCols = INITIAL_MODEL_EXPERIMENTS_TABLE_COLS;
  public entityTypes = EntityTypeEnum;
  private paramsSubscription: Subscription;
  public tags$: Observable<string[]>;
  public tableSortFields$: Observable<SortMeta[]>;
  selectedExperiment: IExperimentInfo;
  private _resizedCols = {} as Record<string, string>;
  private resizedCols$ = new BehaviorSubject<Record<string, string>>(this._resizedCols);
  @ViewChild('searchExperiments', {static: true}) searchExperiments: MatInput;
  private table = viewChild(ExperimentsTableComponent);
  private modelId: string;
  public tags: string[];
  private initTags: boolean;
  protected splitSize = this.store.selectSignal(selectSplitSize);
  protected experiments$ = this.store.select(selectExperimentsList);
  protected searchTerm$ = this.store.select(selectGlobalFilter);

  protected tableFilters$ = this.store.select(selectTableFilters)
    .pipe(
      map(filtersObj =>
        Object.fromEntries(Object.entries(filtersObj).filter(([key]) => key !== 'models.input.model'))
      )
    );
  protected systemTags$ = this.store.select(selectProjectSystemTags);
  protected noMoreExperiments$ = this.store.select(selectNoMoreExperiments);

  constructor() {
    this.resizedCols$.next(this._resizedCols);

    effect(() => {
      if (this.table()?.table()) {
        this.table().table().rowRightClick = new EventEmitter();
      }
    });

    this.paramsSubscription = this.store.select(selectModelId)
      .pipe(
        debounceTime(150),
        filter(modelId => !!modelId),
        distinctUntilChanged()
      )
      .subscribe(modelId => {
        this.modelId = modelId;
        this.initTags = true;
        this.store.dispatch(modelsExperimentsTableClearAllFilters());
        this.searchTermChanged('');
        this.filterChanged({col: {id: 'models.input.model'}, value: modelId, andFilter: false});
      });

    this.experiments$
      .pipe(filter(() => this.initTags))
      .subscribe(experiments => {
        this.tags = uniq(experiments?.map(exp => exp.tags).flat());
        this.initTags = false;
      });
  }

  public searchTermChanged(term: string) {
    this.store.dispatch(experimentsActions.globalFilterChanged({query: term}));
  }

  ngOnDestroy(): void {
    this.paramsSubscription.unsubscribe();
    this.store.dispatch(resetExperiments({}));
    this.store.dispatch(resetGlobalFilter());
  }


  experimentSelectionChanged(event) {
    const experiment = event?.experiment;
    if (event.origin === 'row' && experiment) {
      const projectId = experiment?.project?.id ? experiment?.project?.id : '*';
      const a = document.createElement('a');
      a.href = `projects/${projectId}/tasks/${experiment?.id}`;
      a.target = '_blank';
      a.click();
    }
  }

  getNextExperiments() {
    this.store.dispatch(experimentsActions.getNextExperiments(true));
  }

  filterChanged({col, value, andFilter}: { col: ISmCol; value; andFilter?: boolean }) {
    this.store.dispatch(modelExperimentsTableFilterChanged({
      filter: {
        col: col.id,
        value,
        filterMatchMode: col.filterMatchMode || andFilter ? 'AND' : undefined
      }
    }));
  }

  clearTableFilters() {
    this.store.dispatch(modelsExperimentsTableClearAllFilters());
    this.filterChanged({col: {id: 'models.input.model'}, value: this.modelId, andFilter: false});
  }

  resizeCol({columnId, widthPx}: { columnId: string; widthPx: number }) {
    this._resizedCols[columnId] = `${widthPx}px`;
    this.resizedCols$.next(this._resizedCols);
  }
}
