import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component, computed, effect, input,
  OnChanges, OnDestroy, output, signal, viewChild
} from '@angular/core';
import {Project} from '~/business-logic/model/projects/project';
import {FormsModule, NgForm} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {ShortProjectNamePipe} from '@common/shared/pipes/short-project-name.pipe';
import {ProjectLocationPipe} from '@common/shared/pipes/project-location.pipe';
import {Subscription, switchMap} from 'rxjs';
import {rootProjectsPageSize} from '@common/constants';
import {MatInputModule} from '@angular/material/input';
import {StringIncludedInArrayPipe} from '@common/shared/pipes/string-included-in-array.pipe';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {UniqueNameValidatorDirective} from '@common/shared/ui-components/template-forms-ui/unique-name-validator.directive';
import {InvalidPrefixValidatorDirective} from '@common/shared/ui-components/template-forms-ui/invalid-prefix-validator.directive';
import {UniquePathValidatorDirective} from '@common/shared/ui-components/template-forms-ui/unique-path-validator.directive';
import {
  PaginatedEntitySelectorComponent
} from '@common/shared/components/paginated-entity-selector/paginated-entity-selector.component';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {filter} from 'rxjs/operators';
import {MatButton} from '@angular/material/button';


@Component({
    selector: 'sm-project-move-to-form',
    templateUrl: './project-move-to-form.component.html',
    styleUrls: ['./project-move-to-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatInputModule,
        FormsModule,
        MatAutocompleteModule,
        StringIncludedInArrayPipe,
        MatProgressSpinnerModule,
        UniqueNameValidatorDirective,
        ShortProjectNamePipe,
        ProjectLocationPipe,
        InvalidPrefixValidatorDirective,
        UniquePathValidatorDirective,
        PaginatedEntitySelectorComponent,
        MatButton,
    ]
})
export class ProjectMoveToFormComponent implements OnChanges, OnDestroy, AfterViewInit {
  public readonly projectsRoot = 'Projects root';
  public rootFiltered: boolean;
  public projectName: string;
  public isAutoCompleteOpen: boolean;
  protected filterText = '';
  public projectsNames: string[];
  public project = {
    parent: null
  };
  private newProjectName: string;
  private subs = new Subscription();
  public noMoreOptions: boolean;
  private previousLength: number | undefined;

  moveToForm = viewChild<NgForm>('moveToForm');
  public form = viewChild<NgForm>('projectForm');
  baseProject = input<Project>();
  projects = input<Project[]>();
  protected allProjects = computed(() => ([
    ...(this.rootFiltered ? [] : [{name: this.projectsRoot, id: '999999999999999'}]),
    ...this.projects() ?? []
  ]));
  protected state = computed(() => ({
    projects: this.projects(),
    loading: signal(false)
  }));

  constructor() {
    effect(() => {
      const projects = this.projects();
      this.noMoreOptions = projects?.length === this.previousLength || projects?.length < rootProjectsPageSize;
      this.previousLength = projects?.length;

      if (projects) {
        this.projectsNames = [
          ...(this.rootFiltered ? [] : [this.projectsRoot]),
          ...projects.map(project => project.name)
        ];
      }
    });

    toObservable(this.moveToForm)
      .pipe(
        takeUntilDestroyed(),
        switchMap(form => form.controls['projectName'].valueChanges),
        filter(searchString => searchString !== this.project.parent)
      )
      .subscribe(searchString => {
        this.searchChanged(searchString || '');
      });
  }

  filterSearchChanged = output<{
        value: string;
        loadMore?: boolean;
    }>();
  moveProject = output<{
        location: string;
        name: string;
        fromName: string;
        toName: string;
        projectName: string;
    }>();
  dismissDialog = output();

  send() {
    this.moveProject.emit({
      location: this.project.parent,
      name: this.newProjectName,
      projectName: new ShortProjectNamePipe().transform(this.projectName),
      fromName: new ProjectLocationPipe().transform(this.projectName),
      toName: this.project.parent
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
    });
  }

  ngOnChanges() {
    if (this.projects()?.length > 0 && this.baseProject()) {
      this.projectName = this.baseProject()?.name ?? this.projectsRoot;
      // if (this.baseProject && this.project.parent === null) {
      //   this.project.parent = this.baseProject.name;
      // }
    }
  }

  clear() {
    this.project.parent = '';
  }

  closeDialog() {
    this.dismissDialog.emit();
  }

  createNewSelected(value: string) {
    this.newProjectName = value;
  }

  optionSelected() {
    this.newProjectName = null;
  }

  searchChanged(searchString: string) {
    this.projectsNames = null;
    this.rootFiltered = !this.projectsRoot.includes(searchString);
    if (searchString !== null) {
      this.filterSearchChanged.emit({value: searchString});
    }
  }

  loadMore(searchString, loadMore) {
    this.state().loading.set(true);
    this.filterSearchChanged.emit({value: searchString || '', loadMore});
  }

  isFocused(locationRef: HTMLInputElement) {
    return document.activeElement === locationRef;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}

