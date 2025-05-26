import {Component} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {PageBaseComponent} from '@common/enterprise-visibility/page-base.component';
import {MatIcon} from '@angular/material/icon';

@Component({
    selector: 'sm-genai',
    imports: [
        NgOptimizedImage,
        MatIcon
    ],
    templateUrl: './genai.component.html',
    styleUrl: '../pages.scss'
})
export class GenaiComponent extends PageBaseComponent {
}
