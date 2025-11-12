import {MAT_DIALOG_DATA, MatDialogClose, MatDialogRef} from '@angular/material/dialog';
import {Project} from '~/business-logic/model/projects/project';
import {ChangeDetectionStrategy, Component, computed, effect, inject, Signal} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectTablesFilterProjectsOptions} from '@common/core/reducers/projects.reducer';
import {getTablesFilterProjectsOptions} from '@common/core/actions/projects.actions';
import {FormControl, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
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

export interface MoveProjectData {
  currentProjects: Project['id'][];
  defaultProject: Project;
  reference?: string | any[];
  type: EntityTypeEnum;
  allowRootProject?: boolean;
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

  protected reference: string;
  protected projectControl = new FormControl('', [Validators.minLength(3)], [exampleProjectAsyncValidator()]);

  private selectedProject: Project;

  protected currentProjectInstance = computed(() => this.allProjects()
    .filter(proj => !proj.hidden)
    .find(proj => proj.id === this.data.currentProjects[0])
  );

  protected projects = this.store.selectSignal(selectTablesFilterProjectsOptions);
  private projectValue = toSignal(this.projectControl.valueChanges);
  protected rootFiltered = computed(() => !projectsRoot.name.includes(this.projectValue()));
  protected filterProjects = computed(() => this.projects()?.filter(project =>
    !isReadOnly(project))
    .map(project => ({
      ...project,
      disabled: this.isSameProject(project)
    }) as Project)
  );
  protected allProjects = computed(() => ([
    ...(!this.filterProjects() || this.rootFiltered() || !this.data.allowRootProject ? [] : [{...projectsRoot, disabled: this.data.defaultProject?.name === '.reports'}]),
    ...this.filterProjects() ?? []
  ]));
  protected projectsNames = computed(() => this.allProjects().map(project => project.name));

  constructor() {
    this.reference = Array.isArray(this.data.reference) ? `${this.data.reference.length} ${this.data.type}s` : this.data.reference;
    this.searchChanged('');

    effect(() => {
      if (this.allProjects()?.length > 0) {
        this.selectedProject = this.allProjects()?.find(p => p.name === this.projectValue());
      }
    });

    effect(() => {
      const selectedProject = this.allProjects().find(proj => proj.name === this.projectControl.value);
      if (this.isSameProject(selectedProject)) {
        this.projectControl.setErrors({sameProject: true});
      }
    });
  }

  searchChanged(searchString: string) {
    this.store.dispatch(getTablesFilterProjectsOptions({searchString: searchString ?? '', loadMore: false, allowPublic: false}));
  }

  closeDialog() {
    if (this.projectControl.value === projectsRoot.name || this.selectedProject?.id === projectsRoot.id) {
      this.dialogRef.close({id: null});
    } else if (this.selectedProject) {
      this.dialogRef.close(this.selectedProject);
    } else {
      this.dialogRef.close({name: this.projectControl.value, id: ''});
    }
  }

  loadMore(searchString: string) {
    this.store.dispatch(getTablesFilterProjectsOptions({searchString: searchString || '', loadMore: true, allowPublic: false}));
  }

  private isSameProject(project: Partial<ProjectsGetAllResponseSingle>) {
    return project?.name === this.data.defaultProject?.name ||
    (this.data.type === EntityTypeEnum.report && project?.name === this.data.defaultProject?.name.replace('/.reports', ''))
  }
}
