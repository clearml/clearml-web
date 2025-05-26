import {Component, Inject, OnDestroy, signal, viewChild} from '@angular/core';
import {Observable, of} from 'rxjs';
import {Store} from '@ngrx/store';
import {selectCompanyTags, selectProjectTags} from '@common/core/reducers/projects.reducer';
import {map, switchMap} from 'rxjs/operators';
import {TagColorService} from '../../../services/tag-color.service';
import {Tag} from '../tag-list/tag-list.component';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';
import {deactivateEdit} from '@common/experiments/actions/common-experiments-info.actions';
import {cancelModelEdit} from '@common/models/actions/models-info.actions';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {MatInputModule} from '@angular/material/input';
import {FormsModule} from '@angular/forms';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {MatMenuModule} from '@angular/material/menu';
import {ColorPickerDirective} from 'ngx-color-picker';
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {FilterPipe} from '@common/shared/pipes/filter.pipe';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {PushPipe} from '@ngrx/component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

@Component({
    selector: 'sm-tag-color-menu',
    templateUrl: './tag-color-menu.component.html',
    styleUrls: ['./tag-color-menu.component.scss'],
    imports: [
        MatInputModule,
        FormsModule,
        DialogTemplateComponent,
        MatMenuModule,
        ColorPickerDirective,
        CdkVirtualScrollViewport,
        CdkVirtualForOf,
        FilterPipe,
        ClickStopPropagationDirective,
        CdkFixedSizeVirtualScroll,
        PushPipe,
        MatButton,
        MatIcon,
        MatIconButton
    ]
})
export class TagColorMenuComponent implements OnDestroy {
  filterText: string;
  public tags$: Observable<Tag[]>;
  presetColors = TagColorService.predefined.map(color => color.background) as string[];
  currTag: string;
  currColor = signal<string>(null);
  protected picker = viewChild(ColorPickerDirective);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {tags?: string[]},
    private store: Store,
    private colorService: TagColorService,
    private matDialogRef: MatDialogRef<TagColorMenuComponent>,
  ) {
    this.tags$ = this.store.select(selectRouterParams)
      .pipe(
        map(params => params?.projectId),
        switchMap( id => Array.isArray(data.tags) ? of(data.tags) :
          id === '*' ? this.store.select(selectCompanyTags) : this.store.select(selectProjectTags)),
        map((tags: string[]) => tags.map(tag => ({caption: tag, colorObservable: this.colorService.getColor(tag)} as Tag))));
  }

  close() {
    this.matDialogRef.close();
  }

  setForeground(tag: string, color: string) {
    this.colorService.setColor(tag, {foreground: color});
  }

  setBackground() {
    this.colorService.setColor(this.currTag, {background: this.currColor()});
    this.picker().closeDialog();
  }

  openColorPicker(tag: string, color: string) {
    this.currTag = tag;
    this.currColor.set(color);
    this.picker().openDialog();
  }

  clearSearch() {
    this.filterText = '';
  }

  ngOnDestroy(): void {
    this.store.dispatch(deactivateEdit());
    this.store.dispatch(cancelModelEdit());
  }
}
