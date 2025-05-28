import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {ScrollEndDirective} from '@common/shared/ui-components/directives/scroll-end.directive';

@Component({
    selector: 'sm-dots-load-more',
    imports: [
        ScrollEndDirective
    ],
    templateUrl: './dots-load-more.component.html',
    styleUrl: './dots-load-more.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DotsLoadMoreComponent {
  @Input() loading: boolean;
  @Output() loadMore= new EventEmitter();
}
