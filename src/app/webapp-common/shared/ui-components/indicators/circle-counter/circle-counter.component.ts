import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {CircleTypeEnum} from '~/shared/constants/non-common-consts';
import {NA} from '~/app.constants';
import {fileSizeConfigCount, FileSizePipe} from '@common/shared/pipes/filesize.pipe';
import {Ng2FittextModule} from 'ng2-fittext';
import {IOption} from '@common/constants';



@Component({
  selector: 'sm-circle-counter',
  templateUrl: './circle-counter.component.html',
  styleUrls: ['./circle-counter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FileSizePipe,
    Ng2FittextModule
  ]
})
export class CircleCounterComponent {
  public  NA = NA;
  public fileSizeConfigCount = {...fileSizeConfigCount, spacer: '', round: 1};
  public fileSizeConfigShortCount = {...fileSizeConfigCount, spacer: '', round: 0};

  counter = input<number | IOption[] | string>();
  label = input<string>();
  underLabel= input<string>();
  type = input<CircleTypeEnum>(CircleTypeEnum.empty);
  protected valType = computed<'array' | 'number' | 'tags' | 'string'>(() => Array.isArray(this.counter()) ? 'array' : Number.isInteger(this.counter()) ? 'number' : 'string');
  trackByLabel = (index, counter) => counter.label;

}
