import {ChangeDetectionStrategy, Component, effect, inject, linkedSignal, signal, viewChild} from '@angular/core';
import {selectIsModelSaving, selectModelId, selectSelectedModel} from '../../reducers';
import {Store} from '@ngrx/store';
import {selectIsSharedAndNotOwner} from '~/features/experiments/reducers';
import {activateModelEdit, cancelModelEdit, saveMetaData} from '../../actions/models-info.actions';
import {cloneDeep, toInteger} from 'lodash-es';
import {EditableSectionComponent} from '@common/shared/ui-components/panel/editable-section/editable-section.component';
import {SectionHeaderComponent} from '@common/shared/components/section-header/section-header.component';
import {FormsModule, NgForm} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {UuidPipe} from '@common/shared/pipes/uuid.pipe';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {PrimeTemplate} from 'primeng/api';
import {MatInput} from '@angular/material/input';
import {
  UniqueInListSync2ValidatorDirective
} from '@common/shared/ui-components/template-forms-ui/unique-in-list-sync-validator-2.directive';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {JsonPipe} from '@angular/common';
import {computedPrevious} from 'ngxtension/computed-previous';

export type IModelMetadataMap = Record<string, IModelMetadataItem>;

export interface IModelMetadataItem {
  id: string;
  key?: string;
  type?: string;
  value?: string;
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
    UuidPipe,
    TableComponent,
    PrimeTemplate,
    UniqueInListSync2ValidatorDirective,
    FormsModule,
    MatButton,
    MatIcon,
    MatIconButton
  ]
})
export class ModelInfoMetadataComponent {
  private store = inject(Store);
  metadataForm = viewChild(NgForm);


  protected selectedModel = this.store.selectSignal(selectSelectedModel);
  protected saving = this.store.selectSignal(selectIsModelSaving);
  protected isSharedAndNotOwner = this.store.selectSignal(selectIsSharedAndNotOwner);
  private selectedModelFromRouter = this.store.selectSignal(selectModelId);
  private selectedModelFromRouterP = computedPrevious(this.selectedModelFromRouter);
  protected model = linkedSignal(() => this.selectedModel());

  public inEdit = signal(false);
  public cols = [
    {id : 'key', header: 'Key'},
    {id : 'type', header: 'Type'},
    {id : 'value', header: 'Value'}
  ];
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
      }
    });
  }

  saveFormData() {
    this.inEdit.set(false);
    const metadataObject = this.metadata.reduce((acc, metaItem) => {
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
    this.metadata.push({
      id: `${toInteger(this.metadata?.at(-1)?.id ?? '0') + 1}`,
      key: null,
      type: null,
      value: null
    });
  }

  removeRow(index) {
    this.metadata.splice(index, 1);
  }
}
