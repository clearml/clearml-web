import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {EffectsModule} from '@ngrx/effects';
import {StoreModule} from '@ngrx/store';
import {SelectQueueComponent} from './select-queue.component';
import {SelectQueueEffects} from './select-queue.effects';
import {selectQueueFeature} from './select-queue.reducer';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {StringIncludedInArrayPipe} from '@common/shared/pipes/string-included-in-array.pipe';
import {MatInputModule} from '@angular/material/input';
import {MatOptionModule} from '@angular/material/core';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  RequiredAutocompleteSelectionValidatorDirective
} from '@common/shared/ui-components/template-forms-ui/required-autocomplete-selection-validator.directive';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {PushPipe} from '@ngrx/component';
import {MatButton} from '@angular/material/button';

@NgModule({
  imports: [
    CommonModule,
    EffectsModule.forFeature([SelectQueueEffects]),
    StoreModule.forFeature(selectQueueFeature),
    FormsModule,
    ReactiveFormsModule,
    StringIncludedInArrayPipe,
    MatInputModule,
    MatOptionModule,
    MatAutocompleteModule,
    DialogTemplateComponent,
    TooltipDirective,
    RequiredAutocompleteSelectionValidatorDirective,
    ShowTooltipIfEllipsisDirective,
    PushPipe,
    MatButton,
    SelectQueueComponent
  ],
  providers      : [],
  declarations   : [],
  exports        : [SelectQueueComponent]
})
export class SelectQueueModule {
}
