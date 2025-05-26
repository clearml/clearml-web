import {ChangeDetectionStrategy, Component, computed, ElementRef, HostListener, inject, input, OnDestroy, output, signal} from '@angular/core';
import {Store} from '@ngrx/store';
import {setBackdrop} from '@common/core/actions/layout.actions';
import {MatDialog} from '@angular/material/dialog';
import {fromEvent, Subscription} from 'rxjs';
import {tap, throttleTime} from 'rxjs/operators';

import {MatButton} from '@angular/material/button';
import {computedPrevious} from 'ngxtension/computed-previous';

@Component({
    selector: 'sm-editable-section',
    templateUrl: './editable-section.component.html',
    styleUrls: ['./editable-section.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatButton
    ]
})
export class EditableSectionComponent implements OnDestroy {
  private store = inject(Store);
  private matDialog = inject(MatDialog);
  public elementRef = inject(ElementRef);

  private scrollSub: Subscription;

  editable = input();
  disableEditable = input(false);
  disableSave = input(false);
  disableInEditMode = input(false);
  hideSaveButton = input(false);
  containerClass = input('');
  hideEditButton = input(false);
  isDarkTheme = input(false);
  forceButtons = input(false);
  scrollToSection = input(true);
  saving = input<boolean>();
  previousSaving = computedPrevious(this.saving);
  private state = computed(() => ({
    saving: this.saving(),
    inEditMode: signal(false)
  }));
  get inEditMode() {
    return this.state().inEditMode;
  }

  saveClicked = output();
  cancelClicked = output();
  activateEditClicked = output<boolean>();

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (this.inEditMode() && this.matDialog.openDialogs.length === 0) {
      if ((e.key == 'Escape')) {
        this.cancelClickedEvent();
      }
      if ((e.key == 'Enter') && e.ctrlKey === true && !this.disableSave()) {
        this.saveSection();
      }
    }
  }

  editModeChanged(editMode: boolean) {
    this.inEditMode.set(editMode);
    this.activateEditClicked.emit(editMode);
    this.store.dispatch(setBackdrop({active: editMode}));
    if (editMode) {
      setTimeout(() => {
        this.listenScrollEvent();
      }, 50);
    } else {
      this.unsubscribeToEventListener();
    }
  }

  cancelClickedEvent() {
    this.inEditMode.set(false);
    this.store.dispatch(setBackdrop({active: false}));
    this.cancelClicked.emit();
    this.unsubscribeToEventListener();
  }

  saveSection() {
    this.saveClicked.emit();
    this.unsubscribeToEventListener();
  }

  unsubscribeToEventListener() {
    this.scrollSub?.unsubscribe();
  }

  getEdges() {
    const {top, height, bottom} = this.elementRef.nativeElement.getBoundingClientRect();
    return {
      top,
      bottom,
      height
    };
  }
  ngOnDestroy(): void {
    this.unsubscribeToEventListener();
    if (this.inEditMode()) {
      this.cancelClickedEvent();
    }
  }

  private listenScrollEvent() {
    if (!this.scrollToSection()) {
      return;
    }

    const {height: initHeight} = this.getEdges();
    let initBottom;
    const factor = initHeight / 2;

    this.scrollSub = fromEvent(window,'wheel', {passive: false}).pipe(
      tap(() => {
        if (initBottom === undefined) {
          const {bottom: currentBottom} = this.getEdges();
          initBottom = currentBottom;
        }
      }),
      throttleTime(10),
    ).subscribe((event: WheelEvent) => {
      const {bottom: currentBottom} = this.getEdges();
      const deltaY = Math.abs(event.deltaY);

      const isDownDirection = event.deltaY > 0;
      const isTopEdge = !isDownDirection && initBottom + factor - deltaY < currentBottom;
      const isBottomEdge = isDownDirection && initBottom - currentBottom - deltaY > factor;

      const scrolledMoreThanHeight = Math.abs(initBottom - currentBottom ) > initHeight;

      if (deltaY > factor || scrolledMoreThanHeight) {
        this.elementRef.nativeElement.scrollIntoView({behavior: 'smooth', block: 'nearest'});
        event.preventDefault();
        return;
      }
      if ( isBottomEdge || isTopEdge)  {
        event.preventDefault();
      }
    });
  }
}
