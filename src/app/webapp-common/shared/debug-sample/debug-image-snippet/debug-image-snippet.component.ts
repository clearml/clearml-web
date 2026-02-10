import {
  Component,
  ElementRef, inject,
  OnDestroy, signal, input, output, viewChild, viewChildren, computed
} from '@angular/core';
import {Store} from '@ngrx/store';
import {switchMap} from 'rxjs/operators';
import {IsAudioPipe} from '../../pipes/is-audio.pipe';
import {IsVideoPipe} from '../../pipes/is-video.pipe';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '@common/constants';
import {isTextFileURL} from '@common/shared/utils/is-text-file';
import {getSignedUrlOrOrigin$} from '@common/core/reducers/common-auth-reducer';
import {selectBlockUserScript} from '@common/core/reducers/projects.reducer';
import {isHtmlOrText} from '@common/shared/utils/shared-utils';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {DebugSampleEvent} from '@common/debug-images/debug-images-types';
import {SnippetErrorComponent} from '@common/shared/ui-components/indicators/snippet-error/snippet-error.component';
import {ClipboardModule} from 'ngx-clipboard';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {SafePipe} from '@common/shared/pipes/safe.pipe';
import {AsyncPipe} from '@angular/common';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';

// import {Event} from '@common/debug-images/debug-images-types';

@Component({
  selector: 'sm-debug-image-snippet',
  templateUrl: './debug-image-snippet.component.html',
  styleUrls: ['./debug-image-snippet.component.scss'],
  imports: [
    SnippetErrorComponent,
    ClipboardModule,
    TooltipDirective,
    SafePipe,
    AsyncPipe,
    ShowTooltipIfEllipsisDirective
  ]
})
export class DebugImageSnippetComponent implements OnDestroy{
  private store = inject(Store);

  loadError = signal(false);
  loading = signal(true);

  noHoverEffects = input<boolean>();
  frame = input<DebugSampleEvent>();
  frame$ = toObservable(this.frame);
  protected source$ = this.frame$
    .pipe(
      switchMap(frame => {
        return getSignedUrlOrOrigin$(frame.url, this.store)
      })
    );

  protected type= computed(() => {
    const url = this.frame().url;
    if (new IsVideoPipe().transform(url) ||
      new IsAudioPipe().transform(url)) {
      return 'player';
    } else if (isHtmlOrText(url) || isTextFileURL(url)) {
      return 'html';
    } else {
      return 'image';
    }
  });

  imageError = output();
  imageClicked = output<{
        src: string;
    }>();
  createEmbedCode = output<{x: number; y: number}>();
  video = viewChild<ElementRef<HTMLVideoElement>>('video');
  imageElements = viewChildren<ElementRef<HTMLImageElement>>('imageElement');

  blockUserScripts = this.store.selectSignal(selectBlockUserScript);

  constructor() {
    this.source$
      .pipe(takeUntilDestroyed())
        .subscribe(signed => {
      this.loadError.set(!signed?.startsWith('http'));
    })
  }
  openInNewTab(source: string) {
    window.open(source, '_blank');
  }

  loadedMedia() {
    this.loading.set(false);
    this.loadError.set(false);
    if (this.video()?.nativeElement?.videoHeight === 0) {
      this.video().nativeElement.poster = 'app/webapp-common/assets/icons/audio.svg';
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
      this.loading.set(false);
    }
  }

  createEmbedCodeClicked($event: MouseEvent) {
    this.createEmbedCode.emit({x: $event.clientX, y: $event.clientY});
  }

  ngOnDestroy() {
    this.imageElements().forEach(imageRef => imageRef.nativeElement.src = '');
    if (this.video()?.nativeElement) {
      this.video().nativeElement.src = '';
    }
  }

  mediaError($event: ErrorEvent) {
    this.imageError.emit();
    this.loadError.set(true);
  }
}
