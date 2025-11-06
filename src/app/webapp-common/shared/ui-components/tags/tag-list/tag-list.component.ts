import {ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, output, signal} from '@angular/core';
import {TagColorService} from '../../../services/tag-color.service';
import {Observable} from 'rxjs';
import {UserTagComponent} from '@common/shared/ui-components/tags/user-tag/user-tag.component';
import {PushPipe} from '@ngrx/component';
import {injectResize} from 'ngxtension/resize';
import {toSignal} from '@angular/core/rxjs-interop';

export interface Tag {
  caption: string;
  colorObservable: Observable<{
    background: string;
    foreground: string;
  }>;
}

@Component({
  selector: 'sm-tag-list',
  templateUrl: './tag-list.component.html',
  styleUrls: ['./tag-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UserTagComponent,
    PushPipe,
  ],
})
export class TagListComponent {
  private colorService = inject(TagColorService);
  private ref = inject(ElementRef<HTMLElement>);
  private resize$ = injectResize();
  protected disableRemove = signal<string>(null);
  public er: number;

  tags = input([] as string[]);
  sysTags = input([] as string[]);
  tooltip = input<boolean>(false);
  readonly = input<boolean>(false);
  empty = input<boolean>(false);
  showAddTagOnlyOnHover = input<boolean>(true);
  showAddTag = input<boolean>(true);
  remove = output<string>();
  add = output<MouseEvent>();

  resize = toSignal(this.resize$);
  tagsList = computed(() => this.tags()?.map((tag: string) => ({caption: tag, colorObservable: this.colorService.getColor(tag)})));
  maxTagHover = computed(() => {
    if (this.tagsList() && this.resize() !== undefined) {
      return this.resize()?.width - (this.tagsList().length - 1) * 24 - 80 * ((this.add as any).listeners ? 1 : 0);
    }
    return this.ref.nativeElement.getBoundingClientRect().width;
  })

  removeTag(tag: string) {
    this.remove.emit(tag);
    this.disableRemove.set(tag);

    window.setTimeout(() => {
      this.disableRemove.set(null);
    }, 1000);
  }
}
