import {Component, inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectThemeMode} from '@common/core/reducers/view.reducer';

@Component({
  selector: 'sm-page-base',
  template: '',
  })
export abstract class PageBaseComponent {
  private readonly store= inject(Store);
  protected theme = this.store.selectSignal(selectThemeMode);

  imageClicked(image: HTMLImageElement) {
    if (image.closest('.image').classList.contains('full-screen')) {
      image.closest('.image').classList.remove('full-screen');
      image.closest('.mat-drawer-content').classList.remove('position-static');
    } else {
      image.closest('.image').classList.add('full-screen');
      image.closest('.mat-drawer-content').classList.add('position-static');
    }
  }
}
