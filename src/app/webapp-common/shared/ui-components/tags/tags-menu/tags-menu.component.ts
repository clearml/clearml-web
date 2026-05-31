import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef, input, output, inject, computed, linkedSignal, viewChild
} from '@angular/core';
import {Store} from '@ngrx/store';
import {openTagColorsMenu, setTagsFilterByProject} from '@common/core/actions/projects.actions';
import {activateEdit} from '@common/experiments/actions/common-experiments-info.actions';
import {activateModelEdit} from '@common/models/actions/models-info.actions';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {MatMenu, MatMenuModule} from '@angular/material/menu';
import {MatInputModule} from '@angular/material/input';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {FilterPipe} from '@common/shared/pipes/filter.pipe';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {A11yModule} from '@angular/cdk/a11y';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {
  DotsLoadMoreComponent
} from '@common/shared/ui-components/indicators/dots-load-more/dots-load-more.component';
import {toSignal} from '@angular/core/rxjs-interop';

@Component({
  selector: 'sm-tags-menu',
  templateUrl: './tags-menu.component.html',
  styleUrls: ['./tags-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatMenuModule,
    MatInputModule,
    ReactiveFormsModule,
    TooltipDirective,
    ClickStopPropagationDirective,
    A11yModule,
    ShowTooltipIfEllipsisDirective,
    MatIconButton,
    MatIcon,
    DotsLoadMoreComponent
  ]
})
export class TagsMenuComponent {
      private readonly store = inject(Store);
      private readonly cdr = inject(ChangeDetectorRef);
      private readonly elRef = inject(ElementRef);
  protected filterControl = new FormControl('');
  protected filterText = toSignal(this.filterControl.valueChanges);
  private firstTime = true;
  private routerParams = this.store.selectSignal(selectRouterParams);
  protected isAllProject = computed(() => this.routerParams()?.projectId === '*')
  private mixedTags = computed(() => Array.from(new Set((this.projectTags() || []).filter(t => t !== null).concat(this.companyTags() || []).sort())));
  protected allTags = computed(() => this.filterByProject() ? this.projectTags() : (this.isAllProject() ? this.mixedTags() : this.companyTags()));
  protected tagsLimit = linkedSignal({
    source: () => ({
      allTags: this.allTags()?.length,
      filterText: this.filterText(),
      tags: this.tags()?.length,
    }),
    computation: () => 100,
  });
  private filterPipe = new FilterPipe();

  protected filteredTags = computed(() => {
    const all = this.allTags() || [];
    const exclude = this.tags();
    const query = this.filterText();
    let res = this.filterPipe.transform(all, exclude);
    res = this.filterPipe.transform(res, query);
    return res;
  });

  protected slicedTags = computed(() => this.filteredTags()?.slice(0, this.tagsLimit()));

  tags = input<string[]>();
  projectTags = input<string[]>();
  companyTags = input<string[]>([]);
  filterByProject = input<boolean>();
  disableFilterByProject = input<boolean>();
  disableCreateNew = input<boolean>();
  disableColorManagement = input<boolean>();
  tagSelected = output<string>();
  getTags = output();
  getCompanyTags = output();

  matMenu = viewChild(MatMenu);
  protected nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');
  protected createButton = viewChild<ElementRef<HTMLButtonElement>>('tagCreateButton');
  protected tagButton = viewChild<ElementRef<HTMLButtonElement>>('tagButton');

  openTagColors() {
    window.setTimeout(() => {
      this.store.dispatch(activateEdit('tags'));
      this.store.dispatch(activateModelEdit('tags'));
    }, 500);
    this.store.dispatch(openTagColorsMenu({tags: this.filterByProject() ? this.projectTags() : this.companyTags()}));
  }

  addTag(tag: string) {
    if (tag?.trim().length > 0 && !this.tags().includes(tag)) {
      this.tagSelected.emit(tag);
      this.filterControl.setValue('');
    }
    this.elRef.nativeElement.blur();
  }

  focus(event?: Event) {
    event?.preventDefault();
    if (this.filterByProject()) {
      this.firstTime = true;
      this.getTags.emit();
    } else {
      this.firstTime = false;
      this.getCompanyTags.emit();
    }
    this.nameInput().nativeElement.focus();
    this.cdr.detectChanges();
  }

  clear() {
    this.filterControl.setValue('');
  }

  projectTagsFilterToggle(): void {
    if (this.filterByProject()) {
      if (this.firstTime) {
        this.firstTime = false;
        this.getCompanyTags.emit();
      }
    }
    this.store.dispatch(setTagsFilterByProject({tagsFilterByProject: !this.filterByProject()!}));
  }

  loadMore() {
    window.setTimeout(() => {
      this.tagsLimit.update(limit => limit + 100);
    }, 300);
  }

  protected submit() {
    if (this.filterText()?.trim().length > 0 && (!this.disableCreateNew() || this.allTags()?.includes(this.filterText()))) {
      this.addTag(this.filterText());
    }
  }
}
