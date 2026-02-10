import {
  Component,
  OnChanges,
  SimpleChanges, inject, viewChild, viewChildren, output, effect, input, signal
} from '@angular/core';
import {cloneDeep} from 'lodash-es';
import {v4 as uuidV4} from 'uuid';
import {FormsModule, NgForm} from '@angular/forms';
import {ParamsItem} from '~/business-logic/model/tasks/paramsItem';
import {CdkFixedSizeVirtualScroll, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {isEqual} from 'lodash-es';
import {MatError, MatFormField, MatInput, MatSuffix} from '@angular/material/input';
import {Store} from '@ngrx/store';
import {navigateToDataset} from '@common/experiments/actions/common-experiments-info.actions';
import {injectResize} from 'ngxtension/resize';
import {map, take} from 'rxjs/operators';
import {startWith} from 'rxjs';
import {EditJsonComponent, EditJsonData} from '@common/shared/ui-components/overlay/edit-json/edit-json.component';
import {MatDialog} from '@angular/material/dialog';
import {MultiLineTooltipComponent} from '@common/shared/components/multi-line-tooltip/multi-line-tooltip.component';
import {MatIconModule} from '@angular/material/icon';
import {MatDivider} from '@angular/material/divider';
import {SearchTextDirective} from '@common/shared/ui-components/directives/searchText.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  UniqueNameValidatorDirective
} from '@common/shared/ui-components/template-forms-ui/unique-name-validator.directive';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {MatButton, MatIconButton} from '@angular/material/button';
import {PrimeTemplate} from 'primeng/api';
import {PushPipe} from '@ngrx/component';
import {JsonIndentPipe} from '@common/experiments/dumb/experiment-execution-parameters/json-indent.pipe';

export interface ExecutionParameter {
  name?: string;
  description?: string;
  section?: string;
  id: string;
  type?: string;
  value?: string;
  isMaximize?: boolean;
  isJson?: boolean;
}

@Component({
  selector: 'sm-experiment-execution-parameters',
  templateUrl: './experiment-execution-parameters.component.html',
  styleUrls: ['./experiment-execution-parameters.component.scss'],
  imports: [
    FormsModule,
    MatInput,
    TableComponent,
    MultiLineTooltipComponent,
    MatFormField,
    MatError,
    MatIconModule,
    MatDivider,
    CdkFixedSizeVirtualScroll,
    SearchTextDirective,
    TooltipDirective,
    UniqueNameValidatorDirective,
    ShowTooltipIfEllipsisDirective,
    MatIconButton,
    MatButton,
    PrimeTemplate,
    PushPipe,
    JsonIndentPipe,
    MatSuffix
  ]
})
export class ExperimentExecutionParametersComponent implements OnChanges {
  private store = inject(Store);
  private dialog = inject(MatDialog);
  private resize$ = injectResize({emitInitialResult: true});

  public form = signal<ExecutionParameter[]>([]);
  private clickedRow: number;

  protected search = '';
  protected searchIndexList: { index: number; col: string }[] = [];
  public matchIndex = -1;
  protected calcCols$ = this.resize$
    .pipe(
      startWith({width: 500}),
      map(res => res.width),
      map(width => [
        {id: 'name', style: {width: `${(width - 64) / 2}px`}},
        {id: 'value', style: {width: `${(width - 64) / 2}px`}},
        {id: 'description', style: {width: '64px'}}
      ])
    );

  section = input<string>();
  size = input<number>();
  formData = input<ExecutionParameter[]>();
  editable = input<boolean>();
  searchedText = input<string>();
  formDataChanged = output<{
    field: string;
    value: ParamsItem[];
  }>();
  searchCounterChanged = output<number>();
  resetSearch = output();
  scrollToResultCounterReset = output();

  public hyperParameters = viewChild<NgForm>('hyperParameters');
  private executionParametersTable = viewChild<TableComponent<ExecutionParameter>>(TableComponent);

  private formContainer = viewChild(CdkVirtualScrollViewport);
  private rows = viewChildren<MatInput>('row');
  private viewPort = viewChild(CdkVirtualScrollViewport);

  constructor() {
    effect(() => {
      if (this.formContainer() && this.clickedRow !== null) {
        this.formContainer().scrollToIndex(this.clickedRow, 'smooth');
        this.clickedRow = null;
      }
    });

    effect(() => {
      this.size();
      this.executionParametersTable()?.resize();
    });

    effect(() => {
      this.form.set(cloneDeep(this.formData()).map((row: ParamsItem) => ({
        ...row,
        id: uuidV4(),
        isMaximize: this.isMaximize(row.value),
        isJson: this.isJson(row.value)
      })));
    });

    effect(() => {
      if (this.editable()) {
        window.setTimeout(() => this.rows()?.[0]?.focus());
      }
      this.executionParametersTable()?.resize();
    });
  }

  formNames(id) {
    return this.form().filter(parameter => parameter.id !== id).map(parameter => parameter.name);
  }

  addRow() {
    this.form.update(form => ([
      ...form,
      {
        id: uuidV4(),
        section: this.section(),
        name: '',
        value: '',
        description: '',
        type: ''
      }])
    );
    window.setTimeout(() => {
      const height = this.viewPort().elementRef.nativeElement.scrollHeight;
      this.viewPort().scrollToIndex(height, 'smooth');
    }, 50);
  }

  removeRow(index) {
    this.form().splice(index, 1);
    this.hyperParameters().form.markAsDirty();
  }

  rowActivated({data}: { data: ExecutionParameter; e: MouseEvent }) {
    this.clickedRow = this.form().findIndex(row => row.name === data.name);
  }

  resetIndex() {
    this.matchIndex = -1;
  }

  jumpToNextResult(forward: boolean) {
    this.matchIndex = forward ? this.matchIndex + 1 : this.matchIndex - 1;
    if (this.editable()) {
      this.viewPort().scrollToIndex(this.searchIndexList[this.matchIndex]?.index, 'smooth');
    } else {
      this.executionParametersTable().scrollToIndex(this.searchIndexList[this.matchIndex]?.index);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.formData && (!changes.formData?.firstChange) && !isEqual(changes.formData.currentValue, changes.formData.previousValue)) {
      this.matchIndex = -1;
      this.searchIndexList = [];
      this.resetSearch.emit();
    }
    if (changes?.searchedText) {
      let searchResultsCounter = 0;
      const searchedIndexList = [];
      if (changes?.searchedText?.currentValue) {
        this.formData().forEach((parameter, index) => {
          if (parameter?.name.includes(changes.searchedText.currentValue)) {
            searchResultsCounter++;
            searchedIndexList.push({index, col: 'name'});
          }
          if (parameter?.value.includes(changes.searchedText.currentValue)) {
            searchResultsCounter++;
            searchedIndexList.push({index, col: 'value'});
          }
        });
      }
      this.searchCounterChanged.emit(searchResultsCounter);
      this.scrollToResultCounterReset.emit();
      this.searchIndexList = searchedIndexList;
    }
  }

  cancel() {
    this.form.set(cloneDeep(this.formData()).map((row: ParamsItem) => ({
      ...row,
      id: uuidV4(),
      isMaximize: this.isMaximize(row.value),
      isJson: this.isJson(row.value)
    })));
    this.hyperParameters().form.markAsPristine();
  }

  nextRow(event: Event, index: number) {
    event.stopPropagation();
    event.preventDefault();
    if (this.formData().length === index + 1) {
      this.addRow();
    }
    window.setTimeout(() => this.rows().at(index + 1)?.focus());
  }

  navigateToDataset(datasetId: string) {
    this.store.dispatch(navigateToDataset({datasetId}));
  }

  private isMaximize(value: string): boolean {
    return value.length > 24;
  }

  private isJson(value: string): boolean {
      try {
        const a = JSON.parse(value);
        return true;
      } catch {
        return false;
      }
  }

  openJsonViewer(parameter: ExecutionParameter, readOnly: boolean) {
    let text= '';
    let isJson = false;
    try {
      text = JSON.parse(parameter.value);
      isJson = true;
    }
    catch {
      text = parameter.value;
    }
    this.dialog.open<EditJsonComponent, EditJsonData, string>(EditJsonComponent, {
      data: {
        textData: text,
        readOnly,
        title: `${readOnly ? 'VIEW' : 'EDIT'} PARAMETER: "${parameter.name}"`,
        format: isJson ? 'json' : null
      } as EditJsonData,
      maxWidth: 'calc(70vw + 64px)'
    }).afterClosed()
      .pipe(take(1))
      .subscribe((data) => {
          if (data !== undefined && data !== parameter.value) {
            const dataString = JSON.stringify(data);
            this.form.update(form => form.map(row =>
              row.id === parameter.id ? {
              ...row,
                value: data.length === 0 ? '' : isJson ? dataString : data,
                isJson: this.isJson(dataString),
                isMaximize: this.isMaximize(dataString),
            } : row));
            this.hyperParameters().form.markAsDirty();
          }
        }
      );
  }
}
