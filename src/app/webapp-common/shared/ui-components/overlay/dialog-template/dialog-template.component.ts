import {booleanAttribute, Component, ElementRef, input, output, viewChild, inject } from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {CdkScrollableModule} from '@angular/cdk/scrolling';
import {SaferPipe} from '@common/shared/pipes/safe.pipe';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';

@Component({
    selector: 'sm-dialog-template',
    templateUrl: './dialog-template.component.html',
    styleUrls: ['./dialog-template.component.scss'],
    imports: [
        CdkScrollableModule,
        SaferPipe,
        MatIcon,
        MatIconButton
    ]
})
export class DialogTemplateComponent {
  private dialog = inject<MatDialogRef<DialogTemplateComponent>>(MatDialogRef<DialogTemplateComponent>);
  displayX = input(booleanAttribute(true), { transform: booleanAttribute });
  closeOnX = input(booleanAttribute(true), { transform: booleanAttribute });

  containerClass = input<string>();
  closedCodeLabel = input('VIEW COMMAND LINE');
  iconClass = input<string>(); // the icon class (see icons.scss).
  iconData = input<string>();
  header = input<string>();
  subHeader = input<string>();
  pageHeader = input<string>();
  headerClass = input<string>();
  xClicked = output();

  container = viewChild<ElementRef<HTMLDivElement>>('container');

  onXPressed() {
    if (this.closeOnX()) {
      this.dialog.close();
    }
    this.xClicked.emit();
  }
}

