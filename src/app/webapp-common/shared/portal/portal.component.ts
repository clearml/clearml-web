import {
  Component, ViewChild, ApplicationRef, Injector,
  OnDestroy, AfterViewInit, Inject, ComponentFactoryResolver, EventEmitter, Output, Input
} from '@angular/core';
import {CdkPortal, DomPortalOutlet} from '@angular/cdk/portal';
import {DOCUMENT} from '@angular/common';
import {DialogModule} from '@angular/cdk/dialog';

@Component({
    selector: 'sm-portal',
    templateUrl: './portal.component.html',
    styleUrls: ['./portal.component.scss'],
    imports: [
        DialogModule
    ]
})
export class PortalComponent implements AfterViewInit, OnDestroy {
  @Input() outletId: string;

  @ViewChild(CdkPortal, { static: true }) portal: CdkPortal;

  host: DomPortalOutlet;

  @Output() buttonClicked: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private cfr: ComponentFactoryResolver,
    private appRef: ApplicationRef,
    private injector: Injector) {
  }

  ngAfterViewInit(): void {
    this.host = new DomPortalOutlet(
      this.document.getElementById(this.outletId),
      this.cfr, this.appRef, this.injector
    );

    this.host.attach(this.portal);
  }

  ngOnDestroy(): void {
    this.host.detach();
  }

}
