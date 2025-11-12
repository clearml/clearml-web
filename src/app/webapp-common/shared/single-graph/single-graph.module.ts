import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SingleGraphComponent} from '@common/shared/single-graph/single-graph.component';
import {GraphViewerComponent} from '@common/shared/single-graph/graph-viewer/graph-viewer.component';
import {MatSliderModule} from '@angular/material/slider';
import {MatSelectModule} from '@angular/material/select';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {TagListComponent} from '@common/shared/ui-components/tags/tag-list/tag-list.component';
import {ChooseColorModule} from '@common/shared/ui-components/directives/choose-color/choose-color.module';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {PushPipe} from '@ngrx/component';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {ChooseColorDirective} from '@common/shared/ui-components/directives/choose-color/choose-color.directive';




@NgModule({
  declarations: [SingleGraphComponent, GraphViewerComponent],
  exports: [SingleGraphComponent, GraphViewerComponent],
  imports: [
    CommonModule,
    MatSliderModule,
    MatSelectModule,
    FormsModule,
    MatInputModule,
    TooltipDirective,
    MatProgressSpinnerModule,
    TagListComponent,
    ChooseColorModule,
    ShowTooltipIfEllipsisDirective,
    PushPipe,
    MatIconButton,
    MatIcon,
    MatSlideToggle,
    ChooseColorDirective
  ]
})
export class SingleGraphModule { }
