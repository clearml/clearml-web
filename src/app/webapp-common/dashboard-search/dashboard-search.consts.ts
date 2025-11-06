import {Params} from '@angular/router';
import {
  activeSearchLink,
  ActiveSearchLink,
  SearchTabsWithTable
} from '~/features/dashboard-search/dashboard-search.consts';
import {convertFiltersToRecord, decodeFilter, encodeFilters} from '@common/shared/utils/tableParamEncode';

export const SEARCH_PREFIX = '[SEARCH] ';
export const SEARCH_PAGE_SIZE = 8;

export const EXPERIMENT_SEARCH_ONLY_FIELDS = ['name', 'created', 'status', 'type', 'user.name', 'id', 'company', 'project.name', 'tags', 'last_change'];

export const convertToViewAllFilter = (qParams: Params, activeLink: ActiveSearchLink, userId: string): Params => {
  let filters = decodeFilter(qParams.gsfilter || '');
  if (activeLink === activeSearchLink.models) {
    filters = filters.map(filter =>
      filter.col === 'status' ? {
          col: 'ready',
          value: filter.value.map(status => String(status !== 'created')),
        }
        : filter
    );
  }
  const encodedFilters = encodeFilters(convertFiltersToRecord(filters));
  return {
    ...(qParams.gq && {q: qParams.gq}),
    ...(qParams.gqreg && {qreg: qParams.gqreg}),
    filter: encodedFilters,
  };
};

