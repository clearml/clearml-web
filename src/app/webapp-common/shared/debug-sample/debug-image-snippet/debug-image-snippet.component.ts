import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {IsAudioPipe} from '../../pipes/is-audio.pipe';
import {IsVideoPipe} from '../../pipes/is-video.pipe';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '@common/constants';
import {isTextFileURL} from '@common/shared/utils/is-text-file';
import {getSignedUrlOrOrigin$} from '@common/core/reducers/common-auth-reducer';
import {selectBlockUserScript} from '@common/core/reducers/projects.reducer';
import {isHtmlOrText} from '@common/shared/utils/shared-utils';

// import {Event} from '@common/debug-images/debug-images-types';

@Component({
    selector: 'sm-debug-image-snippet',
    templateUrl: './debug-image-snippet.component.html',
    styleUrls: ['./debug-image-snippet.component.scss'],
    standalone: false
})
export class DebugImageSnippetComponent implements OnDestroy{
  public type: 'image' | 'player' | 'html';
  public source$: Observable<string>;
  private _frame: any;
  blockUserScripts = this.store.selectSignal(selectBlockUserScript);

  @Input() noHoverEffects: boolean;
  @Input() set frame(frame) {
    if (frame.url) {
      this.source$ = getSignedUrlOrOrigin$(frame.url, this.store).pipe(
        tap(signed => {
          if (new IsVideoPipe().transform(signed) ||
            new IsAudioPipe().transform(signed)) {
            this.type = 'player';
          } else if (isHtmlOrText(signed) || isTextFileURL(signed)) {
            this.type = 'html';
          } else {
            this.type = 'image';
          }
          this.isFailed = !signed?.startsWith('http');
        }));
    }
    this._frame = frame;
  }

  get frame() {
    return this._frame;
  }

  @Output() imageError = new EventEmitter();
  @Output() imageClicked = new EventEmitter<{src: string}>();
  @Output() createEmbedCode = new EventEmitter();
  @ViewChild('video') video: ElementRef<HTMLVideoElement>;
  @ViewChildren('imageElement') imageElements: QueryList<ElementRef<HTMLImageElement>>

  isFailed = false;
  isLoading = true;

  constructor(private store: Store) {
  }

  openInNewTab(source: string) {
    window.open(source, '_blank');
  }

  loadedMedia() {
    this.isLoading = false;
    if (this.video?.nativeElement?.videoHeight === 0) {
      this.video.nativeElement.poster = 'app/webapp-common/assets/icons/audio.svg';
    }
  }

  copyToClipboardSuccess(success: boolean) {
    this.store.dispatch(addMessage(
      success ? MESSAGES_SEVERITY.SUCCESS : MESSAGES_SEVERITY.ERROR,
      success ? 'Path copied to clipboard' : 'No path to copy'
    ));
  }

  iframeLoaded(event) {
    if (event.target.src) {
      this.isLoading = false;
    }
  }

  createEmbedCodeClicked($event: MouseEvent) {
    this.createEmbedCode.emit({x: $event.clientX, y: $event.clientY});
  }

  ngOnDestroy() {
    this.imageElements.forEach(imageRef => imageRef.nativeElement.src = '');
    if (this.video?.nativeElement) {
      this.video.nativeElement.src = '';
    }
  }
}
