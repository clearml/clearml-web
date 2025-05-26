import {
  ChangeDetectionStrategy,
  Component, computed, effect, inject,
  input, output
} from '@angular/core';
import {Project} from '~/business-logic/model/projects/project';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {rootProjectsPageSize} from '@common/constants';
import {MatInputModule} from '@angular/material/input';
import {StringIncludedInArrayPipe} from '@common/shared/pipes/string-included-in-array.pipe';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {
  UniqueNameValidatorDirective
} from '@common/shared/ui-components/template-forms-ui/unique-name-validator.directive';
import {UniqueProjectValidator} from '@common/shared/project-dialog/unique-project.validator';
import {
  PaginatedEntitySelectorComponent
} from '@common/shared/components/paginated-entity-selector/paginated-entity-selector.component';
import {toSignal} from '@angular/core/rxjs-interop';
import {OutputDestPattern} from '@common/shared/project-dialog/project-dialog.component';
import {MatButton} from '@angular/material/button';
import {minLengthNoSpaces} from '@common/shared/validators/minLengthNoSpaces';

export interface NewProjectResults {
  name?: string;
  description?: string;
  default_output_destination?: string;
  system_tags?: string[];
  parent?: string;
}

@Component({
  selector: 'sm-create-new-project-form',
  templateUrl: './create-new-project-form.component.html',
  styleUrls: ['./create-new-project-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatInputModule,
    StringIncludedInArrayPipe,
    MatProgressSpinnerModule,
    UniqueNameValidatorDirective,
    UniqueProjectValidator,
    PaginatedEntitySelectorComponent,
    ReactiveFormsModule,
    MatButton,
  ]
})
export class CreateNewProjectFormComponent {
  private readonly formBuilder = inject(FormBuilder);

  public readonly projectsRoot = 'Projects root';

  projectForm = this.formBuilder.group({
    name: ['', [Validators.required, minLengthNoSpaces(3)]],
    description: [''],

    default_output_destination: [null, [Validators.pattern(OutputDestPattern)]],

    system_tags: [[]],
    parent: [null as string, [Validators.required, Validators.minLength(3)]]
  });

  public loading: boolean;
  public noMoreOptions: boolean;
  private initiated: boolean;
  private previousLength: number | undefined;


  baseProject = input<Project>();
  private projectValue = toSignal(this.projectForm.controls.parent.valueChanges);
  projects = input<Project[]>();
  protected rootFiltered = computed(() => !this.projectsRoot.includes(this.projectValue()) && this.projectsRoot === this.baseProject()?.name);
  protected allProjects = computed(() => ([
    ...(!this.projects() || this.rootFiltered() || this.baseProject()?.id === null ? [] : [{
      name: this.projectsRoot,
      id: '999999999999999'
    }]),
    ...(this.baseProject() && !this.projectForm.controls.parent.value ? [this.baseProject()] : []),
    ...this.projects() ?? []
  ]));
  protected projectsNames = computed(() => [...this.allProjects().map(project => project.name), ...this.baseProject() ? [this.baseProject().name] : []]);

  filterSearchChanged = output<{
    value: string;
    loadMore?: boolean;
  }>();
  projectCreated = output<NewProjectResults>();


  constructor() {
    effect(() => {
      const projectsCount = this.projects()?.length;
      this.loading = false;
      this.noMoreOptions = projectsCount === this.previousLength || projectsCount < rootProjectsPageSize;
      this.previousLength = projectsCount;

      if (projectsCount > 0 && this.projectForm.controls.parent.value === null && !this.initiated) {
        this.projectForm.controls.parent.patchValue(this.baseProject()?.name ?? this.projectsRoot);
        this.initiated = true;
      }
    });
  }

  send() {
    this.projectCreated.emit({
      ...this.projectForm.value,
      ...(this.projectForm.controls.default_output_destination.value === '' && {default_output_destination: null})
    });
  }

  loadMore(searchString: string, loadMore: boolean) {
    this.loading = true;
    const value = (searchString !== this.projectsRoot ? searchString : '') ?? '';
    this.filterSearchChanged.emit({value, loadMore});
  }
}

