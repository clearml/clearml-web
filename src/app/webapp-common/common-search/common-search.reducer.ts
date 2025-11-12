import {createFeatureSelector, createReducer, createSelector, on} from '@ngrx/store';
import {initSearch, resetSearch, setSearching, setSearchQuery} from './common-search.actions';


export interface SearchState {
  isSearching: boolean;
  searchQuery: { query: string; regExp?: boolean; original?: string; advanced?: boolean };
  placeholder: string;
  active: boolean;
  initiated: boolean;
}

const searchInitState: SearchState = {
  isSearching: false,
  searchQuery: {query: '', regExp: false},
  placeholder: null,
  active: false,
  initiated: false
};

export const searchReducer = createReducer(
  searchInitState,
  on(setSearching, (state, {payload}): SearchState => ({...state, isSearching: payload})),
  on(setSearchQuery, (state, action): SearchState => ({...state, searchQuery: action})),
  on(initSearch, (state, action): SearchState => ({
    ...state,
    placeholder: action.payload || 'Search',
    initiated: true
  })),
  on(resetSearch, (): SearchState => ({...searchInitState, placeholder: 'Search'})),
);

export const selectCommonSearch = createFeatureSelector<SearchState>('commonSearch');
export const selectIsSearching = createSelector(selectCommonSearch, state => state.isSearching);
export const selectSearchQuery = createSelector(selectCommonSearch, state => state.searchQuery);
export const selectSearchQueryFilter = createSelector(selectSearchQuery, query => query?.query);
export const selectSearchQueryRegex = createSelector(selectSearchQuery, query => query?.regExp);
export const selectPlaceholder = createSelector(selectCommonSearch, state => state.placeholder);
export const selectActiveSearch = createSelector(selectSearchQueryFilter, filter => filter?.length >= 1);


