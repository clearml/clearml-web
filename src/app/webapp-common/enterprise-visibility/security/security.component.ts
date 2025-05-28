import {Component} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {PageBaseComponent} from '@common/enterprise-visibility/page-base.component';
import {MatIcon} from '@angular/material/icon';

@Component({
    selector: 'sm-security',
    imports: [
        NgOptimizedImage,
        MatIcon
    ],
    templateUrl: './security.component.html',
    styleUrl: '../pages.scss'
})
export class SecurityComponent extends PageBaseComponent {
}
