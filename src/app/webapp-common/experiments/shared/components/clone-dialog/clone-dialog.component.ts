import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {
  ChangeDetectionStrategy,
  Component, computed, effect,
  inject
} from '@angular/core';
import {Store} from '@ngrx/store';
import {FormBuilder, Validators} from '@angular/forms';
import {selectReadOnlyProjects, selectTablesFilterProjectsOptions} from '@common/core/reducers/projects.reducer';
import {getTablesFilterProjectsOptions} from '@common/core/actions/projects.actions';
import {rootProjectsPageSize} from '@common/constants';
import {
  IOption
} from '@common/shared/ui-components/inputs/select-autocomplete-with-chips/select-autocomplete-with-chips.component';
import {selectCloneForceParent} from '@common/experiments/reducers';
import {CloneExperimentPayload} from '@common/experiments/shared/common-experiment-model.model';
import {ProjectsGetAllResponseSingle} from '~/business-logic/model/projects/projectsGetAllResponseSingle';
import {isReadOnly} from '@common/shared/utils/is-read-only';
import {minLengthTrimmed} from '@common/shared/validators/minLengthTrimmed';
import {CloneNamingService} from '~/features/experiments/shared/services/clone-naming.service';

export interface CloneDialogData {
  type: string;
  defaultProject: string;
  defaultName: string;
  defaultComment?: string;
  extend?: boolean;
}

@Component({
    selector: 'sm-clone-dialog',
    templateUrl: './clone-dialog.component.html',
    styleUrls: ['./clone-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class CloneDialogComponent {
  private readonly store = inject(Store);
  private readonly dialogRef = inject(MatDialogRef<CloneDialogComponent>);
  protected data = inject<CloneDialogData>(MAT_DIALOG_DATA);
  private readonly builder = inject(FormBuilder);
  private readonly naming = inject(CloneNamingService);

  public reference: string;
  public header: string;
  public type: string;

  protected cloneForm = this.builder.group({
    project: [null as string, [Validators.required, minLengthTrimmed(3)]],
    name: [null as string, [Validators.required]],
    comment: [null as string],
    forceParent: [false]
  });

  private readonly defaultProjectId: string;

  isAutoCompleteOpen: boolean;
  public extend: boolean;
  private defaultProject;
  private newProjectName: string;

  public forceParent = this.store.selectSignal(selectCloneForceParent);
  protected projects = this.store.selectSignal(selectTablesFilterProjectsOptions);
  protected readonlyProject = computed(() => this.projects()?.length === 1 && isReadOnly(this.projects()[0]));
  protected noMoreOptions = computed(() => this.projects()?.length < rootProjectsPageSize);
  protected loading = computed(() => this.projects() === null);
  protected projectsNames = computed(() => this.projects()?.map(p => p.name) ?? []);
  protected readOnlyProjects = this.store.selectSignal(selectReadOnlyProjects);

  constructor() {
    this.defaultProjectId = this.data.defaultProject;
    this.header = `${this.data.extend ? 'Extend' : 'Clone'} ${this.data.type}`;
    this.type = this.data.type.toLowerCase();
    this.reference = this.data.defaultName;
    this.extend = this.data.extend;
    setTimeout(() => {
      this.cloneForm.patchValue({
        comment: this.data.defaultComment || '',
      });
    });
    this.searchChanged({value: this.defaultProjectId ?? ''});

    effect(() => {
      if (this.projects()?.length && this.cloneForm.controls.project.value === null && !this.defaultProject) {
        this.defaultProject = this.projects().find(project => project.id === this.defaultProjectId) ?? this.projects()[0] ?? null;
        this.cloneForm.controls.project.setValue(this.defaultProject?.name);
        this.cloneForm.controls.project.markAsTouched({emitEvent: false})
      }
    });

    effect(() => {
      this.cloneForm.controls.forceParent.setValue(this.forceParent());
    });

    effect(() => {
      const name = this.naming.getClonePrefix(this.data.defaultName);
      if (name) {
        this.cloneForm.patchValue({name})
      }
    });
  }


  searchChanged(searchString: {value: string; loadMore?: boolean}) {
    this.store.dispatch(getTablesFilterProjectsOptions({
      searchString: searchString.value ?? '', loadMore: searchString.loadMore, allowPublic: false
    }));
  }

  closeDialog() {
    // if (typeof this.cloneForm.controls.project.value === 'string') {
    //   this.formData.project = {label: this.formData.project, value: ''};
    function projectToOption(project: Partial<ProjectsGetAllResponseSingle>) {
      return {value: project.id, label: project.name} as IOption;
    }

    // }
    this.dialogRef.close({
      ...this.cloneForm.value,
      project: this.newProjectName ? {label: this.cloneForm.controls.project.value, value: ''} : projectToOption(this.projects()?.find(p => p.name === this.cloneForm.controls.project.value))
    } as CloneExperimentPayload);
  }

  loadMore() {
    this.store.dispatch(getTablesFilterProjectsOptions({
      searchString: this.cloneForm.controls.project.value ?? '',
      loadMore: true,
      allowPublic: false
    }));
  }

  createNewSelected(value: string) {
    this.newProjectName = value;
  }
}
