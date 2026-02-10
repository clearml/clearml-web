import {NgModule} from '@angular/core';
import {ExperimentSharedModule} from './shared/experiment-shared.module';
import {AdminService} from '~/shared/services/admin.service';
import {SelectModelModule} from '@common/select-model/select-model.module';
import {DebugImagesModule} from '@common/debug-images/debug-images.module';
import {MAT_AUTOCOMPLETE_SCROLL_STRATEGY} from '@angular/material/autocomplete';
import {scrollFactory} from '@common/shared/utils/scroll-factory';
import {Overlay} from '@angular/cdk/overlay';
import {CommonDeleteDialogModule} from '@common/shared/entity-page/entity-delete/common-delete-dialog.module';
import {SingleGraphStateModule} from '@common/shared/single-graph/single-graph-state.module';
import {routes} from '@common/experiments/experiment-routes';
import {RouterModule} from '@angular/router';


@NgModule({
  imports: [
    RouterModule.forChild(routes),
    SingleGraphStateModule,
    SelectModelModule,
    DebugImagesModule,
    CommonDeleteDialogModule,
    ExperimentSharedModule,
  ],
  providers: [
    AdminService,
    {provide: MAT_AUTOCOMPLETE_SCROLL_STRATEGY, useFactory: scrollFactory, deps: [Overlay]},
  ]
})
export class ExperimentsModule {
}
