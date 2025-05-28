import {Component} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {PageBaseComponent} from '@common/enterprise-visibility/page-base.component';
import {MatIcon} from '@angular/material/icon';

@Component({
    selector: 'sm-resource-management',
    imports: [
        NgOptimizedImage,
        MatIcon
    ],
    templateUrl: './resource-management.component.html',
    styleUrl: '../pages.scss'
})
export class ResourceManagementComponent extends PageBaseComponent {
}
