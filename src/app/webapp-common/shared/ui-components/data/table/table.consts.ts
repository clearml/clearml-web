export enum ColHeaderTypeEnum {
  sort = 'sort',
  sortFilter = 'sort-filter',
  checkBox = 'checkbox',
  title = 'none'
}

export enum ColHeaderFilterTypeEnum {
  duration = 'duration',         // days-hours-minutes
  durationNumeric = 'duration-numeric', // number
  durationDate = 'duration-date',    // DD-MM-YYYY hours:minutes
}

export type TableSortOrderEnum = 1 | -1;
export const TABLE_SORT_ORDER = {
  ASC: 1 as TableSortOrderEnum,
  DESC: -1 as TableSortOrderEnum,
};

declare type FilterMatchModeEnum = 'startsWith' | 'contains' | 'endsWidth' | 'equals' | 'notEquals' | 'in';


export interface ISmCol {
  id: string; // unique id, by default, will be use as the table data param (e.g name and data[name]).
  getter?: string | string[];
  header?: string; // the title header.
  label?: string; // Labels to show in cards mode..
  hidden?: boolean; // the column visibility.
  includeInDownload?: boolean;
  frozen?: boolean;
  alignFrozen?: 'right' | 'left';
  headerType?: ColHeaderTypeEnum;
  filterType?: ColHeaderFilterTypeEnum;
  sortable?: boolean; // determine if the column shell be sortable
  searchableFilter?: boolean;
  asyncFilter?: boolean; // adding filter change event emitter
  paginatedFilterPageSize?: number; // paginated filter active and its size (for noMoreOptions)
  filterable?: boolean; // determine if the column shell be filterable
  filterMatchMode?: FilterMatchModeEnum; // the filter method.
  style?: { width?: string; minWidth?: string; maxWidth?: string }; // the column style.
  headerStyleClass?: string; // the header css class name.
  bodyTemplateRef?: string; // redundant.
  bodyStyleClass?: string;
  disableDrag?: boolean; // Disable drag on this col
  disablePointerEvents?: boolean; // Disable pointer events for this col header (for selection col)
  metric_hash?: string;
  variant_hash?: string;
  metricName?: string;
  variantName?: string;
  isParam?: boolean;
  valueType?: string;
  projectId?: string;
  datasetId?: string;
  textCenter?: boolean;
  andFilter?: boolean;
  excludeFilter?: boolean;
  columnExplain?: string;
  key?: string;
  type?: string;
  showInCardFilters?: boolean;
  downloadKey?: string;
  infoTooltip?: string;
}
