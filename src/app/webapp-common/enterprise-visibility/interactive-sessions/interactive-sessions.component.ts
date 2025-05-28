import {Component} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {PageBaseComponent} from '@common/enterprise-visibility/page-base.component';
import {MatIcon} from '@angular/material/icon';

@Component({
    selector: 'sm-interactive-sessions',
    imports: [
        NgOptimizedImage,
        MatIcon
    ],
    templateUrl: './interactive-sessions.component.html',
    styleUrl: '../pages.scss'
})
export class InteractiveSessionsComponent extends PageBaseComponent {
}
