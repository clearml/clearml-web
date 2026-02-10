import {NgModule} from '@angular/core';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {projectDialogReducer} from './project-dialog.reducer';
import {ProjectDialogEffects} from './project-dialog.effects';

@NgModule({
  imports: [
    StoreModule.forFeature('projectCreateDialog', projectDialogReducer),
    EffectsModule.forFeature([ProjectDialogEffects]),
  ],
})
export class ProjectDialogModule {
}
