import {Directive, Input, OnDestroy, TemplateRef, ViewContainerRef} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';
import {Subscription} from 'rxjs';
import {GetCurrentUserResponseUserObject} from '~/business-logic/model/users/getCurrentUserResponseUserObject';

@Directive({
  selector: '[smCheckPermission]',
  })
export class CheckPermissionDirective implements OnDestroy{
  private userDataSubscription: Subscription;
  private elseTemplateRef: TemplateRef<any>|null = null;
  private user: GetCurrentUserResponseUserObject;
  private blocked = true;

  @Input() set smCheckPermission(permission: boolean | string) {
    this.blocked = permission === false;
    this.setUpView();
  }

  @Input()
  set smCheckPermissionElse(templateRef: TemplateRef<any>|null) {
    this.elseTemplateRef = templateRef;
    this.setUpView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private store: Store<any>) {
    this.userDataSubscription = this.store.select(selectCurrentUser)
      .subscribe((user: GetCurrentUserResponseUserObject) => {
        this.user = user;
        this.setUpView();
      });
  }

  setUpView() {
    const allowed = !this.blocked && this.user && this.user.role !== 'guest';
    this.viewContainer.clear();
    if (allowed) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else if (this.elseTemplateRef) {
      this.viewContainer.createEmbeddedView(this.elseTemplateRef);
    }
  }

  ngOnDestroy(): void {
    this.userDataSubscription?.unsubscribe();
  }
}
