import {importProvidersFrom, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ControllersComponent} from './controllers.component';
import {AngularSplitModule} from 'angular-split';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {ExperimentGraphsModule} from '@common/shared/experiment-graphs/experiment-graphs.module';
import {CommonDeleteDialogModule} from '@common/shared/entity-page/entity-delete/common-delete-dialog.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ExperimentCompareSharedModule} from '@common/experiments-compare/shared/experiment-compare-shared.module';
import {ExperimentSharedModule} from '~/features/experiments/shared/experiment-shared.module';
import {RouterModule, Routes} from '@angular/router';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {ExperimentOutputLogModule} from '@common/experiments/shared/experiment-output-log/experiment-output-log.module';
import {MatRadioModule} from '@angular/material/radio';
import {PipelineControllerInfoComponent} from './pipeline-controller-info/pipeline-controller-info.component';
import {PipelineControllerStepComponent} from './pipeline-controller-step/pipeline-controller-step.component';
import {PipelineInfoComponent} from './pipeline-details/pipeline-info.component';
import {
  PipelineControllerMenuComponent
} from '@common/pipelines-controller/pipeline-controller-menu/pipeline-controller-menu.component';
import {
  RunPipelineControllerDialogComponent
} from './run-pipeline-controller-dialog/run-pipeline-controller-dialog.component';
import {
  OpenDatasetVersionPreviewComponent
} from '@common/dataset-version/open-dataset-version-preview/open-dataset-version-preview.component';
import {SearchTextDirective} from '@common/shared/ui-components/directives/searchText.directive';
import {FilterPipe} from '@common/shared/pipes/filter.pipe';
import {DurationPipe} from '@common/shared/pipes/duration.pipe';
import {MenuItemTextPipe} from '@common/shared/pipes/menu-item-text.pipe';
import {FileSizePipe} from '@common/shared/pipes/filesize.pipe';
import {RegexPipe} from '@common/shared/pipes/filter-regex.pipe';
import {FilterMonitorMetricPipe} from '@common/shared/pipes/filter-monitor-metric.pipe';
import {TagsMenuComponent} from '@common/shared/ui-components/tags/tags-menu/tags-menu.component';
import {EntityFooterComponent} from '@common/shared/entity-page/entity-footer/entity-footer.component';
import {
  ExperimentTypeIconLabelComponent
} from '@common/shared/experiment-type-icon-label/experiment-type-icon-label.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {IdBadgeComponent} from '@common/shared/components/id-badge/id-badge.component';
import {ButtonToggleComponent} from '@common/shared/ui-components/inputs/button-toggle/button-toggle.component';
import {OverlayComponent} from '@common/shared/ui-components/overlay/overlay/overlay.component';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatMenuModule} from '@angular/material/menu';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {SelectQueueModule} from '@common/experiments/shared/components/select-queue/select-queue.module';
import {PushPipe} from '@ngrx/component';
import {compareNavigationGuard} from '@common/experiments/compare-navigation.guard';
import {compareViewStateGuard} from '@common/experiments/compare-view-state.guard';
import {
  ExperimentCompareScalarChartsComponent
} from '@common/experiments-compare/containers/experiment-compare-metric-charts/experiment-compare-scalar-charts.component';
import {
  COMPARE_CONFIG_TOKEN,
  COMPARE_STORE_KEY,
  getCompareConfig
} from '@common/experiments-compare/experiments-compare.module';
import {UserPreferences} from '@common/user-preferences';
import {StoreModule} from '@ngrx/store';
import {experimentsCompareReducers} from '@common/experiments-compare/reducers';
import {
  ExperimentComparePlotsComponent
} from '@common/experiments-compare/containers/experiment-compare-plots/experiment-compare-plots.component';
import {ExperimentHeaderComponent} from '@common/experiments/dumb/experiment-header/experiment-header.component';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatDialogActions, MatDialogClose} from '@angular/material/dialog';
import {CodeEditorComponent} from '@common/shared/ui-components/data/code-editor/code-editor.component';
import {MatButtonToggle} from '@angular/material/button-toggle';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {provideAnimations} from '@angular/platform-browser/animations';
import {ExperimentOutputLogComponent} from '@common/experiments/containers/experiment-output-log/experiment-output-log.component';

export const routes: Routes = [
  {
    path: '',
    component: ControllersComponent,
    children: [
      {
        path: 'compare',
        canActivate: [compareNavigationGuard],
        children: []
      },
      {
        path: 'compare/scalars',
        canActivate: [compareViewStateGuard],
        component: ExperimentCompareScalarChartsComponent,
        data: {minimized: true},
        providers: [
          {provide: COMPARE_CONFIG_TOKEN, useFactory: getCompareConfig, deps: [UserPreferences]},
          importProvidersFrom(
            StoreModule.forFeature(COMPARE_STORE_KEY, experimentsCompareReducers, COMPARE_CONFIG_TOKEN),
          ),
        ],
      },
      {
        path: 'compare/plots',
        canActivate: [compareViewStateGuard],
        component: ExperimentComparePlotsComponent,
        data: {minimized: true},
        providers: [
          {provide: COMPARE_CONFIG_TOKEN, useFactory: getCompareConfig, deps: [UserPreferences]},
          importProvidersFrom(
            StoreModule.forFeature(COMPARE_STORE_KEY, experimentsCompareReducers, COMPARE_CONFIG_TOKEN),
          ),
        ],
      },
      {
        path: ':controllerId', component: PipelineControllerInfoComponent,
      },
    ]
  }
];


@NgModule({
  declarations: [
    ControllersComponent,
    PipelineControllerInfoComponent,
    PipelineControllerStepComponent,
    PipelineInfoComponent,
    PipelineControllerMenuComponent,
    RunPipelineControllerDialogComponent
  ],
  exports: [
    PipelineControllerStepComponent
  ],
  imports: [
    AngularSplitModule,
    ScrollingModule,
    ExperimentGraphsModule,
    CommonDeleteDialogModule,
    FormsModule,
    ReactiveFormsModule,
    ExperimentCompareSharedModule,
    ExperimentSharedModule,
    RouterModule,
    CommonModule,
    RouterModule.forChild(routes),
    MatProgressSpinnerModule,
    ExperimentOutputLogModule,
    MatRadioModule,
    OpenDatasetVersionPreviewComponent,
    SearchTextDirective,
    FilterPipe,
    DurationPipe,
    MenuItemTextPipe,
    FileSizePipe,
    RegexPipe,
    FilterMonitorMetricPipe,
    TagsMenuComponent,
    EntityFooterComponent,
    ExperimentTypeIconLabelComponent,
    TooltipDirective,
    DialogTemplateComponent,
    IdBadgeComponent,
    ButtonToggleComponent,
    OverlayComponent,
    MatAutocompleteModule,
    MatInputModule,
    MatExpansionModule,
    MatMenuModule,
    ShowTooltipIfEllipsisDirective,
    SelectQueueModule,
    PushPipe,
    ExperimentHeaderComponent,
    MatIcon,
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatIconButton,
    CodeEditorComponent,
    MatButtonToggle,
    MatSlideToggle,
    ExperimentOutputLogComponent
  ],
  providers: [
    ControllersComponent,
  ]
})
export class PipelinesControllerModule { }
