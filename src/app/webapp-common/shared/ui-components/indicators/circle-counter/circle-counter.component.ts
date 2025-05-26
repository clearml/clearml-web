import {Component, Input} from '@angular/core';
import {CircleTypeEnum} from '~/shared/constants/non-common-consts';
import {NA} from '~/app.constants';
import {fileSizeConfigCount, FileSizePipe} from '@common/shared/pipes/filesize.pipe';



@Component({
    selector: 'sm-circle-counter',
    templateUrl: './circle-counter.component.html',
    styleUrls: ['./circle-counter.component.scss'],
    imports: [
        FileSizePipe
    ]
})
export class CircleCounterComponent {
  public valType: 'array' | 'number' | 'tags' | 'string';
  private _counter;
  public  NA = NA;
  @Input() set counter(val) { // number | string | {value: number | string; label: string}[];
    this._counter = val;
    this.valType = Array.isArray(val) ? 'array' : Number.isInteger(val) ? 'number' : 'string';
  }
  get counter() {
    return this._counter;
  }
  @Input() label: string;
  @Input() underLabel: string;
  @Input() type: CircleTypeEnum = CircleTypeEnum.empty;
  trackByLabel = (index, counter) => counter.label;

  public fileSizeConfigCount = {...fileSizeConfigCount, spacer: '', round: 1};
  public fileSizeConfigShortCount = {...fileSizeConfigCount, spacer: '', round: 0};
}
