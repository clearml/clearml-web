import {
  Component, inject, afterNextRender, DestroyRef, input, viewChild,
  DOCUMENT
} from '@angular/core';

import {CdkPortal, DomPortalOutlet} from '@angular/cdk/portal';
import {DialogModule} from '@angular/cdk/dialog';


@Component({
  selector: 'sm-portal',
  template: `
    <ng-container *cdkPortal>
      <ng-content></ng-content>
    </ng-container>
  `,
  styleUrls: ['./portal.component.scss'],
  imports: [
    DialogModule
  ]
})
export class PortalComponent {
  private document = inject(DOCUMENT);
  private destroy = inject(DestroyRef);
  private host: DomPortalOutlet;

  outletId = input<string>();
  portal = viewChild(CdkPortal);


  constructor() {
    afterNextRender({
      read: () => {
        this.host = new DomPortalOutlet(this.document.getElementById(this.outletId()));
        this.host.attach(this.portal());
      }
    });

    this.destroy.onDestroy(() => {
      this.host.detach();
    });
  }
}
