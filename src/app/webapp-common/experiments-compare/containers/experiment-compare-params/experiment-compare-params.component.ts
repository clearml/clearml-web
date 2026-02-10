import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {selectExperimentsParams} from '../../reducers';
import {filter, tap} from 'rxjs/operators';
import {ExperimentCompareTree, IExperimentDetail} from '~/features/experiments-compare/experiments-compare-models';
import {ExperimentParams} from '../../shared/experiments-compare-details.model';
import {convertExperimentsArraysParams, getAllKeysEmptyObject, isParamsConverted} from '../../jsonToDiffConvertor';
import {ExperimentCompareBase} from '../experiment-compare-base';
import {paramsActions} from '../../actions/experiments-compare-params.actions';
import {LIMITED_VIEW_LIMIT} from '@common/experiments-compare/experiments-compare.constants';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {PortalComponent} from '@common/shared/portal/portal.component';
import {
  CompareCardListComponent
} from '@common/experiments-compare/dumbs/compare-card-list/compare-card-list.component';
import {
  ExperimentCompareGeneralDataComponent
} from '@common/experiments-compare/dumbs/experiment-compare-general-data/experiment-compare-general-data.component';
import {SearchComponent} from '@common/shared/ui-components/inputs/search/search.component';
import {PushPipe} from '@ngrx/component';
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {CompareCardHeaderDirective} from '@common/experiments-compare/dumbs/compare-card-header.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {CompareCardBodyDirective} from '@common/experiments-compare/dumbs/compare-card-body.directive';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'sm-experiment-compare-params',
  templateUrl: './experiment-compare-params.component.html',
  styleUrls: ['../experiment-compare-base.component.scss', './experiment-compare-params.component.scss', '../../cdk-drag.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PortalComponent,
    CompareCardListComponent,
    ExperimentCompareGeneralDataComponent,
    SearchComponent,
    MatIconModule,
    PushPipe,
    CdkFixedSizeVirtualScroll,
    CompareCardHeaderDirective,
    TooltipDirective,
    CompareCardBodyDirective,
    CdkVirtualScrollViewport,
    CdkVirtualForOf,
    MatIconButton
  ]
})
export class ExperimentCompareParamsComponent extends ExperimentCompareBase implements OnInit {
  public showEllipsis = true;

  constructor(
  ) {
    super();
    this.experiments$ = this.store.select(selectExperimentsParams);
  }


  ngOnInit() {
    this.entityType = this.activeRoute.snapshot.parent.parent.data.entityType;
    this.onInit();
    this.compareTabPage = this.activeRoute?.snapshot?.routeConfig?.data?.mode;
    this.routerParamsSubscription = this.taskIds$.subscribe(
      (experimentIds) => {
        this.store.dispatch(paramsActions.experimentListUpdated({ids: experimentIds.slice(0, LIMITED_VIEW_LIMIT), entity: this.entityType}));
      });

    this.experimentsSubscription = this.experiments$.pipe(
      filter(experiments => !!experiments && experiments.length > 0),
      tap(experiments => {
        this.extractTags(experiments);
      }),
    ).subscribe(experiments => {
      this.originalExperiments = experiments.reduce((acc, exp) => {
        acc[exp.id] = isParamsConverted(exp.hyperparams) ? this.originalExperiments[exp.id] : exp;
        return acc;
      }, {} as Record<string, IExperimentDetail | ExperimentParams>);
      const experimentList = Object.values(this.originalExperiments).map(experiment => convertExperimentsArraysParams(experiment, this.originalExperiments[experiments[0].id]));
      this.resetComponentState(experimentList);
      this.calculateTree(experimentList);
    });
  }

  buildCompareTree(experiments: ExperimentParams[]): ExperimentCompareTree {
    const mergedExperiment = getAllKeysEmptyObject(experiments);
    return experiments
      .reduce((acc, cur) => {
        acc[cur.id] = {

          'hyper-params': this.buildSectionTree(cur, this.entityType === EntityTypeEnum.model? 'design': 'hyperparams', mergedExperiment)
        };

        return acc;
      }, {} as ExperimentCompareTree);
  }


  toggleEllipsis() {
    this.showEllipsis = !this.showEllipsis;
  }
}
