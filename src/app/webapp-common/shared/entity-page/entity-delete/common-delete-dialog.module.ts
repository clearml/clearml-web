import {NgModule} from '@angular/core';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {commonDeleteDialogReducer} from './common-delete-dialog.reducer';
import {DeleteDialogEffects} from '~/features/delete-entity/delete-dialog.effects';


@NgModule({
  imports: [
    StoreModule.forFeature('deleteEntityDialog', commonDeleteDialogReducer),
    EffectsModule.forFeature([DeleteDialogEffects]),
  ],
})
export class CommonDeleteDialogModule {
}
