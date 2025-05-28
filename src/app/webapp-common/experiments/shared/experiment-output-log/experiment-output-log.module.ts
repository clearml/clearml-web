import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {ExperimentSharedModule} from '~/features/experiments/shared/experiment-shared.module';
import {SaferPipe} from '@common/shared/pipes/safe.pipe';
import {PushPipe} from '@ngrx/component';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatFormField} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';


@NgModule({
  declarations: [],
  exports: [],
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    ScrollingModule,
    ExperimentSharedModule,
    SaferPipe,
    PushPipe,
    MatButton,
    MatIcon,
    MatFormField,
    MatInput,
    TooltipDirective,
    ShowTooltipIfEllipsisDirective
  ]
})
export class ExperimentOutputLogModule { }
