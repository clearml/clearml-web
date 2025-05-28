import {Component} from '@angular/core';
import {PageBaseComponent} from '@common/enterprise-visibility/page-base.component';
import {NgOptimizedImage} from '@angular/common';
import {MatIcon} from '@angular/material/icon';

@Component({
    selector: 'sm-data-management',
    imports: [
        NgOptimizedImage,
        MatIcon
    ],
    templateUrl: './data-management.component.html',
    styleUrl: '../pages.scss'
})
export class DataManagementComponent extends PageBaseComponent {
}
