import {ChangeDetectionStrategy, Component, computed, inject, Signal} from '@angular/core';
import {NA} from '~/app.constants';
import {Store} from '@ngrx/store';
import {DurationPipe} from '@common/shared/pipes/duration.pipe';
import {servingFeature} from '@common/serving/serving.reducer';
import {trackByIndex} from '@common/shared/utils/forms-track-by';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {combineLatestWith, debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';
import {ServingActions} from '@common/serving/serving.actions';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {fileSizeConfigStorage, FileSizePipe} from '@common/shared/pipes/filesize.pipe';

@Component({
    selector: 'sm-serving-general-info',
    templateUrl: './serving-general-info.component.html',
    styleUrls: ['./serving-general-info.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ServingGeneralInfoComponent {
  private store = inject(Store);

  private duration = new DurationPipe();
  private fileSize = new FileSizePipe();
  endpoint = this.store.selectSignal(servingFeature.selectEndpointDetails);
  instancesLinks = this.store.selectSignal(servingFeature.selectInstancesLinks);
  lines = computed(() => this.endpoint()?.instances);

  kpis: Signal<{ label: string; value: string; downloadable?: boolean; href?: string; task?: string }[]> = computed(() => {
    if (this.endpoint()) {
      const modelUrl = this.endpoint().instances[0]?.reference.find(ref => ref.type === 'url');
      return [
        {label: 'ENDPOINT NAME', value: this.endpoint().endpoint || NA},
        {label: 'ENDPOINT URL', value: this.endpoint().url || NA, href: ''},
        {label: 'MODEL NAME', value: this.endpoint().model || NA, href: modelUrl?.value},
        {label: 'UPTIME', value: this.endpoint().uptime_sec ? (this.duration.transform(this.endpoint().uptime_sec)) : NA},
        {label: 'PREPROCESS ARTIFACT', value: this.endpoint().preprocess_artifact || NA},
        {label: 'INPUT TYPE', value: this.endpoint().input_type || NA},
        {label: 'INPUT SIZE', value: this.endpoint().input_size ? this.fileSize.transform(this.endpoint().input_size, fileSizeConfigStorage) : NA}
      ];
    } else {
      return [];
    }
  });

  columns: ISmCol[] = [
    {
      id: 'id',
      header: 'INSTANCE ID',
      key: '',
      bodyStyleClass: ''
    },
    {
      id: 'uptime_sec',
      header: 'UPTIME',
      key: '',
      style: {maxWidth: '360px'}
    },
    {
      id: 'requests',
      header: '# REQUESTS',
      key: ''
    }, {
      id: 'requests_min',
      header: 'REQUESTS/MIN',
      key: ''
    },
    {
      id: 'cpu_count',
      header: 'CPU COUNT',
      key: ''
    },
    {
      id: 'gpu_count',
      header: 'GPU COUNT',
      key: ''
    },
    {
      id: 'latency_ms',
      header: 'LATENCY',
      key: '',
      style: {maxWidth: '80px'}
    }
  ];
  public table: TableComponent<{ id: string }>;

  constructor() {
    this.store.select(selectRouterParams)
      .pipe(
        takeUntilDestroyed(),
        combineLatestWith(this.store.select(servingFeature.selectEndpoints)),
        debounceTime(150),
        filter(([params, endpoints]) => !!params?.endpointId && !!endpoints),
        map(([params]) => params?.endpointId),
        distinctUntilChanged()
      )
      .subscribe(id => this.store.dispatch(ServingActions.getEndpointInfo({id})));
  }

  protected readonly trackByIndex = trackByIndex;
}
