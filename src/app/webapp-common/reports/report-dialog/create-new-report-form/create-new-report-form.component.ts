import {
  ChangeDetectionStrategy,
  Component, computed, effect, inject, input, signal, output } from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Project} from '~/business-logic/model/projects/project';
import {rootProjectsPageSize} from '@common/constants';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {
  PaginatedEntitySelectorComponent
} from '@common/shared/components/paginated-entity-selector/paginated-entity-selector.component';
import {StringIncludedInArrayPipe} from '@common/shared/pipes/string-included-in-array.pipe';
import {MatDialogActions, MatDialogClose} from '@angular/material/dialog';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';

export interface NewReportData {
  name: string;
  description: string;
  project: Project;
}

@Component({
    selector: 'sm-create-new-report-form',
    templateUrl: './create-new-report-form.component.html',
    styleUrls: ['./create-new-report-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ReactiveFormsModule,
        MatFormField,
        PaginatedEntitySelectorComponent,
        StringIncludedInArrayPipe,
        MatDialogActions,
        MatDialogClose,
        MatLabel,
        MatError,
        MatInput,
        MatButton
    ]
})
export class CreateNewReportFormComponent {
  private builder = inject(FormBuilder);

  private createNew: string;
  public readonly projectsRoot = {name: 'Projects root', id: null};

  // public reportsNames: string[];
  protected reportForm = this.builder.group({
    name: [null as string, [Validators.required, Validators.minLength(3)]],
    description: '',
    project: [null as string, [Validators.required, Validators.minLength(3)]]
  });

  readOnlyProjectsNames = input<string[]>();
  defaultProjectId = input<string>();
  projects = input<Project[]>(null);

  filterSearchChanged = output<{
        value: string;
        loadMore?: boolean;
    }>();
  reportCreated = output<NewReportData>();

  private initialized = false;
  protected noMoreOptions = computed(() => this.projects()?.length < rootProjectsPageSize);
  protected projectsOptions = computed(() => [
    ...((this.reportForm.controls.project.value && !this.projectsRoot.name.toLowerCase().includes(this.reportForm.controls.project.value.toLowerCase()) || this.projects() === null) ? [] : [this.projectsRoot]),
    ...(this.projects() ?? [])
  ]);
  protected projectsNames = computed(() => [this.projectsRoot.name, ...this.projectsOptions().map(project => project.name)]);
  protected projectsState = computed(() => ({
    projects: this.projects(),
    loading: signal(this.projects() === null)
  }))


  constructor() {
    effect(() => {
      if (this.projects()?.length > 0 && !this.initialized) {
        this.initialized = true;
        this.reportForm.controls.project.setValue(this.projectsOptions().find(p => p.id === this.defaultProjectId())?.name || this.projectsRoot.name);
        this.reportForm.controls.project.updateValueAndValidity();
      }
    });

    effect(() => {
      this.searchChanged(['*', null].includes(this.defaultProjectId()) ? '' : this.defaultProjectId());
    });
  }

  createNewSelected($event: string) {
    this.createNew = $event;
  }

  send() {
    const project = this.reportForm.controls.project.value;
    this.reportCreated.emit({
      ...this.reportForm.value,
      project: project === this.createNew ? {name: project} : this.projectsOptions().find(p => p.name === project)
    } as NewReportData);
  }

  searchChanged(searchString: string) {
    if (searchString !== null) {
      this.filterSearchChanged.emit({value: searchString, loadMore: false});
    }
  }

  loadMore(term: string, loadMore: boolean) {
    this.projectsState().loading.set(true);
    const value = (term !== this.projectsRoot.name ? term : '') ?? '';
    this.filterSearchChanged.emit({value: value, loadMore});
  }
}

