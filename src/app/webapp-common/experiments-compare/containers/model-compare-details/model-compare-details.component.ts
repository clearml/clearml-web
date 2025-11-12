import {AfterViewInit, ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {experimentListUpdated} from '../../actions/experiments-compare-details.actions';
import {selectModelsDetails} from '../../reducers';
import {filter, tap} from 'rxjs/operators';
import {ExperimentCompareTree} from '~/features/experiments-compare/experiments-compare-models';
import {convertmodelsArrays, getAllKeysEmptyObject, isDetailsConverted} from '../../jsonToDiffConvertor';
import {ExperimentCompareBase} from '../experiment-compare-base';
import {ConfigurationItem} from '~/business-logic/model/tasks/configurationItem';
import {LIMITED_VIEW_LIMIT} from '@common/experiments-compare/experiments-compare.constants';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {ModelDetail} from '@common/experiments-compare/shared/experiments-compare-details.model';

@Component({
  selector: 'sm-model-compare-details',
  templateUrl: './model-compare-details.component.html',
  styleUrls: ['../experiment-compare-base.component.scss', './model-compare-details.component.scss', '../../cdk-drag.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class ModelCompareDetailsComponent extends ExperimentCompareBase implements OnInit, AfterViewInit {
  override entityType = EntityTypeEnum.model;
  public showEllipsis = true;

  constructor() {
    super();
    this.experiments$ = this.store.select(selectModelsDetails);
  }


  ngOnInit() {
    this.onInit();
    this.routerParamsSubscription = this.taskIds$.subscribe((experimentIds) => {
        this.store.dispatch(experimentListUpdated({ids: experimentIds.slice(0, LIMITED_VIEW_LIMIT), entity: EntityTypeEnum.model}));
      }
    );

    this.experimentsSubscription = this.experiments$.pipe(
      filter(experiments => !!experiments && experiments.length > 0),
      tap(experiments => {
        this.extractTags(experiments);
      }),
    ).subscribe(models => {
      this.originalExperiments = models.reduce((acc, exp) => {
        acc[exp.id] = isDetailsConverted(exp) ? this.originalExperiments[exp.id] : exp;
        return acc;
      }, {} as Record<string, ConfigurationItem>);
      models = Object.values(this.originalExperiments).map(experiment => convertmodelsArrays(experiment, this.originalExperiments[models[0].id], models));

      this.resetComponentState(models);
      this.calculateTree(models);
      this.nativeWidth = Math.max(this.treeCardBody?.getBoundingClientRect().width, 410);
    });
  }

  buildCompareTree(experiments: ModelDetail[]): ExperimentCompareTree {
    const mergedExperiment = getAllKeysEmptyObject(experiments);
    return experiments
      .reduce((acc, cur) => {
        acc[cur.id] = this.buildExperimentTree(cur, this.baseExperiment, mergedExperiment);

        return acc;
      }, {} as ExperimentCompareTree);
  }

  toggleEllipsis() {
    this.showEllipsis = !this.showEllipsis;
  }

  public override buildExperimentTree(experiment, baseExperiment, mergedExperiment): any {
    return {
      general: this.buildSectionTree(experiment, 'general', mergedExperiment),
      labels: this.buildSectionTree(experiment, 'labels', mergedExperiment),
      metadata: this.buildSectionTree(experiment, 'metadata', mergedExperiment),
      lineage: this.buildSectionTree(experiment, 'lineage', mergedExperiment),
    };
  }
}
