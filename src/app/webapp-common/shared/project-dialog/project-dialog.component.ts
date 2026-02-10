import * as createNewProjectActions from './project-dialog.actions';
import {Component, DestroyRef, inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {ProjectsCreateRequest} from '~/business-logic/model/projects/projectsCreateRequest';
import {selectTablesFilterProjectsOptions} from '@common/core/reducers/projects.reducer';
import {getTablesFilterProjectsOptions} from '@common/core/actions/projects.actions';
import {Project} from '~/business-logic/model/projects/project';
import {URI_REGEX} from '~/app.constants';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {
  CreateNewProjectFormComponent
} from '@common/shared/project-dialog/create-new-project-form/create-new-project-form.component';
import {
  ProjectMoveToFormComponent
} from '@common/shared/project-dialog/project-move-to-form/project-move-to-form.component';
import {PushPipe} from '@ngrx/component';

export interface ProjectDialogConfig {
  project: Project;
  mode: string;
}

export const OutputDestPattern = `${URI_REGEX.S3_WITH_BUCKET}$|${URI_REGEX.S3_WITH_BUCKET_AND_HOST}$|${URI_REGEX.FILE}$|${URI_REGEX.NON_AWS_S3}$|${URI_REGEX.GS_WITH_BUCKET}$|${URI_REGEX.GS_WITH_BUCKET_AND_HOST}|${URI_REGEX.AZURE_WITH_BUCKET}`;


@Component({
  selector: 'sm-project-create-dialog',
  templateUrl: './project-dialog.component.html',
  styleUrls: ['./project-dialog.component.scss'],
  imports: [
    DialogTemplateComponent,
    CreateNewProjectFormComponent,
    ProjectMoveToFormComponent,
    PushPipe
  ]
})
export class ProjectDialogComponent {
  protected destroy = inject(DestroyRef);
  protected data = inject<ProjectDialogConfig>(MAT_DIALOG_DATA);
  private store = inject(Store);
  private matDialogRef = inject(MatDialogRef<ProjectDialogComponent>);

  public header: string;
  public modeParameters: Record<string, { header: string; icon: string }> = {
    create: {
      header: 'NEW PROJECT',
      icon: 'al-ico-projects'
    },
    move: {
      header: 'MOVE TO',
      icon: 'al-ico-move-to'
    },
    edit: {
      header: 'EDIT PROJECT',
      icon: 'al-ico-projects'
    },

  };
  public baseProject: Project = this.data.project;
  public mode = this.data.mode;
  protected projects$ = this.store.select(selectTablesFilterProjectsOptions);

  constructor() {
    this.store.dispatch(getTablesFilterProjectsOptions({searchString: '', loadMore: false}));

    this.destroy.onDestroy(() => {
      this.store.dispatch(createNewProjectActions.resetState());
    });
  }

  public createProject(projectForm) {
    const project = this.convertFormToProject(projectForm);
    this.store.dispatch(createNewProjectActions.createNewProject({req: project, dialogId: this.matDialogRef.id}));
  }

  // public updateProject(projectForm) {
  //   const project = {project: this.baseProject.id, ...this.convertFormToProject(projectForm)};
  //   this.store.dispatch(createNewProjectActions.updateProject({req: project, dialogId: this.matDialogRef.id}));
  // }

  moveProject(event: { location: string; name: string; fromName: string; toName: string; projectName: string }) {
    this.store.dispatch(createNewProjectActions.moveProject({
      project: this.baseProject.id,
      ...event,

      new_location: event.location === 'Projects root' ? '' : event.location,
      dialogId: this.matDialogRef.id
    }));
  }

  filterSearchChanged($event: { value: string; loadMore?: boolean }) {
    this.store.dispatch(getTablesFilterProjectsOptions({
      searchString: $event.value || '',
      loadMore: $event.loadMore,
      allowPublic: false
    }));
  }

  closeDialog() {
    this.matDialogRef.close();
  }

  private convertFormToProject(projectForm: any): ProjectsCreateRequest {
    return {
      name: `${projectForm.parent === 'Projects root' ? '' : projectForm.parent + '/'}${projectForm.name}`,
      ...(projectForm.description && {description: projectForm.description}),
      ...(projectForm.system_tags && {system_tags: projectForm.system_tags}),
      default_output_destination: projectForm.default_output_destination
    };
  }
}
