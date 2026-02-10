import {MAT_DIALOG_DATA, MatDialogClose, MatDialogRef} from '@angular/material/dialog';
import {Project} from '~/business-logic/model/projects/project';
import {ChangeDetectionStrategy, Component, computed, effect, inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectTablesFilterProjectsOptions} from '@common/core/reducers/projects.reducer';
import {getTablesFilterProjectsOptions} from '@common/core/actions/projects.actions';
import {AsyncValidatorFn, FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {PaginatedEntitySelectorComponent} from '@common/shared/components/paginated-entity-selector/paginated-entity-selector.component';
import {StringIncludedInArrayPipe} from '@common/shared/pipes/string-included-in-array.pipe';
import {MatError} from '@angular/material/form-field';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {SlicePipe} from '@angular/common';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {toSignal} from '@angular/core/rxjs-interop';
import {MatButton} from '@angular/material/button';
import {isReadOnly} from '@common/shared/utils/is-read-only';
import {exampleProjectAsyncValidator} from '@common/experiments/shared/components/move-project-dialog/exampleProjectAsyncValidator';
import {ProjectsGetAllResponseSingle} from '~/business-logic/model/projects/projectsGetAllResponseSingle';
import {projectsRoot} from '@common/experiments/shared/common-experiments.const';
import {minLengthTrimmed} from '@common/shared/validators/minLengthTrimmed';

export interface MoveProjectData {
  currentProjects: Project['id'][];
  defaultProject: Project;
  reference?: string | any[];
  type: EntityTypeEnum;
  allowRootProject?: boolean;
  asyncValidator?: {
    validator: AsyncValidatorFn;
    errorName: string;
    errorMessage: string;
  }
}


@Component({
  selector: 'sm-move-project-dialog',
  templateUrl: './move-project-dialog.component.html',
  styleUrls: ['./move-project-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PaginatedEntitySelectorComponent,
    FormsModule,
    MatError,
    ReactiveFormsModule,
    StringIncludedInArrayPipe,
    TooltipDirective,
    SlicePipe,
    DialogTemplateComponent,
    MatButton,
    MatDialogClose
  ]
})
export class MoveProjectDialogComponent {
  private store = inject(Store);
  public dialogRef = inject<MatDialogRef<MoveProjectDialogComponent>>(MatDialogRef<MoveProjectDialogComponent>);
  protected data = inject<MoveProjectData>(MAT_DIALOG_DATA);
  private builder = inject(FormBuilder);

  private selectedProject: Project = null;

  protected reference: string;
  protected moveProjectForm = this.builder.group({
    project: ['', [minLengthTrimmed(1)], [exampleProjectAsyncValidator()]],
    projectId: [null as string],
    name: [this.data.reference]
  }, {asyncValidators: this.data.asyncValidator?.validator ? [this.data.asyncValidator.validator] : []});


  protected currentProjectInstance = computed(() => this.allProjects()
    .filter(proj => !proj.hidden)
    .find(proj => proj.id === this.data.currentProjects[0])
  );

  protected projects = this.store.selectSignal(selectTablesFilterProjectsOptions);
  private projectValue = toSignal(this.moveProjectForm.controls.project.valueChanges);
  protected rootFiltered = computed(() => !projectsRoot.name.includes(this.projectValue()?.trim()));
  protected filterProjects = computed(() => this.projects()?.filter(project =>
    !isReadOnly(project))
    .map(project => ({
      ...project,
      disabled: this.isSameProject(project)
    }) as Project)
  );
  protected allProjects = computed(() => ([
    ...(!this.filterProjects() || this.rootFiltered() || !this.data.allowRootProject ? [] : [{...projectsRoot, disabled: this.data.defaultProject === undefined || this.data.defaultProject?.name === '.reports'}]),
    ...this.filterProjects() ?? []
  ]));
  protected projectsNames = computed(() => this.allProjects().map(project => project.name));

  constructor() {
    this.reference = Array.isArray(this.data.reference) ? `${this.data.reference.length} ${this.data.type}s` : this.data.reference;
    this.searchChanged('');

    effect(() => {
      if (this.allProjects()?.length > 0) {
        this.selectedProject = this.allProjects()?.find(p => p.name === this.projectValue()?.trim());
        this.moveProjectForm.controls.projectId.setValue(this.selectedProject?.id === projectsRoot.id ? '*' : this.selectedProject?.id);
      } else {
        this.selectedProject = null
        this.moveProjectForm.controls.projectId.setValue(null);
      }
    });

    effect(() => {
      const selectedProject = this.projectValue() && this.allProjects().find(proj => proj.name === this.moveProjectForm.controls.project.value?.trim());
      if (this.isSameProject(selectedProject)) {
        this.moveProjectForm.controls.project.setErrors({...this.moveProjectForm.controls.project.errors, sameProject: true});
      }
    });
  }

  searchChanged(searchString: string) {
    this.store.dispatch(getTablesFilterProjectsOptions({searchString: searchString?.trim() ?? '', loadMore: false, allowPublic: false}));
  }

  closeDialog() {
    if (this.moveProjectForm.controls.project.value?.trim() === projectsRoot.name || this.selectedProject?.id === projectsRoot.id) {
      this.dialogRef.close({id: null});
    } else if (this.selectedProject) {
      this.dialogRef.close(this.selectedProject);
    } else {
      this.dialogRef.close({name: this.moveProjectForm.controls.project.value?.trim(), id: ''});
    }
  }

  loadMore(searchString: string) {
    this.store.dispatch(getTablesFilterProjectsOptions({searchString: searchString || '', loadMore: true, allowPublic: false}));
  }

  private isSameProject(project: Partial<ProjectsGetAllResponseSingle>) {
    return (this.data.defaultProject === undefined && project?.id === projectsRoot.id) || this.data.defaultProject !== undefined && (project?.name === this.data.defaultProject?.name ||
      (this.data.type === EntityTypeEnum.report && project?.name === this.data.defaultProject?.name.replace('/.reports', '')));
  }
}
