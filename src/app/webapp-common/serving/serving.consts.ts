import {ColHeaderFilterTypeEnum, ColHeaderTypeEnum, ISmCol} from '../shared/ui-components/data/table/table.consts';
import {servingLoadingTableColFields, servingTableColFields} from '@common/serving/serving.actions';
import {HeaderNavbarTabConfig} from '@common/layout/header-navbar-tabs/header-navbar-tabs-config.types';
import {EndpointStats} from '~/business-logic/model/serving/endpointStats';
import {FilterMetadata} from 'primeng/api/filtermetadata';
import {SortMeta} from 'primeng/api';
import {escapeRegExp, get, parseInt} from 'lodash-es';
import { ContainerInfo } from '~/business-logic/model/serving/containerInfo';

export const servingTableCols: ISmCol[] = [
  {
    id: servingTableColFields.name,
    headerType: ColHeaderTypeEnum.sortFilter,
    sortable: true,
    header: 'ENDPOINT',
    style: {width: '300px'}
  },
  {
    id: servingTableColFields.modelName,
    headerType: ColHeaderTypeEnum.sortFilter,
    filterable: true,
    searchableFilter: true,
    sortable: true,
    getter: 'model',
    header: 'MODEL',
    showInCardFilters: true,
    style: {width: '135px'}
  },
  {
    id: servingTableColFields.endpointURL,
    headerType: ColHeaderTypeEnum.sortFilter,
    sortable: true,
    header: 'URL',
    style: {width: '340px'}
  },
  {
    id: servingTableColFields.instances,
    headerType: ColHeaderTypeEnum.sortFilter,
    sortable: true,
    header: '# INSTANCES',
    style: {width: '150px'}
  },
  {
    id: servingTableColFields.uptime,
    headerType: ColHeaderTypeEnum.sortFilter,
    sortable: true,
    filterable: true,
    filterType: ColHeaderFilterTypeEnum.duration,
    header: 'UPTIME',
    style: {width: '240px'}
  },
  {
    id: servingTableColFields.totalRequests,
    headerType: ColHeaderTypeEnum.sortFilter,
    sortable: true,
    filterType: ColHeaderFilterTypeEnum.durationNumeric,
    filterable: true,
    header: '# REQUESTS',
    style: {width: '150px'}
  },
  {
    id: servingTableColFields.rpm,
    headerType: ColHeaderTypeEnum.sortFilter,
    sortable: true,
    filterable: true,
    filterType: ColHeaderFilterTypeEnum.durationNumeric,
    header: 'REQUEST / MIN (avg)',
    style: {width: '240px'}
  },
  {
    id: servingTableColFields.latency,
    headerType: ColHeaderTypeEnum.sortFilter,
    sortable: true,
    filterType: ColHeaderFilterTypeEnum.durationNumeric,
    filterable: true,
    header: 'LATENCY (avg)',
    style: {width: '150px'}
  }
];
export const servingLoadingTableCols: ISmCol[] = [
  {
    id: servingLoadingTableColFields.id,
    headerType: ColHeaderTypeEnum.sortFilter,
    sortable: true,
    header: 'INSTANCE ID',
    style: {width: '200px'}
  },
  {
    id: servingLoadingTableColFields.modelName,
    headerType: ColHeaderTypeEnum.sortFilter,
    filterable: true,
    searchableFilter: true,
    sortable: true,
    getter: 'model',
    header: 'MODEL',
    style: {width: '400px'}
  },
  {
    id: servingLoadingTableColFields.age,
    headerType: ColHeaderTypeEnum.sortFilter,
    sortable: true,
    filterable: true,
    filterType: ColHeaderFilterTypeEnum.duration,
    header: 'AGE',
    style: {width: '240px'}
  },
  {
    id: servingLoadingTableColFields.preprocessArtifact,
    headerType: ColHeaderTypeEnum.sortFilter,
    sortable: true,
    filterable: true,
    searchableFilter: true,
    header: 'PREPROCESS ARTIFACT',
    style: {width: '340px'}
  },
  {
    id: servingLoadingTableColFields.inputType,
    headerType: ColHeaderTypeEnum.sortFilter,
    sortable: true,
    filterable: true,
    searchableFilter: true,
    header: 'INPUT TYPE',
    style: {width: '250px'}
  },
  {
    id: servingLoadingTableColFields.inputSize,
    headerType: ColHeaderTypeEnum.sortFilter,
    sortable: true,
    filterable: true,
    filterType: ColHeaderFilterTypeEnum.durationNumeric,
    header: 'INPUT SIZE',
    style: {width: '340px'}
  }
];

const MiB                            = 1024 * 1024;
export const endpointsStatsParamInfo = {
  cpu_usage      : {title: 'CPU Usage', multiply: 1},
  gpu_usage      : {title: 'GPU Usage', multiply: 1},
  memory_used    : {title: 'Memory Used', multiply: MiB},
  gpu_memory_used: {title: 'GPU Memory', multiply: MiB},
  network_rx     : {title: 'Network Receive', multiply: MiB},
  network_tx     : {title: 'Network Transmit', multiply: MiB}
};

export const modelServingRoutes = [
  {header: 'ACTIVE', subHeader: '', link: 'endpoints/active'},
  {header: 'LOADING', subHeader: '', link: 'endpoints/loading'}
] as HeaderNavbarTabConfig[];

export function sortAndFilterEndpoints(endpoints: EndpointStats[] | ContainerInfo[], filters: Record<string, FilterMetadata>, sortFields: SortMeta[]): EndpointStats[] | ContainerInfo[] {
  if (endpoints === null) {
    return null;
  }
  let tempEndpoints = [...endpoints];
  Object.entries(filters).forEach(([key, filter]) => {
    tempEndpoints = tempEndpoints.filter(endpoint => {
      if (['model', 'input_type', 'preprocess_artifact'].includes(key)) { // Need a better rule for not range
        return filter.value.includes(endpoint[key]);
      } else {
        return parseInt(endpoint[key]) >= (filter.value[0] || -Infinity) && parseInt(endpoint[key]) <= (filter.value[1] || Infinity);
      }
    });
  });

  return tempEndpoints.sort((a, b) => {
    let res = 0;
    sortFields.some(sortField => {
      if (a[sortField.field] < b[sortField.field]) {
        res = -1 * sortField.order;
      }
      if (a[sortField.field] > b[sortField.field]) {
        res = sortField.order;
      }
      return res;
    });
    return res;
  });
}

export const filterEndpoints = (endpoints, sq ) => {
  let query = sq?.query.toLowerCase();
  try {
    if (!sq?.regExp) {
      query = escapeRegExp(query)
    }
    const exp = new RegExp(query, 'i');
    return endpoints?.filter(endpoint =>
      ['endpoint', 'model', 'id'].some(col => exp.test(get(endpoint, col) as unknown as string))
    );
  }
  catch {
    return endpoints;
  }
}
