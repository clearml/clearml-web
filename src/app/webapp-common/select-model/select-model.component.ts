import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  viewChild, effect, DestroyRef
} from '@angular/core';
import {Store} from '@ngrx/store';
import * as actions from './select-model.actions';
import {clearTableFilter, setSelectedModels, showArchive} from './select-model.actions';
import {
  selectAllModels,
  selectFrameworks,
  selectGlobalFilter,
  selectNoMoreModels,
  selectSelectedModels,
  selectSelectModelTableFilters,
  selectShowArchive,
  selectTableSortFields,
  selectTags,
  selectViewMode
} from './select-model.reducer';
import {Observable, of, debounceTime, distinctUntilChanged, map, tap} from 'rxjs';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ColHeaderTypeEnum, ISmCol, TableSortOrderEnum} from '../shared/ui-components/data/table/table.consts';
import {SelectedModel} from '../models/shared/models.model';
import {MODELS_TABLE_COLS} from '../models/models.consts';
import {selectAllProjectsUsers, selectProjectSystemTags, selectSelectedProject, selectTablesFilterProjectsOptions} from '../core/reducers/projects.reducer';
import {ModelsTableComponent} from '@common/models/shared/models-table/models-table.component';
import {Project} from '~/business-logic/model/projects/models';
import {getAllSystemProjects, getTablesFilterProjectsOptions, resetTablesFilterProjectsOptions} from '@common/core/actions/projects.actions';
import {isEqual} from 'lodash-es';
import {compareLimitations} from '@common/shared/entity-page/footer-items/compare-footer-item';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '@common/constants';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';
import {SelectModelHeaderComponent} from '@common/models/shared/select-model-header/select-model-header.component';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {PushPipe} from '@ngrx/component';
import {MatButton} from '@angular/material/button';

export interface SelectModelData {
  selectionMode?: 'multiple' | 'single' | null;
  selectedModels?: string[];
  header: string;
  hideShowArchived: boolean;
}


@Component({
  selector: 'sm-select-model',
  templateUrl: './select-model.component.html',
  styleUrls: ['./select-model.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModelsTableComponent,
    SelectModelHeaderComponent,
    DialogTemplateComponent,
    PushPipe,
    MatButton,
  ]
})
export class SelectModelComponent {
  public dialogRef = inject<MatDialogRef<ConfirmDialogComponent>>(MatDialogRef<ConfirmDialogComponent>);
  public data = inject<SelectModelData>(MAT_DIALOG_DATA);
  protected tableSortOrder$: Observable<TableSortOrderEnum>;
  protected tableCols = MODELS_TABLE_COLS;
  protected tableCols$ = of(this.tableCols)
    .pipe(
      distinctUntilChanged((a, b) => isEqual(a, b)),
      map(cols => cols.filter(col => (!col.hidden || col.id === 'project.name')).map(col => ({
          ...col,
          hidden: false,
          headerType: col.headerType === ColHeaderTypeEnum.checkBox ? ColHeaderTypeEnum.title : col.headerType,
          ...(col.id === 'project.name' && {
            getter: 'project',
            filterable: true,
            searchableFilter: true,
            sortable: false,
            headerType: ColHeaderTypeEnum.sortFilter
          })
        })
      )));
  protected selectedProject: Project;
  private store = inject(Store);
  protected tableSortFields$ = this.store.select(selectTableSortFields);
  protected tableFilters$ = this.store.select(selectSelectModelTableFilters);
  protected viewMode$ = this.store.select(selectViewMode);
  protected searchValue$ = this.store.select(selectGlobalFilter);
  protected noMoreModels$ = this.store.select(selectNoMoreModels);
  protected showArchive$ = this.store.select(selectShowArchive);
  protected users$ = this.store.select(selectAllProjectsUsers);
  protected currentUser = this.store.selectSignal(selectCurrentUser);
  protected tags$ = this.store.select(selectTags);
  protected systemTags$ = this.store.select(selectProjectSystemTags);
  protected models$ = this.store.select(selectAllModels);
  protected projectsOptions$ = this.store.select(selectTablesFilterProjectsOptions);
  protected frameworks$ = this.store.select(selectFrameworks);
  private readonly destroy = inject(DestroyRef);
  private table = viewChild(ModelsTableComponent);
  private selectedModels: SelectedModel[];
  protected selectedModels$ = this.store.select(selectSelectedModels).pipe(tap(models => this.selectedModels = models));

  constructor() {
    this.store.dispatch(actions.getFrameworks());
    this.store.dispatch(actions.getTags());
    this.store.dispatch(getAllSystemProjects({}));

    if (this.data.selectedModels) {
      this.store.dispatch(actions.getSelectedModels({selectedIds: this.data.selectedModels}));
    }

    effect(() => {
      if (this.table() && this.table().table()) {
        this.table().table().rowRightClick = new EventEmitter();
      }
    });

    this.store.select(selectSelectedProject)
      .pipe(
        takeUntilDestroyed(),
        debounceTime(100)
      )
      .subscribe(selectedProject => {
        this.selectedProject = selectedProject;
        this.store.dispatch(actions.tableFilterChanged({col: {id: 'project.name'}, value: selectedProject.id === '*' ? [] : [selectedProject.id]}));
      });


    this.destroy.onDestroy(() => {
      this.store.dispatch(resetTablesFilterProjectsOptions());
      this.store.dispatch(actions.resetSelectModelState({fullReset: false}));
    });
  }

  closeDialog(modelId: string) {
    if (modelId) {
      return this.dialogRef.close(modelId);
    }
    return this.dialogRef.close(null);
  }

  closeDialogMultiple() {
    return this.dialogRef.close(this.selectedModels.map(model => model.id));
  }

  getNextModels() {
    this.store.dispatch(actions.getNextModels());
  }

  sortedChanged(sort: { isShift: boolean; colId: ISmCol['id'] }) {
    this.store.dispatch(actions.tableSortChanged({colId: sort.colId, isShift: sort.isShift}));
  }

  filterChanged(filter: { col: ISmCol; value: string; andFilter?: boolean }) {
    this.store.dispatch(actions.tableFilterChanged({col: filter.col, value: filter.value, andFilter: filter.andFilter}));
  }

  onSearchValueChanged(value: string) {
    this.store.dispatch(actions.globalFilterChanged({filter: value}));
  }

  modelSelectionChanged(event: { model: SelectedModel }) {
    if (this.data.selectionMode !== 'multiple') {
      this.closeDialog(event.model?.id);
    }
  }

  modelsSelectionChanged(models: SelectedModel[]) {
    if (this.data.selectionMode !== 'multiple') {
      return;
    }
    if (models.length === 0) {
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.WARN, 'Compare module should include at least one model'));
      return;
    }
    if (models.length <= compareLimitations) {
      this.store.dispatch(setSelectedModels({models}));
    } else {
      this.store.dispatch(addMessage(MESSAGES_SEVERITY.WARN, compareLimitations + ' or fewer models can be compared'));
    }
  }

  filterSearchChanged({value}: { colId: string; value: { value: string; loadMore?: boolean } }) {
    this.store.dispatch(getTablesFilterProjectsOptions({searchString: value.value || '', loadMore: value.loadMore}));
  }

  clearFilters() {
    this.store.dispatch(clearTableFilter());
  }

  showArchives($event: boolean) {
    this.store.dispatch(showArchive({showArchive: $event}));
  }
}
