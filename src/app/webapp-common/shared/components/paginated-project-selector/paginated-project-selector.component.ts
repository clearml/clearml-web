import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule, MatAutocompleteTrigger} from '@angular/material/autocomplete';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {Project} from '~/business-logic/model/projects/project';
import {ProjectOptionRowComponent} from '../project-option-row/project-option-row.component';
import {ProjectSelectedRowComponent} from '../project-selected-row/project-selected-row.component';
import {DotsLoadMoreComponent} from '@common/shared/ui-components/indicators/dots-load-more/dots-load-more.component';
import {rootProjectsPageSize} from '@common/constants';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';

@Component({
  selector: 'sm-paginated-project-selector',
  standalone: true,
  templateUrl: './paginated-project-selector.component.html',
  styleUrls: ['./paginated-project-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIcon,
    MatIconButton,
    FormsModule,
    ReactiveFormsModule,
    TooltipDirective,
    ProjectOptionRowComponent,
    ProjectSelectedRowComponent,
    DotsLoadMoreComponent,
    MatProgressSpinner,
    ClickStopPropagationDirective,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PaginatedProjectSelectorComponent),
      multi: true
    }
  ]
})
export class PaginatedProjectSelectorComponent implements ControlValueAccessor {
  private cdr = inject(ChangeDetectorRef);
  private autocompleteTrigger = viewChild(MatAutocompleteTrigger)

  projects = input<Project[]>([]);
  placeHolder = input('');
  label = input('');
  hint = input('');
  loading = input(false);

  getEntities = output<string>();
  loadMore = output<string>();

  protected data = signal('');
  protected selectionIds = signal<string[]>([]);
  protected selectedProjects = signal<Project[]>([]);
  protected noMoreOptions = signal(false);
  protected previousLength: number;

  protected orderedOptions = computed(() => {
    const projects = this.projects() || [];
    const seen = new Set<string>();
    return [...this.selectedProjects(), ...projects].filter(p => {
      // DEDUP
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  });

  constructor() {
    effect(() => {
      const projects = this.projects();
      if (projects) {
        const length = projects.length;
        this.noMoreOptions.set(length === this.previousLength || length < rootProjectsPageSize);
        this.previousLength = length;

        // Fill in selectionObjects for any selectionIds not yet resolved
        const ids = this.selectionIds();
        if (ids.length > 0) {
          this.selectedProjects.update(currentObjs => {
            const currentIds = new Set(currentObjs.map(p => p.id));
            const found = ids
              .filter(id => !currentIds.has(id))
              .map(id => projects.find(p => p.id === id))
              .filter((p): p is Project => !!p);
            return found.length > 0 ? [...currentObjs, ...found] : currentObjs;
          });
        }
      }
    });
  }

  private onChange: (value: string[]) => void;
  protected onTouched: () => void;

  writeValue(value: string[]) {
    const ids = value || [];
    this.selectionIds.set(ids);
    const projects = this.projects();
    this.selectedProjects.set(ids.map(id => projects?.find(p => p.id === id)).filter((p): p is Project => !!p));
    this.cdr.markForCheck();
  }

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  toggleSelection(project: Project) {
    this.previousLength = 0;
    const isSelected = this.selectionIds().includes(project.id);
    if (isSelected) {
      this.selectedProjects.update(objs => objs.filter(p => p.id !== project.id));
      this.selectionIds.update(ids => ids.filter(id => id !== project.id));
    } else {
      this.selectedProjects.update(objs => [...objs, project]);
      this.selectionIds.update(ids => [...ids, project.id]);
    }
    this.onChange?.(this.selectionIds());
    this.onTouched?.();
    if (this.autocompleteTrigger()?.panelOpen) {
      setTimeout(() => this.autocompleteTrigger().updatePosition());
    }
  }

  loadMoreEntities(value: string) {
    this.loadMore.emit(value);
  }

  onInput(value: string) {
    this.data.set(value);
    this.getEntities.emit(value);
  }

  clearInput() {
    this.data.set('');
    this.getEntities.emit('');
  }

  displayFn() {
    return this.data();
  }

  isProjectSelected(project: Project) {
    return this.selectionIds().includes(project.id);
  }

  autocompleteEnterHandler(event: { isUserInput: boolean }, project: Project) {
    if (event.isUserInput) {
      this.toggleSelection(project);
    }
  }

  optionClicked(event: MouseEvent, project: Project) {
    event.stopPropagation();
    this.toggleSelection(project);
  }
}
