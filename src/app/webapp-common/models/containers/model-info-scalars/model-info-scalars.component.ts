import {Component} from '@angular/core';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {
  ExperimentOutputScalarsComponent
} from '@common/experiments/containers/experiment-output-scalars/experiment-output-scalars.component';
import {selectModelId, selectSelectedModel} from '@common/models/reducers';
import {
  experimentScalarRequested
} from '@common/experiments/actions/common-experiment-output.actions';
import {debounceTime, distinctUntilChanged, filter} from 'rxjs/operators';
import {
  selectModelInfoHistograms,
  selectModelSettingsGroupBy,
  selectModelSettingsHiddenScalar,
  selectModelSettingsSmoothSigma,
  selectModelSettingsSmoothType,
  selectModelSettingsSmoothWeight,
  selectModelSettingsXAxisType,
  selectSelectedModelSettingsIsProjectLevel,
  selectSelectedSettingsModelTableMetric
} from '@common/experiments/reducers';
import {toSignal} from '@angular/core/rxjs-interop';
import {selectSelectedModelSettings} from '~/features/experiments/reducers';
import {explicitEffect} from 'ngxtension/explicit-effect';
import {computedPrevious} from 'ngxtension/computed-previous';

@Component({
  selector: 'sm-model-info-scalars',
  templateUrl: '../../../experiments/containers/experiment-output-scalars/experiment-output-scalars.component.html',
  styleUrls: [
    '../../../experiments/containers/experiment-output-scalars/experiment-output-scalars.component.scss',
    '../../../experiments/containers/experiment-output-scalars/shared-experiment-output.scss'
  ],
  standalone: false
})
export class ModelInfoScalarsComponent extends ExperimentOutputScalarsComponent {
  protected override experiment = this.store.selectSignal(selectSelectedModel);
  protected override experimentId = this.store.selectSignal(selectModelId);
  protected override xAxisType = this.store.selectSignal(selectModelSettingsXAxisType);
  protected override entitySelector = this.store.select(selectModelId);
  protected override scalars = this.store.selectSignal(selectModelInfoHistograms);
  protected override xAxisTypePrev = computedPrevious(this.xAxisType);
  protected override routerParams$ = this.store.select(selectRouterParams)
    .pipe(
      filter(params => !!params.modelId),
      distinctUntilChanged()
    );

  constructor() {
    super();
    this.tableSelectedMetrics = this.store.selectSignal(selectSelectedSettingsModelTableMetric);
    this.entitySelector = this.store.select(selectModelId);
    this.entityType = 'model';
    this.exportForReport = !this.activeRoute.snapshot?.parent?.parent?.data?.setAllProject;

    this.groupBy = this.store.selectSignal(selectModelSettingsGroupBy);
    this.smoothWeight = toSignal(this.store.select(selectModelSettingsSmoothWeight).pipe(filter(smooth => smooth !== null)));
    this.smoothWeightDelayed = toSignal(this.store.select(selectModelSettingsSmoothWeight).pipe(debounceTime(75)));
    this.smoothType = this.store.selectSignal(selectModelSettingsSmoothType);
    this.smoothSigma = this.store.selectSignal(selectModelSettingsSmoothSigma);
    this.isProjectLevel = this.store.selectSignal(selectSelectedModelSettingsIsProjectLevel);
    this.allSettings = this.store.selectSignal(selectSelectedModelSettings);
    this.listOfHidden = this.store.selectSignal(selectModelSettingsHiddenScalar);

    this.xAxisEffectRef.destroy();
    explicitEffect(
      [this.xAxisType],
      ([xAxisType]) => {
        if (this.experiment() && xAxisType && this.xAxisTypePrev() !== xAxisType) {
          this.axisChanged();
        }
      });

    this.mainEffectRef1.destroy();
    this.mainEffectRef1 = explicitEffect(
      [this.listOfHidden], ([hiddenList]) => {
        if (this.scalars() && this.groupBy() && hiddenList) {
          this.dataHandler(this.scalars(), hiddenList, this.groupBy(), true);
        }
      });

    this.mainEffectRef2.destroy();
    this.mainEffectRef2 = explicitEffect(
      [this.groupBy, this.scalars, this.xAxisType], ([groupBy, scalars]) => {
        if (groupBy && scalars &&
          // prevent rendering chart with misfit x-axis type and data
          (Object.values(scalars || {}).length === 0 || (this.xAxisType() !== 'iter' && Object.values(Object.values(scalars || {})[0] || {})?.[0]?.x?.[0] > 1600000000000) ||
            (this.xAxisType() === 'iter' && Object.values(Object.values(scalars || {})[0] || {})?.[0]?.x?.[0] < 1600000000000))
        ) {
          this.dataHandler(scalars, this.listOfHidden(), groupBy, false);
        }
      });
  }

  override refresh() {
    if (!this.refreshDisabled) {
      this.refreshDisabled = true;
      this.store.dispatch(experimentScalarRequested({experimentId: this.experimentId(), refresh: true, model: true}));
    }
  }

  protected override axisChanged() {
    this.store.dispatch(experimentScalarRequested({experimentId: this.experimentId(), model: true, skipSingleValue: true}));
  }
}
