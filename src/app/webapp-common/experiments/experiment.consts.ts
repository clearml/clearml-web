import {ColHeaderFilterTypeEnum, ColHeaderTypeEnum, ISmCol} from '../shared/ui-components/data/table/table.consts';
import {EXPERIMENTS_TABLE_COL_FIELDS} from '~/features/experiments/shared/experiments.const';
import {rootProjectsPageSize} from '@common/constants';

export const EXPERIMENTS_STORE_KEY = 'experiments';
export const EXPERIMENTS_PREFIX = 'EXPERIMENTS_';


export const INITIAL_EXPERIMENT_TABLE_COLS: ISmCol[] = [
  {
    id: EXPERIMENTS_TABLE_COL_FIELDS.SELECTED,
    sortable: false,
    filterable: false,
    headerType: ColHeaderTypeEnum.checkBox,
    header: '',
    hidden: false,
    bodyStyleClass: 'selected-col-body type-col',
    headerStyleClass: 'selected-col-header',
    style: {width: '70px'},
    disableDrag: true,
  },
  {
    id: EXPERIMENTS_TABLE_COL_FIELDS.ID,
    headerType: ColHeaderTypeEnum.title,
    header: 'ID',
    style: {width: '100px'},
  },
  {
    id: EXPERIMENTS_TABLE_COL_FIELDS.TYPE,
    headerType: ColHeaderTypeEnum.sortFilter,
    sortable: true,
    filterable: true,
    header: 'TYPE',
    bodyStyleClass: 'type-col',
    style: {width: '115px'},
    showInCardFilters: true
  },
  {
    id: EXPERIMENTS_TABLE_COL_FIELDS.NAME,
    headerType: ColHeaderTypeEnum.sortFilter,
    sortable: true,
    header: 'NAME',
    style: {width: '400px'},
  },
  {
    id: EXPERIMENTS_TABLE_COL_FIELDS.TAGS,
    getter: ['tags', 'system_tags'],
    headerType: ColHeaderTypeEnum.sortFilter,
    filterable: true,
    searchableFilter: true,
    paginatedFilterPageSize: 100,
    sortable: false,
    header: 'TAGS',
    style: {width: '300px'},
    excludeFilter: true,
    andFilter: true,
    columnExplain: 'Click to include tag. Click again to exclude.',
    showInCardFilters: true
  },
  {
    id: EXPERIMENTS_TABLE_COL_FIELDS.STATUS,
    headerType: ColHeaderTypeEnum.sortFilter,
    filterable: true,
    header: 'STATUS',
    style: {width: '130px', minWidth: '130px'},
    showInCardFilters: true
  },
  {
    id: EXPERIMENTS_TABLE_COL_FIELDS.PROJECT,
    headerType: ColHeaderTypeEnum.sortFilter,
    header: 'PROJECT',
    filterable: true,
    searchableFilter: true,
    asyncFilter: true,
    paginatedFilterPageSize: rootProjectsPageSize,
    sortable: false,
    style: {width: '150px'},
  },
  {
    id: EXPERIMENTS_TABLE_COL_FIELDS.USER,
    getter: 'user.name',
    headerType: ColHeaderTypeEnum.sortFilter,
    searchableFilter: true,
    filterable: true,
    sortable: false,
    header: 'USER',
    style: {width: '115px'},
    showInCardFilters: true
  },
  {
    id: EXPERIMENTS_TABLE_COL_FIELDS.STARTED,
    headerType: ColHeaderTypeEnum.sortFilter,
    sortable: true,
    filterType: ColHeaderFilterTypeEnum.durationDate,
    filterable: true,
    searchableFilter: false,
    header: 'STARTED',
    style: {width: '150px'},
  },
  {
    id: EXPERIMENTS_TABLE_COL_FIELDS.LAST_UPDATE,
    headerType: ColHeaderTypeEnum.sortFilter,
    sortable: true,
    filterType: ColHeaderFilterTypeEnum.durationDate,
    filterable: true,
    searchableFilter: false,
    header: 'UPDATED',
    label: 'Updated',
    style: {width: '150px'},
  },
  {
    id: EXPERIMENTS_TABLE_COL_FIELDS.LAST_ITERATION,
    headerType: ColHeaderTypeEnum.sortFilter,
    sortable: true,
    filterType: ColHeaderFilterTypeEnum.durationNumeric,
    filterable: true,
    searchableFilter: false,
    header: 'ITERATION',
    label: 'Iterations:',
    style: {width: '115px'},
  },
  {
    id: EXPERIMENTS_TABLE_COL_FIELDS.COMMENT,
    headerType: ColHeaderTypeEnum.sortFilter,
    sortable: true,
    header: 'DESCRIPTION',
    style: {width: '300px'}
  },
  {
    id: EXPERIMENTS_TABLE_COL_FIELDS.ACTIVE_DURATION,
    headerType: ColHeaderTypeEnum.sortFilter,
    sortable: true,
    filterable: true,
    filterType: ColHeaderFilterTypeEnum.duration,
    searchableFilter: false,
    bodyStyleClass: 'type-col',
    header: 'RUN TIME',
    style: {width: '150px'}
  },
  {
    id: EXPERIMENTS_TABLE_COL_FIELDS.PARENT,
    getter: [EXPERIMENTS_TABLE_COL_FIELDS.PARENT, 'parent.project.id', 'parent.project.name'],
    headerType: ColHeaderTypeEnum.sortFilter,
    searchableFilter: true,
    filterable: true,
    sortable: false,
    header: 'PARENT TASK',
    style: {width: '200px'},
    showInCardFilters: true,
    asyncFilter: true
  }
];

export const EXPERIMENT_INFO_ONLY_FIELDS_BASE = [
  'id',
  'name',
  'user.name',
  'company',
  'type',
  'status',
  'status_changed',
  'status_message',
  'status_reason',
  'comment',
  'created',
  'last_update',
  'last_change',
  'completed',
  'started',
  'parent.name',
  'parent.project.name',
  'project.name',
  'output',
  'hyperparams',
  'execution.queue.name',
  'execution.queue.display_name',
  'script.binary',
  'script.repository',
  'script.tag',
  'script.branch',
  'script.version_num',
  'script.entry_point',
  'script.working_dir',
  'script.requirements',
  'system_tags',
  'published',
  'last_iteration',
  'last_worker',
  'tags',
  'active_duration',
  'container',
  'runtime'
];

export const MINIMUM_ONLY_FIELDS = [
  'name', 'status', 'system_tags', 'project.name', 'company', 'last_change', 'last_update', 'started', 'last_iteration', 'tags',
  'user.name', 'runtime.progress'
];

export const ARTIFACTS_ONLY_FIELDS = [
  'name',
  'project.id',
  'execution.artifacts',
  'models.output.name',
  'models.output.model.name',
  'models.output.model.design',
  'models.output.model.uri',
  'models.output.model.framework',
  'models.output.model.created',
  'models.input.name',
  'models.input.model.name',
  'models.input.model.design',
  'models.input.model.uri',
  'models.input.model.framework',
  'models.input.model.created',
  'models.input.model.task.id',
  'models.input.model.task.name',
  'models.input.model.task.project.id',
];
export enum ActiveSectionEnum {
  'input-model' = 'input-model',
  'output-model' = 'output-model',
  'artifact' = 'artifact',
  'other' = 'other',
}
