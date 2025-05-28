import {PushPipe} from '@ngrx/component';
import {Store} from '@ngrx/store';
import {ChangeDetectionStrategy, Component} from '@angular/core';
import {selectIsLoading} from '@common/core/reducers/view.reducer';
import {NavigationStart, Router} from '@angular/router';
import {debounce, distinctUntilChanged, filter, map} from 'rxjs/operators';
import {resetLoader} from '@common/core/actions/layout.actions';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {interval} from 'rxjs';


@Component({
    selector: 'sm-spinner',
    template: `
    @if (loading$ | ngrxPush) {
      <div class="loader-container">
        <mat-spinner [diameter]="64" [strokeWidth]="6" color="accent"></mat-spinner>
      </div>
    }
    `,
    styleUrls: ['./spinner.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressSpinnerModule,
    PushPipe
  ]
})
export class SpinnerComponent {
  protected loading$ = this.store.select(selectIsLoading)
    .pipe(debounce(loading => interval((loading ? 0 : 200))));

  constructor(private store: Store, private router: Router) {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationStart),
        map((event: NavigationStart) => event.url.split('?')[0]),
        distinctUntilChanged()
      ).subscribe(() => {
      this.store.dispatch(resetLoader());
    });
  }
}
