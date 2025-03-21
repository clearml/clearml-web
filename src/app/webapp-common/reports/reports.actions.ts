import {createAction, props} from '@ngrx/store';
import {ReportsGetAllExResponse} from '~/business-logic/model/reports/reportsGetAllExResponse';
import {IReport} from './reports.consts';
import {IReportsCreateRequest} from '@common/reports/report-dialog/report-dialog.component';

export const REPORTS_PREFIX = 'REPORTS_';

export const createReport = createAction(
  REPORTS_PREFIX + 'CREATE_REPORT',
  props<{ reportsCreateRequest: IReportsCreateRequest }>()
);

export const resetReports = createAction(REPORTS_PREFIX + '[reset reports]');

export const getReports = createAction(
  REPORTS_PREFIX + '[get reports]',
  (loadMore = false) => ({loadMore})
);

export const getReportsTags = createAction(
  REPORTS_PREFIX + '[get reports tags]'
);
export const setReportsTags = createAction(
  REPORTS_PREFIX + '[set reports tags]',
  props<{ tags: string[] }>()
);

export const addReportsTags = createAction(
  REPORTS_PREFIX + '[add reports tags]',
  props<{ tags: string[] }>()
);

export const setReports = createAction(
  REPORTS_PREFIX + '[set reports]',
  props<{ reports: IReport[]; scroll: ReportsGetAllExResponse['scroll_id']; noMoreReports: boolean }>()
);

export const addReports = createAction(
  REPORTS_PREFIX + '[add reports]',
  props<{ reports: IReport[]; scroll: ReportsGetAllExResponse['scroll_id']; noMoreReports: boolean }>()
);

export const getReport = createAction(
  REPORTS_PREFIX + '[get report]',
  props<{ id: string }>()
);

export const setReport = createAction(
  REPORTS_PREFIX + '[set report]',
  props<{ report: IReport }>()
);

export const deleteReport = createAction(
  REPORTS_PREFIX + '[delete report]',
  props<{ report: IReport }>()
);


export const updateReport = createAction(
  REPORTS_PREFIX + '[update report]',
  props<{ id: string; changes: Partial<IReport>; refresh?: boolean }>()
);

export const moveReport = createAction(
  REPORTS_PREFIX + '[move report]',
  props<{ report: IReport }>()
);

export const navigateToProjectAfterMove = createAction(
  REPORTS_PREFIX + '[navigateToProjectAfterMove]',
  props<{ projectId: string }>()
);


export const publishReport = createAction(
  REPORTS_PREFIX + '[publish report]',
  props<{ id: string }>()
);

export const removeReport = createAction(
  REPORTS_PREFIX + '[remove report]',
  props<{ id: string }>()
);

export const setReportChanges = createAction(
  REPORTS_PREFIX + '[set report changes]',
  props<{ id: string; changes: Partial<IReport>; filterOut?: boolean}>()
);

export const setArchive = createAction(
  REPORTS_PREFIX + '[set archive view]',
  props<{ archive: boolean }>()
);

export const archiveReport = createAction(
  REPORTS_PREFIX + '[archive report]',
  props<{ report: IReport; skipUndo?: boolean }>()
);

export const restoreReport = createAction(
  REPORTS_PREFIX + '[restore report]',
  props<{ report: IReport; skipUndo?: boolean }>()
);
export const setReportsOrderBy = createAction(
  REPORTS_PREFIX + 'SET_ORDER_BY',
  props<{ orderBy: string }>()
);

export const setReportsSearchQuery = createAction(
  REPORTS_PREFIX + 'SET_SEARCH_QUERY',
  props<{ query: string; regExp?: boolean }>()
);

export const deleteResource = createAction(
  REPORTS_PREFIX + 'DELETE_RESOURCE',
  props<{resource: string}>()
);

export const setEditMode = createAction(
  REPORTS_PREFIX + 'Set Edit Mode',
  props<{editing: boolean}>()
);

export const setDirty = createAction(
  REPORTS_PREFIX + 'Set Dirty',
  props<{dirty: boolean}>()
);
