import {Component, input } from '@angular/core';

@Component({
  selector: 'sm-table-filter-duration-error',
  templateUrl: './table-filter-duration-error.component.html',
  styleUrls: ['./table-filter-duration-error.component.scss'],
})
export class TableFilterDurationErrorComponent {

  hasError = input<boolean>();
  fullWidth = input<boolean>();
}
