import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {WorkersAndQueuesRoutingModule} from './workers-and-queues-routing.module';
import {WorkersComponent} from '@common/workers-and-queues/containers/workers/workers.component';
import {QueuesComponent} from '@common/workers-and-queues/containers/queues/queues.component';
import {WorkersTableComponent} from '@common/workers-and-queues/dumb/workers-table/workers-table.component';
import {QueueTaskTableComponent} from '@common/workers-and-queues/dumb/queue-task-table/queue-task-table.component';
import {reducers} from '@common/workers-and-queues/reducers/index.reducer';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {WorkersEffects} from '@common/workers-and-queues/effects/workers.effects';
import {WorkersStatsComponent} from '@common/workers-and-queues/containers/workers-stats/workers-stats.component';
import {WorkerInfoComponent} from '@common/workers-and-queues/dumb/worker-info/worker-info.component';
import {AngularSplitModule} from 'angular-split';
import {QueuesTableComponent} from '@common/workers-and-queues/dumb/queues-table/queues-table.component';
import {QueueInfoComponent} from '@common/workers-and-queues/dumb/queue-info/queue-info.component';
import {QueuesEffect} from '@common/workers-and-queues/effects/queues.effects';
import {QueueStatsComponent} from '@common/workers-and-queues/containers/queue-stats/queue-stats.component';
import {SharedModule} from '~/shared/shared.module';
import {QueueCreateDialogModule} from '@common/shared/queue-create-dialog/queue-create-dialog.module';
import {SelectQueueModule} from '@common/experiments/shared/components/select-queue/select-queue.module';
import {QueuesMenuComponent} from '@common/workers-and-queues/dumb/queues-menu/queues-menu.component';
import {QueuesMenuExtendedComponent} from './queues-menu-extended/queues-menu-extended.component';
import {LineChartComponent} from '@common/shared/components/charts/line-chart/line-chart.component';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {SecToHoursPipe} from '@common/shared/pipes/sec-to-hours.pipe';
import {DurationFormaterPipe} from '@common/shared/pipes/duration-formater.pipe';
import {CopyClipboardComponent} from '@common/shared/ui-components/indicators/copy-clipboard/copy-clipboard.component';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {
  ClearFiltersButtonComponent
} from '@common/shared/components/clear-filters-button/clear-filters-button.component';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {MatSelectModule} from '@angular/material/select';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatMenuModule} from '@angular/material/menu';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  TableFilterSortComponent
} from '@common/shared/ui-components/data/table/table-filter-sort/table-filter-sort.component';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {SimpleTableComponent} from '@common/shared/ui-components/data/simple-table/simple-table.component';
import {
  VerticalLabeledRowComponent
} from '@common/shared/ui-components/data/veritical-labeled-row/vertical-labeled-row.component';
import {TableModule} from 'primeng/table';
import {MatInputModule} from '@angular/material/input';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {RefreshButtonComponent} from '@common/shared/components/refresh-button/refresh-button.component';
import {PushPipe} from '@ngrx/component';
import {OrchestrationComponent} from '~/features/workers-and-queues/orchestration.component';
import {MatTab, MatTabGroup} from '@angular/material/tabs';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';
import {ClipboardModule} from 'ngx-clipboard';
import {CommonSearchComponent} from '@common/common-search/containers/common-search/common-search.component';

@NgModule({
  imports: [
    CommonModule,
    WorkersAndQueuesRoutingModule,
    SharedModule,
    QueueCreateDialogModule,
    SelectQueueModule,
    StoreModule.forFeature('workersAndQueues', reducers),
    EffectsModule.forFeature([WorkersEffects, QueuesEffect]),
    AngularSplitModule,
    FormsModule,
    LineChartComponent,
    TimeAgoPipe,
    SecToHoursPipe,
    DurationFormaterPipe,
    CopyClipboardComponent,
    MenuItemComponent,
    ClickStopPropagationDirective,
    MenuComponent,
    ClearFiltersButtonComponent,
    DialogTemplateComponent,
    MatSelectModule,
    MatExpansionModule,
    MatMenuModule,
    TooltipDirective,
    TableFilterSortComponent,
    TableComponent,
    SimpleTableComponent,
    VerticalLabeledRowComponent,
    TableModule,
    MatInputModule,
    ShowTooltipIfEllipsisDirective,
    RefreshButtonComponent,
    PushPipe,
    MatTabGroup,
    MatIcon,
    MatIconButton,
    MatTab,
    MatButton,
    ClipboardModule,
    CommonSearchComponent
  ],
  declarations: [
    OrchestrationComponent,
    WorkersComponent,
    WorkersTableComponent,
    WorkersStatsComponent,
    WorkerInfoComponent,
    QueuesTableComponent,
    QueueTaskTableComponent,
    QueuesComponent,
    QueueInfoComponent,
    QueueStatsComponent,
    QueuesMenuComponent,
    QueuesMenuExtendedComponent
  ],
})
export class WorkersAndQueuesModule {
}
