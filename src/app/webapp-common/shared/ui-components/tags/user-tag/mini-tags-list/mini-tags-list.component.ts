import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {TagColorService} from '@common/shared/services/tag-color.service';
import {MiniTagComponent} from '@common/shared/ui-components/tags/user-tag/mini-tag/mini-tag.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {PushPipe} from '@ngrx/component';

@Component({
  selector: 'sm-mini-tags-list',
  templateUrl: './mini-tags-list.component.html',
  styleUrl: './mini-tags-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MiniTagComponent,
    TooltipDirective,
    PushPipe
  ],
})
export class MiniTagsListComponent {
  tags = input<string[]>([]);
  private colorService = inject(TagColorService);
  protected tagsList = computed(() => this.tags()?.map((tag: string) => ({
      caption: tag,
      colorObservable: this.colorService.getColor(tag)
    }))
  );
}
