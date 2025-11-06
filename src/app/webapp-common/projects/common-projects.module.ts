import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ProjectsPageComponent} from './containers/projects-page/projects-page.component';
import {EffectsModule} from '@ngrx/effects';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ProjectsListComponent} from './dumb/projects-list/projects-list.component';
import {ProjectDialogModule} from '../shared/project-dialog/project-dialog.module';
import {ProjectsSharedModule} from '~/features/projects/shared/projects-shared.module';
import {ProjectsEffects} from '~/features/projects/projects.effect';
import {CommonProjectsEffects} from './common-projects.effects';
import {ProjectCardComponent} from '@common/shared/ui-components/panel/project-card/project-card.component';
import {StoreModule} from '@ngrx/store';
import {projectsReducer} from '~/features/projects/projects.reducer';
import {PushPipe} from '@ngrx/component';
import {DotsLoadMoreComponent} from '@common/shared/ui-components/indicators/dots-load-more/dots-load-more.component';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ProjectDialogModule,
    ProjectsSharedModule,
    StoreModule.forFeature('projects', projectsReducer),
    EffectsModule.forFeature([ProjectsEffects, CommonProjectsEffects]),
    ProjectCardComponent,
    PushPipe,
    DotsLoadMoreComponent,
    MatButton,
    MatIcon,
  ],
  declarations: [ProjectsPageComponent, ProjectsListComponent],
  exports: [ProjectsPageComponent, ProjectsListComponent]
})
export class CommonProjectsModule {
}
