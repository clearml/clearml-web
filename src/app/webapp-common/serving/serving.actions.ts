import {createActionGroup, emptyProps, props} from '@ngrx/store';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {SortMeta} from 'primeng/api';
import {TableFilter} from '@common/shared/utils/tableParamEncode';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {ServingGetEndpointDetailsResponse} from '~/business-logic/model/serving/servingGetEndpointDetailsResponse';
import {ServingGetEndpointMetricsHistoryRequest} from '~/business-logic/model/serving/servingGetEndpointMetricsHistoryRequest';
import MetricTypeEnum = ServingGetEndpointMetricsHistoryRequest.MetricTypeEnum;
import {EndpointStats} from '~/business-logic/model/serving/endpointStats';
import {ContainerInstanceStats} from '~/business-logic/model/serving/containerInstanceStats';
import {Topic} from '@common/shared/components/charts/line-chart/line-chart.component';


export type servingTableColFields =
  'selected'
  | 'id'
  | 'name'
  | 'tags'
  | 'model.name'
  | 'url'
  | 'uptime'
  | 'request_per_min'
  | 'latency'
  | 'parent.name'
  | 'PreprocessArtifact'
  | 'inputType'
  | 'inputSize'
  | 'instancesList'
  | 'instances'
  | 'totalRequests';

export const servingTableColFields = {
  id: 'id' as servingTableColFields,
  name: 'endpoint' as servingTableColFields,
  modelName: 'model' as servingTableColFields,
  endpointURL: 'url' as servingTableColFields,
  uptime: 'uptime_sec' as servingTableColFields,
  rpm: 'requests_min' as servingTableColFields,
  totalRequests: 'requests' as servingTableColFields,
  latency: 'latency_ms' as servingTableColFields,
  instances: 'instances' as servingTableColFields,
};

export type servingLoadingTableColFields =
  'id' | 'endpoint' | 'model' | 'url' | 'model_source' | 'model_version' | 'preprocess_artifact' | 'input_type' | 'input_size' | 'age_sec';

export const servingLoadingTableColFields = {
  id: 'id' as servingLoadingTableColFields,
  name: 'endpoint' as servingLoadingTableColFields,
  age: 'age_sec' as servingLoadingTableColFields,
  modelName: 'model' as servingLoadingTableColFields,
  endpointURL: 'url' as servingLoadingTableColFields,
  modelSource: 'model_source' as servingLoadingTableColFields,
  modelVersion: 'model_version' as servingLoadingTableColFields,
  preprocessArtifact: 'preprocess_artifact' as servingLoadingTableColFields,
  inputType: 'input_type' as servingLoadingTableColFields,
  inputSize: 'input_size' as servingLoadingTableColFields,
};

export const ServingActions = createActionGroup({
  source: 'serving',
  events: {
    'fetch serving endpoints': emptyProps(),
    'fetch loading endpoints': emptyProps(),
    'refresh endpoints': props<{ hideLoader: boolean; autoRefresh: boolean }>(),
    'refresh loading endpoints': props<{ hideLoader: boolean; autoRefresh: boolean }>(),
    'get next servingEndpoints': emptyProps(),
    'get next servingEndpoint with page size': props<{ pageSize: number }>(),
    'set serving endpoints': props<{ servingEndpoints: EndpointStats[] }>(),
    'set loading endpoints': props<{ servingEndpoints: EndpointStats[] }>(),
    'set serving endpoints in place': props<{ servingEndpoints: EndpointStats[] }>(),
    'set no more servingEndpoints': props<{ payload: boolean }>(),
    'toggle col hidden': props<{ columnId: string }>(),
    'set hidden cols': props<{ hiddenCols: Record<string, boolean> }>(),
    'get tags': emptyProps(),
    'set tags': props<{ tags: string[] }>(),
    'Add tag': props<{ tag: string[] }>(),
    'set cols order': props<{ cols: string[] }>(),
    'set loading cols order': props<{ cols: string[] }>(),
    'set extra columns': props<{ columns: any[] }>(),
    'add column': props<{ col: ISmCol }>(),
    'remove column': props<{ id: string }>(),
    'remove metric column': props<{ id: string }>(),
    'add servingEndpoints': props<{ servingEndpoints: EndpointStats[] }>(),
    'set selected servingEndpoints': props<{ servingEndpoints: EndpointStats[] }>(),
    'set selected servingEndpoint': props<{ endpoint: EndpointStats }>(),
    'set servingEndpoint details': props<{ endpoint: ServingGetEndpointDetailsResponse }>(),
    'table sort changed': props<{ isShift: boolean; colId: ISmCol['id'] }>(),
    'loading table sort changed': props<{ isShift: boolean; colId: ISmCol['id'] }>(),
    'set table sort': props<{ orders: SortMeta[] }>(),
    'set loading table sort': props<{ orders: SortMeta[] }>(),
    'table filters changed': props<{ filters: TableFilter[] }>(),
    'loading table filters changed': props<{ filters: TableFilter[] }>(),
    'get custom metrics': emptyProps(),
    'set table filters': props<{ filters: TableFilter[] }>(),
    'set loading table filters': props<{ filters: TableFilter[] }>(),
    'set column width': props<{ columnId: string; widthPx: number }>(),
    'set loading column width': props<{ columnId: string; widthPx: number }>(),
    'set column loading width': props<{ columnId: string; widthPx: number }>(),
    'update url params from state': emptyProps(),
    'update url params from loading state': emptyProps(),
    'servingEndpoint selection changed': props<{ servingEndpoint: EndpointStats }>(),
    'show selected only': props<{ active: boolean }>(),
    'global filter changed': props<{ query: string; regExp?: boolean }>(),
    'reset global filter': emptyProps(),
    'reset state': emptyProps(),
    // 'set current scrollId': props<{ scrollId: string }>(),
    'after set archive': emptyProps(),
    'set split size': props<{ splitSize: number }>(),
    'set table view mode': props<{ mode: 'info' | 'table' }>(),
    'set custom metrics': props<{ metrics: MetricVariantResult[] }>(),
    'get endpoint info': props<{ id: string }>(),
    'get endpoint': props<{ id: string; autoRefresh: boolean }>(),
    'refresh endpoint info': props<{ id: string }>(),
    'get stats': props<{ metricType: MetricTypeEnum; refresh?:boolean }>(),
    'set stats': props<{ data: Record<MetricTypeEnum, Topic[]> }>(),
    'set stats timeframe': props<{ timeFrame: string }>(),
    'show stats error notice': props<{ show: boolean }>(),
    'set chart hidden': props<{ hiddenList: MetricTypeEnum[] }>(),
    'get models source links': props<{ instances: ContainerInstanceStats[], insideModel: boolean }>(),
    'set models source links': props<{ modelsLinks: Record<string, string>[] }>(),
  }
});
