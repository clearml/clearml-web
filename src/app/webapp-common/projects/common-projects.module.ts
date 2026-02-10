import {NgModule} from '@angular/core';
import {EffectsModule} from '@ngrx/effects';
import {ProjectsEffects} from '~/features/projects/projects.effect';
import {CommonProjectsEffects} from './common-projects.effects';
import {StoreModule} from '@ngrx/store';
import {projectsReducer} from '~/features/projects/projects.reducer';
import {CommonDeleteDialogModule} from '@common/shared/entity-page/entity-delete/common-delete-dialog.module';


@NgModule({
  imports: [
    CommonDeleteDialogModule,
    StoreModule.forFeature('projects', projectsReducer),
    EffectsModule.forFeature([ProjectsEffects, CommonProjectsEffects]),
  ],
})
export class CommonProjectsModule {
}
