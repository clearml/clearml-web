import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {setRedactedArguments} from '@common/core/actions/layout.actions';
import {selectRedactedArguments} from '@common/core/reducers/view.reducer';
import {Observable, Subscription} from 'rxjs';
import {cloneDeep} from 'lodash-es';


@Component({
    selector: 'sm-redacted-arguments-dialog',
    templateUrl: './redacted-arguments-dialog.component.html',
    styleUrls: ['./redacted-arguments-dialog.component.scss'],
    standalone: false
})
export class RedactedArgumentsDialogComponent implements OnInit, OnDestroy {

  public redactedArguments: { key: string}[] = [];
  public redactedArguments$: Observable<{ key: string}[]>;
  private redactedArgumentsSub: Subscription;

  constructor(public dialogRef: MatDialogRef<RedactedArgumentsDialogComponent>, private store: Store) {
    this.redactedArguments$ = this.store.select(selectRedactedArguments);
  }

  ngOnInit(): void {
    this.redactedArgumentsSub = this.redactedArguments$.subscribe((redactedArguments) => {
      this.redactedArguments = cloneDeep(redactedArguments);
    });
  }

  applyChanges() {
    this.store.dispatch(setRedactedArguments({
      redactedArguments: this.redactedArguments.filter(value => !!value.key?.trim())
    }));
    this.dialogRef.close();
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.redactedArgumentsSub.unsubscribe();
  }
}
