import {Component, ElementRef, inject, Input, Output} from '@angular/core';
import {EventEmitter} from '@angular/core';
import {DebugSampleEvent, Iteration} from '@common/debug-images/debug-images-types';

@Component({
    selector: 'sm-debug-images-view',
    templateUrl: './debug-images-view.component.html',
    styleUrls: ['./debug-images-view.component.scss'],
    standalone: false
})
export class DebugImagesViewComponent {
  protected ref = inject<ElementRef<HTMLElement>>(ElementRef);

  public trackFrame = item => `${item?.key} ${item?.timestamp}`;

  @Input() experimentId;
  @Input() isMergeIterations;
  @Input() title;
  @Input() iterations: Iteration[];
  @Input() isDatasetVersionPreview = false;
  @Output() imageClicked = new EventEmitter();
  @Output() refreshClicked = new EventEmitter();
  @Output() createEmbedCode = new EventEmitter<{metrics?: string[]; variants?: string[]; domRect: {x: number; y: number}}>();
  @Output() urlError = new EventEmitter<{ frame: DebugSampleEvent; experimentId: string }>();

  public imageUrlError(data: { frame: DebugSampleEvent; experimentId: string }) {
    this.urlError.emit(data);
  }
}
