import {
  ColHeaderFilterTypeEnum,
  ColHeaderTypeEnum,
  ISmCol,
  TABLE_SORT_ORDER
} from '../ui-components/data/table/table.consts';
import {FilterMetadata} from 'primeng/api/filtermetadata';
import {SortMeta} from 'primeng/api';
import {hasValue} from './helpers.util';
import {MetricValueType} from '@common/experiments-compare/experiments-compare.constants';
import {sortCol} from '@common/shared/utils/sortCol';
import {TasksGetAllExRequestFilters} from '~/business-logic/model/tasks/tasksGetAllExRequestFilters';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';

export interface TableFilter {
  col?: string;
  value?: any;
  filterMatchMode?: string;
}

export interface MetricColumn {
  metricHash: string;
  variantHash: string;
  valueType: MetricValueType;
  metric: string;
  variant: string;
}

export const excludedKey = '__$not';

const metricVariantDelimiter = '\u203A';

export const MetricValueTypeStrings = {
  value: '(Last)',
  max_value: '(Max)',
  min_value: '(Min)'
};

export const getValueTypeName = (valueType: MetricValueType) => MetricValueTypeStrings[valueType] ?? valueType;

export const getTagsFilters = (tagsFilterAnd: boolean, tagsFilter: (string | null)[]): TasksGetAllExRequestFilters => {
  return {
    [tagsFilterAnd ? 'all' : 'any']: {
      include: tagsFilter.filter(tagI => tagI === null || !tagI.startsWith(excludedKey)),
      exclude: tagsFilter.filter(tagI => tagI?.startsWith(excludedKey)).map(tagItem => tagItem.substring(excludedKey.length))
    }
  };
};

export const encodeOrder = (orders: SortMeta[]): string[] => orders.map(order => `${order.order === TABLE_SORT_ORDER.DESC ? '-' : ''}${order.field}`);

export const decodeOrder = (orders: string[]): SortMeta[] => {
  if (typeof orders === 'string') {
    orders = [orders];
  }
  return orders.map(order => {
    if (order[0] === '-') {
      return {field: order.slice(1), order: -1} as SortMeta;
    } else {
      return {field: order, order: 1} as SortMeta;
    }
  });
};

export const encodeFilters = (filters: Record<string, FilterMetadata>) => {
  if (filters) {
    return Object.keys(filters)
      .filter((key: string) => filters[key].value?.length)
      .map((key: string) => {
        const val = filters[key] as FilterMetadata;
        return `${key}:${val.matchMode ? val.matchMode + ':' : ''}${encodeURIComponent(val?.value.join('+$+'))}`;
      }).join(',');
  }
  return null;
};

export const decodeFilter = (filters: string): TableFilter[] => {
  if (filters === '') {
    return [];
  }
  return filters.split(',').map((filter: string) => {
  let mode: string;
  const index = filter.indexOf(':AND');
  if (index > -1) {
    mode = 'AND';
    filter = filter.replace(':AND', '');
  }
  const [col, values] = filter.split(/:(.*)/);
  // if (parts.length === 3) {
  //   mode = parts[1];
  //   parts[1] = parts[2];
  // }
  return {col, filterMatchMode: mode, value: decodeURIComponent(values)?.split('+$+').map(x => x === '' ? null : x)};
})}

export const uniqueFilterValueAndExcluded = (arr1 = [], arr2 = []) => Array.from(new Set(arr1.concat((arr2).map(key => key ? key.replace(/^__\$not/, '') : key))));

const encodeMetric = (name) => encodeURIComponent(name).replaceAll('.', '%2e');

export const encodeColumns = (mainCols: ISmCol[] | any, hiddenCols = {}, metricsCols = [], colsOrder = []): string[] => {
  colsOrder = colsOrder.filter(col => !hiddenCols[col]);
  return mainCols
    .filter(col => !hiddenCols[col.id])
    .concat(metricsCols ? metricsCols : [])
    .sort((a, b) => sortCol(a.id, b.id, colsOrder))
    .map((col) => {
      if (col.metric_hash) {
        return `m.${col.metric_hash}.${col.variant_hash}.${col.valueType}.${encodeMetric(col.metricName)}.${encodeMetric(col.variantName)}`;
      }
      if (col.type === 'metadata') {
        return `meta.${col.key}`;
      } else if (col.type === 'hdmd') {
        return `hdmd.${col.key}`;
      } else {
        return col.id;
      }
    });
};

export const decodeColumns = (columns: string[], tableCols: ISmCol[]): [string[], MetricColumn[], string[], string[], string[]] => {
  const cols = [] as string[];
  const metrics = [] as MetricColumn[];
  const params = [] as string[];
  const allIds = [] as string[];
  const metadataCols = [] as string[];

  columns.forEach(col => {
    if (col.startsWith('m.')) {
      const colParts = col.split('.');
      const [, metricHash, variantHash, valueType, metric, variant] = colParts;
      metrics.push({
        metricHash,
        variantHash,
        valueType: valueType as MetricValueType,
        metric: decodeURIComponent(metric),
        variant: decodeURIComponent(variant)
      });
      allIds.push(`last_metrics.${colParts[1]}.${colParts[2]}.${colParts[3]}`);
    } else if (col.startsWith('hyperparams.') && !tableCols.find(tableCol => tableCol.id === col)) {
      // const colParts = col.split('.');
      // const param = colParts[1] + (colParts[2] ? `.${colParts[2]}` : '');
      params.push(col);
      allIds.push(col);
    } else if (col.startsWith('meta.') && !tableCols.find(tableCol => tableCol.id === col)) {
      const colParts = col.split('.');
      metadataCols.push(colParts[1]);
      allIds.push(colParts[1]);
    } else if (col.startsWith('hdmd.') && !tableCols.find(tableCol => tableCol.id === col)) {
      const colPart = col.replace('hdmd.', '');
      metadataCols.push(colPart);
      allIds.push(colPart);
    } else {
      cols.push(col);
      allIds.push(col);
    }
  });
  return [cols, metrics, params, metadataCols, allIds];
};


export const decodeHyperParam = (col: ISmCol): { name: string; section: string } => {
  const [section, ...name] = col.id.replace('hyperparams.', '').split('.');
  return {section, name: name.join('.')};
};

export const createMetricColumn = (column: MetricColumn, projectId: string): ISmCol => ({
  id: `last_metrics.${column.metricHash}.${column.variantHash}.${column.valueType || 'value'}`,
  headerType: ColHeaderTypeEnum.sortFilter,
  sortable: true,
  filterable: true,
  filterType: ColHeaderFilterTypeEnum.durationNumeric,
  header: `${column.metric} ${metricVariantDelimiter} ${column.variant}${getValueTypeName(column.valueType) ? ' ' + getValueTypeName(column.valueType) : ''}`,
  hidden: false,

  metric_hash: column.metricHash,
  variant_hash: column.variantHash,

  valueType: column.valueType,
  projectId,
  style: {width: '115px'},
  metricName: column.metric,
  variantName: column.variant
});

export const createCompareMetricColumn = (column: MetricVariantResult, hideList = []): Partial<ISmCol> => ({
  id: `last_metrics.${column.metric_hash}.${column.variant_hash}.value`,
  hidden: hideList.includes(`${column.metric} - ${column.variant}`)
});

export const createMetadataCol = (key, projectId): ISmCol => ({
  id: `metadata.${key}.value`,
  getter: `metadata.${key}.value`,
  key,
  headerType: ColHeaderTypeEnum.sortFilter,
  sortable: true,
  filterable: true,
  header: key,
  style: {width: '240px'},
  projectId,
  type: 'metadata'
});


export const createFiltersFromStore = (_tableFilters: Record<string, FilterMetadata>, removeEmptyValues = true) => {
  if (!_tableFilters) {
    return [];
  }
  return Object.keys(_tableFilters).reduce((returnTableFilters, currentFilterName) => {
    const value = _tableFilters?.[currentFilterName]?.value;
    if (removeEmptyValues && (!hasValue(value) || value?.length === 0)) {
      return returnTableFilters;
    }
    returnTableFilters[currentFilterName] = value;
    return returnTableFilters;
  }, {});
};

export const decodeURIComponentSafe = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    if (error.name === 'URIError') {
      return decodeURIComponent(value.replace(/%(?![0-9][0-9a-fA-F]+)/g, '%25'));
    } else {
      throw error;
    }
  }
};

export const convertFiltersToRecord = (filters: TableFilter[]
): Record<string, FilterMetadata> => {
  // Start with an empty object as the initial value for the accumulator.
  const initialValue: Record<string, FilterMetadata> = {};

  // Use reduce to transform the array into a single record object.
  return filters.reduce((accumulator, currentFilter) => {
    // Only process filters that have a 'col' property to use as a key.
    if (currentFilter.col) {
      accumulator[currentFilter.col] = {
        value: currentFilter.value,
        matchMode: currentFilter.filterMatchMode,
      };
    }
    // Return the updated accumulator for the next iteration.
    return accumulator;
  }, initialValue);
}
