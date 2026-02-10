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
import {
  ExperimentCompareGeneralDataComponent
} from '@common/experiments-compare/dumbs/experiment-compare-general-data/experiment-compare-general-data.component';
import {PortalComponent} from '@common/shared/portal/portal.component';
import {
  CompareCardListComponent
} from '@common/experiments-compare/dumbs/compare-card-list/compare-card-list.component';
import {SearchComponent} from '@common/shared/ui-components/inputs/search/search.component';
import {PushPipe} from '@ngrx/component';
import {HideHashPipe} from '@common/shared/pipes/hide-hash.pipe';
import {HideHashTitlePipe} from '@common/shared/pipes/hide-hash-title.pipe';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {CompareCardHeaderDirective} from '@common/experiments-compare/dumbs/compare-card-header.directive';
import {CompareCardBodyDirective} from '@common/experiments-compare/dumbs/compare-card-body.directive';
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'sm-model-compare-details',
  templateUrl: './model-compare-details.component.html',
  styleUrls: ['../experiment-compare-base.component.scss', './model-compare-details.component.scss', '../../cdk-drag.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExperimentCompareGeneralDataComponent,
    PortalComponent,
    CompareCardListComponent,
    SearchComponent,
    MatIconModule,
    PushPipe,
    HideHashPipe,
    HideHashTitlePipe,
    ShowTooltipIfEllipsisDirective,
    CompareCardHeaderDirective,
    CompareCardBodyDirective,
    TooltipDirective,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    MatIconButton
  ]
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
