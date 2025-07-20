import {Component, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectExperimentModelInfoData, selectIsExperimentSaving} from '../../reducers';
import {IExperimentModelInfo, IModelInfo, IModelInfoSource} from '../../shared/common-experiment-model.model';
import {Model} from '~/business-logic/model/models/model';
import {combineLatest, Observable} from 'rxjs';
import {experimentSectionsEnum} from '~/features/experiments/shared/experiments.const';
import {selectIsExperimentEditable, selectSelectedExperiment} from '~/features/experiments/reducers';
import * as commonInfoActions from '../../actions/common-experiments-info.actions';
import {activateEdit, cancelExperimentEdit, deactivateEdit} from '../../actions/common-experiments-info.actions';
import {ExperimentModelsFormViewComponent} from '../../dumb/experiment-models-form-view/experiment-models-form-view.component';
import {getModelDesign} from '@common/tasks/tasks.utils';
import {distinctUntilChanged, filter, map} from 'rxjs/operators';
import {ActivatedRoute, Router} from '@angular/router';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {addMessage} from '@common/core/actions/layout.actions';
import {cloneDeep} from 'lodash-es';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';


@Component({
    selector: 'sm-experiment-info-model',
    templateUrl: './experiment-info-model.component.html',
    styleUrls: ['./experiment-info-model.component.scss'],
    standalone: false
})
export class ExperimentInfoModelComponent {
  public modelInfo$: Observable<IExperimentModelInfo>;
  public editable$: Observable<boolean>;
  public modelLabels$: Observable<Model['labels']>;
  public saving$: Observable<boolean>;
  public modelProjectId: string;
  public inputDesign: any;
  private modelId: string;
  public model: IModelInfo | undefined;
  public source: IModelInfoSource;
  private models: IModelInfo[];
  private routerModelId$: Observable<string>;
  public selectedExperiment$: Observable<IExperimentInfo>;
  public outputMode: boolean;

  @ViewChild('experimentModelForm') experimentModelForm: ExperimentModelsFormViewComponent;
  private orgModels: IModelInfo[];

  constructor(private store: Store, private router: Router, private route: ActivatedRoute) {
    this.modelInfo$ = this.store.select(selectExperimentModelInfoData);
    this.editable$ = this.store.select(selectIsExperimentEditable);
    this.saving$ = this.store.select(selectIsExperimentSaving);
    this.selectedExperiment$ = this.store.select(selectSelectedExperiment);
    this.routerModelId$ = this.route.params.pipe(
      map(params => params?.modelId),
      filter(params => !!params),
      distinctUntilChanged()
    );

    combineLatest([this.routerModelId$, this.modelInfo$])
      .pipe(takeUntilDestroyed())
      .subscribe(([modelId, formData]) => {
        this.modelId = modelId;
        this.outputMode = this.route.snapshot.data?.outputModel;
        this.models = this.outputMode ? formData?.output : formData?.input;
        this.orgModels = cloneDeep(this.models);
        this.model = this.models?.find(model => model.id === this.modelId);
        this.source = {
          experimentId: this.model?.task?.id,
          projectId: this.model?.task?.project?.id,
          experimentName: this.model?.task?.name
        };
        const design = getModelDesign(this.model?.design);
        this.inputDesign = (design.value === undefined || design.key === undefined && Object.keys(design.value).length === 0) ? null : design.value;
        this.modelProjectId = this.model?.project?.id ? this.model.project.id : '*';
      });
  }

  onModelSelected(selectedModelId: string) {
    const modelFoundIndex = this.orgModels.findIndex(model => model.id === this.modelId);
    if (this.orgModels.map(m => m.id).includes(selectedModelId)) {
      this.store.dispatch(addMessage('warn', 'Selected model is already an input-model'));
    } else {
      let newModels: { model: string; name: string }[];
      if (modelFoundIndex >= 0) {
        newModels = this.orgModels.map(model => model.id !== this.modelId ?
          {model: model.id, name: model.taskName} :
          {model: selectedModelId, name: model.taskName}
        ).filter(model => model.model);
      } else {
        newModels = [
          ...this.orgModels.map(model => ({model: model.id, name: model.taskName})),
          {model: selectedModelId, name: 'Input Model'}
        ];
      }
      this.store.dispatch(commonInfoActions.saveExperimentSection({models: {input: newModels as any}}));
      this.router.navigate([{modelId: selectedModelId || ''}], {relativeTo: this.route, replaceUrl: true, queryParamsHandling:'preserve'});
    }
  }

  cancelModelChange() {
    this.store.dispatch(deactivateEdit());
    this.store.dispatch(cancelExperimentEdit());
  }

  activateEditChanged() {
    this.store.dispatch(activateEdit('model'));
    if (!this.model?.id) {
      this.experimentModelForm.chooseModel();
    }
  }
}
