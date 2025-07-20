import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Project} from '~/business-logic/model/projects/project';
import {ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild, inject, computed} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable, Subscription} from 'rxjs';
import {selectTablesFilterProjectsOptions} from '@common/core/reducers/projects.reducer';
import {getTablesFilterProjectsOptions} from '@common/core/actions/projects.actions';
import {filter, map, tap} from 'rxjs/operators';
import {castArray, isEqual} from 'lodash-es';
import {NgForm} from '@angular/forms';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {isReadOnly} from '@common/shared/utils/is-read-only';
import {rootProjectsPageSize} from '@common/constants';
import {ProjectsGetAllResponseSingle} from '~/business-logic/model/projects/projectsGetAllResponseSingle';

@Component({
    selector: 'sm-change-project-dialog',
    templateUrl: './change-project-dialog.component.html',
    styleUrls: ['./change-project-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ChangeProjectDialogComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  public dialogRef = inject<MatDialogRef<ChangeProjectDialogComponent>>(MatDialogRef<ChangeProjectDialogComponent>);

  public projects$: Observable<Project[]>;
  public sourceProject: Project;
  public currentProjects: string[];
  public projects: { label: string; value: string }[];
  public formData: { project: any } = {
    project: null
  };
  public reference: string;
  private subs = new Subscription();

  @ViewChild('moveToForm', {static: true}) moveToForm: NgForm;
  public readOnlyProjects$: Observable<string[]>;
  public isAutoCompleteOpen: boolean;
  public currentProjectInstance: Project;
  public isMulti: boolean;
  type: EntityTypeEnum;
  private projectRoot = 'Projects root';
  private rootFiltered: boolean;
  public loading: boolean;
  public noMoreOptions: boolean;
  private allProjectsBeforeFilter: Partial<ProjectsGetAllResponseSingle>[];
  private previousLength: number | undefined;
  protected allProjects = this.store.selectSignal(selectTablesFilterProjectsOptions);
  protected allProjectsNames = computed(() => this.allProjects().map(project => project.name));

  constructor() {
    const data = inject<{
      currentProjects: Project['id'] | Project['id'][];
      defaultProject: Project;
      reference?: string | any[];
      type: EntityTypeEnum;
    }>(MAT_DIALOG_DATA);

    this.sourceProject = data.defaultProject;
    this.currentProjects = castArray(data.currentProjects);
    this.isMulti = !!Array.isArray(data.reference);
    this.type = data.type;
    this.reference = Array.isArray(data.reference) ? `${data.reference.length} ${data.type}s` : data.reference;
    this.readOnlyProjects$ = this.store.select(selectTablesFilterProjectsOptions)
      .pipe(map(projects => projects?.filter(project => isReadOnly(project)).map(project=> project.name).concat(this.currentProjectInstance?.name)));

    this.projects$ = this.store.select(selectTablesFilterProjectsOptions).pipe(
      tap(projects => this.allProjectsBeforeFilter = projects),
      filter(projects => !!projects),
      map(projects => projects.filter((project) => !isReadOnly(project)))
    );
  }

  ngOnInit(): void {
    this.searchChanged('');
    this.subs.add(this.projects$.subscribe(projects => {
      this.loading = false;
      this.noMoreOptions = this.allProjectsBeforeFilter?.length === this.previousLength || this.allProjectsBeforeFilter?.length < rootProjectsPageSize;
      this.previousLength = this.allProjectsBeforeFilter?.length;
      if (this.currentProjects.length === 1) {
        this.currentProjectInstance = projects.filter(proj=> !proj.hidden).find(proj => proj.id === this.currentProjects[0]);
      }
      // const projectNameToHide = (this.sourceProject && !this.sourceProject.name.match(/^\.\w+$/)) ? this.sourceProject.name?.replace(/\/\.\w+$/, '') : 'Projects root';
      // const sourceProjectOrChild = new RegExp(`^${projectNameToHide}(\/\.[a-zA-Z]+)*$`);
      const projectList = [
        ...(this.rootFiltered ? [] : [{value: null, label: this.projectRoot}]),
        ...projects.map(project => ({value: project.id, label: project.name}))
      ]
        .filter( project => project.value !== this.sourceProject?.id);
      if (!isEqual(projectList, this.projects)) {
        this.projects = projectList;
      }
    }));

    setTimeout(() => {
      if (!this.moveToForm?.controls['projectName']) {
        return;
      }
      this.subs.add(this.moveToForm.controls['projectName'].valueChanges
        .subscribe(searchString => {
            if (typeof searchString === 'string') {
              this.searchChanged(searchString || '');
              this.previousLength = 0;
            }
          }
        ));
    }, 1000);
  }

  searchChanged(searchString: string) {
    this.projects = null;
    this.rootFiltered = !this.projectRoot.includes(searchString);
    this.store.dispatch(getTablesFilterProjectsOptions({searchString, loadMore: false,  allowPublic: false}));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  closeDialog(isConfirmed) {
    if (isConfirmed) {
      if (typeof this.formData.project === 'string') {
        this.formData.project = {label: this.formData.project, value: ''};
      }
      this.dialogRef.close({id: this.formData.project.value, name: this.formData.project.value === null ? undefined : this.formData.project.label});
    } else {
      this.dialogRef.close(null);
    }
  }

  displayFn(project: any ): string {
    return project && project.label ? project.label : project ;
  }

  clear() {
    this.formData.project = '';
  }
  setIsAutoCompleteOpen(focus: boolean) {
    this.isAutoCompleteOpen = focus;
  }

  trackByFn = (index, project) => project.label;

  loadMore(searchString) {
    this.loading = true;
    this.store.dispatch(getTablesFilterProjectsOptions({searchString: searchString || '', loadMore: true,  allowPublic: false}));
  }

  isFocused(locationRef: HTMLInputElement) {
    return document.activeElement === locationRef;
  }
}
