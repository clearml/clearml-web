import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  Renderer2,
  ViewChild
} from '@angular/core';
import {MatIcon} from '@angular/material/icon';

@Component({
    selector: 'al-drawer',
    templateUrl: './drawer.component.html',
    styleUrls: ['./drawer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatIcon
    ]
})
export class DrawerComponent {

  public closed              = false;

  @Input() label          = '';
  @Input() displayOnHover = false;
  @Output() toggled = new EventEmitter<boolean>();

  @ViewChild('drawerContainer', { static: true }) drawerContainer: ElementRef;
  @ViewChild('fixedWidth', { static: true }) fixedWidth: ElementRef;
  @ViewChild('closedLabel', { static: true }) closedLabel: ElementRef;

  constructor(private renderer: Renderer2, private ref: ElementRef) {
  }

  toggleDrawer() {
    if (!this.closed) {
      // 30px padding for 15px padding for label text
      this.renderer.setStyle(this.closedLabel.nativeElement, 'max-height', this.drawerContainer.nativeElement.clientHeight - 30 + 'px');
      this.renderer.addClass(this.ref.nativeElement, 'collapsed');
    } else {
      this.renderer.removeStyle(this.closedLabel.nativeElement, 'max-height');
      this.renderer.removeClass(this.ref.nativeElement, 'collapsed');
    }
    this.closed = !this.closed;
    window.setTimeout(() => this.toggled.emit(!this.closed), 330);
  }
}
