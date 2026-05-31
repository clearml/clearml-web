import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  linkedSignal,
  signal,
  viewChild
} from '@angular/core';
import {selectIsModelSaving, selectModelId, selectSelectedModel} from '../../reducers';
import {Store} from '@ngrx/store';
import {selectIsSharedAndNotOwner} from '~/features/experiments/reducers';
import {activateModelEdit, cancelModelEdit, saveMetaData} from '../../actions/models-info.actions';
import {cloneDeep} from 'lodash-es';
import {EditableSectionComponent} from '@common/shared/ui-components/panel/editable-section/editable-section.component';
import {SectionHeaderComponent} from '@common/shared/components/section-header/section-header.component';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {PrimeTemplate} from 'primeng/api';
import {MatInput} from '@angular/material/input';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {computedPrevious} from 'ngxtension/computed-previous';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {injectResize} from 'ngxtension/resize';
import {startWith} from 'rxjs';
import {map} from 'rxjs/operators';
import {PushPipe} from '@ngrx/component';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';

export type IModelMetadataMap = Record<string, IModelMetadataItem>;

export interface IModelMetadataItem {
  id: string;
  key?: string;
  type?: string;
  value?: string;
}

function uniqueKeysValidator(control: AbstractControl): ValidationErrors | null {
  const array = control as FormArray;
  const keys = array.controls.map(c => (c.get('key')?.value?.trim() ?? '') as string);
  array.controls.forEach((group, index) => {
    const keyControl = group.get('key');
    const key = keys[index];
    const isDuplicate = !!key && keys.filter(k => k === key).length > 1;
    if (isDuplicate) {
      keyControl.markAsTouched();
      keyControl.setErrors({...(keyControl.errors ?? {}), uniqueName2: true}, {emitEvent: false});
    } else if (keyControl.hasError('uniqueName2')) {
      const {uniqueName2: _, ...remainingErrors} = keyControl.errors;
      keyControl.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null, {emitEvent: false});
    }
  });
  return null;
}

@Component({
  selector: 'sm-model-info-metadata',
  templateUrl: './model-info-metadata.component.html',
  styleUrls: ['./model-info-metadata.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EditableSectionComponent,
    SectionHeaderComponent,
    MatFormFieldModule,
    MatInput,
    TableComponent,
    PrimeTemplate,
    ReactiveFormsModule,
    MatButton,
    MatIcon,
    MatIconButton,
    PushPipe,
    ShowTooltipIfEllipsisDirective,
    TooltipDirective
  ]
})
export class ModelInfoMetadataComponent {
  private store = inject(Store);
  private resize$ = injectResize({emitInitialResult: true});
  container = viewChild<ElementRef<HTMLFormElement>>('container');


  protected selectedModel = this.store.selectSignal(selectSelectedModel);
  protected saving = this.store.selectSignal(selectIsModelSaving);
  protected isSharedAndNotOwner = this.store.selectSignal(selectIsSharedAndNotOwner);
  private selectedModelFromRouter = this.store.selectSignal(selectModelId);
  private selectedModelFromRouterP = computedPrevious(this.selectedModelFromRouter);
  protected model = linkedSignal(() => this.selectedModel());

  public inEdit = signal(false);
  public metadataGroup = new FormGroup({
    metadata: new FormArray<FormGroup<{
      id: FormControl<string>;
      key: FormControl<string>;
      type: FormControl<string>;
      value: FormControl<string>;
    }>>([], uniqueKeysValidator)
  });

  public cols = [
    {id : 'key', header: 'Key', style: {width: '200px', maxWidth: '200px'}},
    {id : 'type', header: 'Type', style: {width: '200px', maxWidth: '200px'}},
    {id : 'value', header: 'Value', style: {width: '200px', maxWidth: '200px'}}
  ] as ISmCol[];
  protected calcCols$ = this.resize$
    .pipe(
      startWith({width: 500}),
      map(res => res.width),
      map(width => [
        {id : 'key', header: 'Key', style: {width: `${(width - 64) / 3}px`, maxWidth: `${(width - 64) / 3}px`}},
        {id : 'type', header: 'Type', style: {width: `${(width - 64) / 3}px`, maxWidth: `${(width - 64) / 3}px`}},
        {id : 'value', header: 'Value', style: {width: `${(width - 64) / 3}px`, maxWidth: `${(width - 64) / 3}px`}}
      ])
    );
  public metadata = null as IModelMetadataItem[];
  private originalMetadata;

  constructor() {
    effect(() => {
      if (this.selectedModelFromRouterP() !== this.selectedModelFromRouter()) {
        this.model.set(null);
      }
    });

    effect(() => {
      if (this.selectedModel()?.metadata) {
        this.originalMetadata = Object.values(cloneDeep(this.selectedModel()?.metadata));
        this.metadata = Object.values(this.selectedModel()?.metadata)
          .map((item, index) => ({...item, id: `${index}`}));

        const metadataArray = this.metadataGroup.get('metadata') as FormArray;
        metadataArray.clear();
        this.metadata.forEach(item => {
          metadataArray.push(new FormGroup({
            id: new FormControl(item.id),
            key: new FormControl(item.key, [Validators.required, Validators.pattern(/^(\s+\S+\s*)*(?!\s).*$/)]),
            type: new FormControl(item.type, [Validators.required, Validators.pattern(/^(\s+\S+\s*)*(?!\s).*$/)]),
            value: new FormControl(item.value)
          }));
        });
      }
    });
  }

  saveFormData() {
    this.inEdit.set(false);
    const metadataArray = this.metadataGroup.get('metadata') as FormArray;
    const metadataObject = metadataArray.getRawValue().reduce((acc, metaItem) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {id, ...item} = metaItem;
      acc[metaItem.key] = item;
      return acc;
    }, {}) as IModelMetadataMap;
    this.store.dispatch(saveMetaData({metadata: metadataObject}));
  }

  cancelModelMetaDataChange() {
    this.inEdit.set(false);
    this.metadata = cloneDeep(this.originalMetadata);
    this.store.dispatch(cancelModelEdit());
  }


  activateEditChanged(section: string) {
    this.inEdit.set(true);
    this.store.dispatch(activateModelEdit(section));
  }

  addRow() {
    const metadataArray = this.metadataGroup.get('metadata') as FormArray;
    const lastId = metadataArray.length > 0 ? (metadataArray.at(metadataArray.length - 1).get('id').value || '0') : '0';
    const nextId = `${parseInt(lastId, 10) + 1}`;

    metadataArray.push(new FormGroup({
      id: new FormControl(nextId),
      key: new FormControl(null, [Validators.required, Validators.pattern(/^(\s+\S+\s*)*(?!\s).*$/)]),
      type: new FormControl(null, [Validators.required, Validators.pattern(/^(\s+\S+\s*)*(?!\s).*$/)]),
      value: new FormControl(null)
    }));
    window.setTimeout(() => this.container().nativeElement.scrollTo({top: this.container().nativeElement.scrollHeight, behavior: 'smooth'}))
  }

  removeRow(index) {
    const metadataArray = this.metadataGroup.get('metadata') as FormArray;
    metadataArray.removeAt(index);
  }
}
