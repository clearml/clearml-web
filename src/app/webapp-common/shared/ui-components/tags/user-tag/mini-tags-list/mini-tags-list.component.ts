import {Component, effect, input} from '@angular/core';
import {TagColorService} from '@common/shared/services/tag-color.service';
import {MiniTagComponent} from '@common/shared/ui-components/tags/user-tag/mini-tag/mini-tag.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {PushPipe} from '@ngrx/component';
import {Tag} from '../../tag-list/tag-list.component';

@Component({
    selector: 'sm-mini-tags-list',
    imports: [
        MiniTagComponent,
        TooltipDirective,
        PushPipe
    ],
    templateUrl: './mini-tags-list.component.html',
    styleUrl: './mini-tags-list.component.scss'
})
export class MiniTagsListComponent {
  tags = input<string[]>([]);
  public tagsList: Tag [] = []

  constructor(private colorService: TagColorService) {
    effect(() => {
      this.tagsList = this.tags()?.map((tag: string) => ({
        caption: tag,
        colorObservable: this.colorService.getColor(tag)
      }));
    });
  }
}
