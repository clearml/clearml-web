import {TIME_INTERVALS} from '@common/workers-and-queues/workers-and-queues.consts';
import {MetricsPlotEvent} from '~/business-logic/model/events/metricsPlotEvent';

export interface IOption {
  label: string;
  value: string;
}

export type TableSelectionState = 'All' | 'Partial' | 'None';

export const TIME_FORMAT_STRING = 'MMM d yyyy H:mm';

export const ICONS = {
  ALERT: 'al-ico-alert',
  CHART: 'al-ico-info-max',
  QUEUED: 'al-ico-manage-queue',
  RETRY: 'al-ico-retry',
  ENQUEUE: 'al-ico-enqueue',
  DEQUEUE: 'al-ico-dequeue',
  STOPPED: 'al-ico-abort',
  STOPPED_ALL: 'al-ico-abort-all',
  FAILED: 'al-ico-dialog-x',
  FALSE: 'al-ico-dialog-x',
  PUBLISHED: 'al-ico-publish',
  SHOW: 'al-ico-show',
  ARCHIVE: 'al-ico-archive',
  RESTORE: 'al-ico-restore',
  COMPARE: 'al-ico-compare',
  HIDE: 'al-ico-hide',
  LIST: 'al-ico-list-view',
  REMOVE: 'al-ico-trash',
  MOVE_TO: 'al-ico-move-to',
  PLUGIN: 'al-ico-plugin',
  ADD: 'fa-plus',
  TABLE: 'al-ico-table-view',
  DETAILS: 'al-ico-experiment-view',
  EDIT: 'al-ico-edit',
  RESET: 'al-ico-reset',
  CLONE: 'al-ico-clone',
  EXTEND: 'al-ico-extend',
  DOWNLOAD: 'al-ico-download',
  WORKER: 'al-ico-workers',
  TAG: 'al-ico-tag',
  SHARE: 'al-ico-shared-item',
  ARROW_DOWN: 'al-ico-ico-chevron-down',
  ARROW_UP: 'al-ico-ico-chevron-up',
  RUN: 'al-ico-run',
  METADATA: 'al-ico-metadata',
  ID: 'al-ico-id',
  CHECK: 'al-ico-success',
  PALETTE: 'al-ico-palette'
};

export type IconNames = keyof typeof ICONS;
export type IconsValues = typeof ICONS[keyof typeof ICONS];

export const PALLET = {
  blue25: '#f9fafb',
  blue50: '#f2f4fc', //242,244,252
  blue100: '#dce0ee', //220,224,238
  blue200: '#c3cdf0', //195,205,240
  blue250: '#A4ADCD',
  blue280: '#a7b2d8',
  blue300: '#8492c2', //132,146,19
  blue400: '#5a658e', //90,101,142
  blue450: '#657099',
  blue480: '#707ba3',
  blue500: '#384161', //56,65,97
  blue550: '#47527A',
  blue570: '#323a56',
  blue600: '#2c3246', //44,50,70
  blue650: '#24293c',
  blue700: '#202432', //32,36,50
  blue800: '#1a1e2c', //26,30,44
  blue900: '#141722', //20,23,34
  blue950: '#0d0e15', //20,23,34
};

export enum ThemeEnum {
  Dark = 'dark',
  Light = 'light'
}

export type MessageSeverityEnum = 'success' | 'error' | 'info' | 'warn';
export const MESSAGES_SEVERITY = {
  SUCCESS: 'success' as MessageSeverityEnum,
  ERROR: 'error' as MessageSeverityEnum,
  INFO: 'info' as MessageSeverityEnum,
  WARN: 'warn' as MessageSeverityEnum
};

export const rootProjectsPageSize = 50;

export const timeFrameOptions: IOption[] = [
  {label: '3 Hours', value: (3 * TIME_INTERVALS.HOUR).toString()},
  {label: '6 Hours', value: (6 * TIME_INTERVALS.HOUR).toString()},
  {label: '12 Hours', value: (12 * TIME_INTERVALS.HOUR).toString()},
  {label: '1 Day', value: (TIME_INTERVALS.DAY).toString()},
  {label: '1 Week', value: (TIME_INTERVALS.WEEK).toString()},
  {label: '1 Month', value: (TIME_INTERVALS.MONTH).toString()}
];

export type ReportsApiMultiplotsResponse = Record<string, Record<string, Record<string, Record<string, {
          name: string;
          plots: MetricsPlotEvent[];
        }>>>>;
