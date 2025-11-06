import {createAction, props} from '@ngrx/store';
import {Project} from '~/business-logic/model/projects/project';
import {ProjectsUpdateRequest} from '~/business-logic/model/projects/projectsUpdateRequest';
import {ModelsPublishManyResponse} from '~/business-logic/model/models/modelsPublishManyResponse';
import {ModelsArchiveManyResponse} from '~/business-logic/model/models/modelsArchiveManyResponse';
import {ModelsDeleteManyResponse} from '~/business-logic/model/models/modelsDeleteManyResponse';
import {archiveSelectedModels} from '@common/models/actions/models-menu.actions';
import {TasksResetManyResponse} from '~/business-logic/model/tasks/tasksResetManyResponse';
import {TasksEnqueueManyResponse} from '~/business-logic/model/tasks/tasksEnqueueManyResponse';
import {TasksArchiveManyResponse} from '~/business-logic/model/tasks/tasksArchiveManyResponse';
import {TasksPublishManyResponse} from '~/business-logic/model/tasks/tasksPublishManyResponse';
import {TasksStopManyResponse} from '~/business-logic/model/tasks/tasksStopManyResponse';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {ScatterPlotPoint} from '@common/core/reducers/projects.reducer';
import {User} from '~/business-logic/model/users/user';
import {ProjectsGetAllResponseSingle} from '~/business-logic/model/projects/projectsGetAllResponseSingle';
import {IBreadcrumbsLink, IBreadcrumbsOptions} from '@common/layout/breadcrumbs/breadcrumbs.component';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {ProjectsGetUserNamesRequest} from '~/business-logic/model/projects/projectsGetUserNamesRequest';

export const PROJECTS_PREFIX = '[ROOT_PROJECTS] ';

export interface TagColor {
  foreground: string;
  background: string;
}

export const getAllSystemProjects = createAction(
  PROJECTS_PREFIX + 'GET_PROJECTS'
);

export const updateProject = createAction(
  PROJECTS_PREFIX + 'UPDATE_PROJECT',
  props<{ id: string; changes: Partial<ProjectsUpdateRequest> }>()
);

export const resetProjects = createAction(PROJECTS_PREFIX + 'RESET_PROJECTS');
export const refetchProjects = createAction(PROJECTS_PREFIX + 'REFETCH_PROJECTS');

export const setLastUpdate = createAction(
  PROJECTS_PREFIX + 'SET_LAST_UPDATE',
  props<{ lastUpdate: string }>());

export const setRootProjectsIsReady = createAction(
  PROJECTS_PREFIX + 'SET_ROOT_PROJECTS_READY',
  props<{ ready: boolean }>());

export const updateProjectCompleted = createAction(
  PROJECTS_PREFIX + 'UPDATE_PROJECT_COMPLETED',
  props<{ id: string; changes: Partial<Project> }>()
);

export const setSelectedProjectId = createAction(
  PROJECTS_PREFIX + 'SET_SELECTED_PROJECT_ID',
  props<{ projectId: string; example?: boolean }>()
);
export const setSelectedProject = createAction(
  PROJECTS_PREFIX + 'SET_SELECTED_PROJECT',
  props<{ project: Project }>()
);

export const setSelectedProjectSimple = createAction(
  PROJECTS_PREFIX + 'SET_SELECTED_PROJECT_SIMPLE',
  props<{ project: Project }>()
);

export const setProjectAncestors = createAction(
  PROJECTS_PREFIX + 'SET_PROJECT_ANCESTORS',
  props<{ projects: Project[] }>()
);

export const setSelectedProjectStats = createAction(
  PROJECTS_PREFIX + '[set selected project statistics]',
  props<{ project: Project }>()
);

export const resetSelectedProject = createAction(
  PROJECTS_PREFIX + 'RESET_SELECTED_PROJECT'
);

export const resetProjectSelection = createAction(
  PROJECTS_PREFIX + 'RESET_PROJECT_SELECTION'
);

export const setArchive = createAction(
  PROJECTS_PREFIX + 'SET_ARCHIVE',
  props<{ archive: boolean }>()
);

export const setDeep = createAction(
  PROJECTS_PREFIX + 'SET_DEEP',
  props<{ deep: boolean }>()
);

export const getTags = createAction(
  PROJECTS_PREFIX + 'get tags',
  (project = null) => ({projectId: project})
);

export const getCompanyTags = createAction(
  PROJECTS_PREFIX + 'get company tags'
);

export const getProjectsTags = createAction(
  PROJECTS_PREFIX + 'get projects tags',
  props<{ entity: string }>()
);

export const setTagsFilterByProject = createAction(
  PROJECTS_PREFIX + 'set tags filter by project',
  props<{ tagsFilterByProject: boolean }>()
);

export const setTags = createAction(
  PROJECTS_PREFIX + 'set tags',
  props<{ tags: string[] }>()
);

export const setCompanyTags = createAction(
  PROJECTS_PREFIX + 'set company tags',
  props<{ tags: string[]; systemTags: string[] }>()
);

export const addCompanyTag = createAction(
  PROJECTS_PREFIX + 'add company tag',
  props<{tag: string}>()
);

export const setMainPageTagsFilter = createAction(
  PROJECTS_PREFIX + 'set main page tags filters',
  props<{ tags?: string[]; feature: string}>()
);

export const setMainPageUsersFilter = createAction(
  PROJECTS_PREFIX + 'set main page users filters',
  props<{ users?: string[]; feature: string}>()
);

export const setMainPageTagsFilterMatchMode = createAction(
  PROJECTS_PREFIX + 'set main page tags filters match mode',
  props<{ matchMode: string; feature: string}>()
);

export const addProjectTags = createAction(
  PROJECTS_PREFIX + 'add all projects tags',
  props<{ tags: string[]; systemTags: string[] }>()
);

export const openTagColorsMenu = createAction(
  PROJECTS_PREFIX + 'open tag colors',
  props<{ tags: string[] }>()
);

export const setTagColors = createAction(
  PROJECTS_PREFIX + 'set tag colors',
  props<{ tag: string; colors: TagColor }>()
);

export const openMoreInfoPopup = createAction(
  PROJECTS_PREFIX + 'open more info popup',
  props<{
    parentAction: ReturnType<typeof archiveSelectedModels>;
    operationName: string;
    entityType: EntityTypeEnum;
    res: ModelsPublishManyResponse | ModelsArchiveManyResponse | ModelsDeleteManyResponse | TasksResetManyResponse | TasksEnqueueManyResponse | TasksArchiveManyResponse | TasksPublishManyResponse | TasksStopManyResponse
  }>()
);

export const setMetricVariant = createAction(
  PROJECTS_PREFIX + 'set selected metric variant for graph',
  props<{ projectId: string; cols: ISmCol[] }>()
);
export const fetchGraphData = createAction(PROJECTS_PREFIX + 'fetch stats for project graph');

export const toggleState = createAction(
  PROJECTS_PREFIX + 'toggle state',
  props<{ state: string }>()
);

export const setGraphData = createAction(
  PROJECTS_PREFIX + 'set project stats',
  props<{ stats: ScatterPlotPoint[] }>()
);

export const getProjectUsers = createAction(
  PROJECTS_PREFIX + 'get current project users',
  props<{ projectId: string; entity?: ProjectsGetUserNamesRequest.EntityEnum }>()
);
export const setProjectUsers = createAction(
  PROJECTS_PREFIX + 'set current project users',
  props<{ users: User[] }>()
);
export const setAllProjectUsers = createAction(
  PROJECTS_PREFIX + 'set all projects users',
  props<{ users: User[] }>()
);
export const setProjectExtraUsers = createAction(
  PROJECTS_PREFIX + 'set extra users',
  props<{ users: User[] }>()
);
export const getFilteredUsers = createAction(
  PROJECTS_PREFIX + 'GET_FILTERED_USERS',
  props<{ filteredUsers: string[] }>()
);
export const setShowHidden = createAction(
  PROJECTS_PREFIX + 'set show hidden',
  props<{ show: boolean }>()
);

export const setHideExamples = createAction(
  PROJECTS_PREFIX + 'set hide examples]',
  props<{ hide: boolean }>()
);
export const setBlockUserScript = createAction(
  PROJECTS_PREFIX + 'set block users scripts]',
  props<{ block: boolean }>()
);
export const setDefaultNestedModeForFeature = createAction(
  PROJECTS_PREFIX + 'set defaultNestedModeForFeature',
  props<{ feature: string; isNested: boolean }>()
);
export const setSelectedBreadcrumbSubFeature = createAction(
  PROJECTS_PREFIX + 'set SelectedSubFeature',
  props<{ breadcrumb: IBreadcrumbsLink }>()
);

export const setBreadcrumbMainFeature = createAction(
  PROJECTS_PREFIX + 'setBreadcrumbMainFeature',
  props<{ breadcrumb: IBreadcrumbsLink }>()
);

export const setBreadcrumbsOptions = createAction(
  PROJECTS_PREFIX + 'setBreadcrumbsOptions',
  props<{ breadcrumbOptions: IBreadcrumbsOptions }>()
);

export const resetTablesFilterProjectsOptions = createAction(
  PROJECTS_PREFIX + 'reset tables filter projects options'
);

export const getTablesFilterProjectsOptions = createAction(
  PROJECTS_PREFIX + 'get tables filter projects options',
  props<{ searchString: string; loadMore: boolean; allowPublic?: boolean}>()
);

export const setTablesFilterProjectsOptions = createAction(
  PROJECTS_PREFIX + 'set tables filter projects options',
  props<{ projects: Partial<ProjectsGetAllResponseSingle>[]; scrollId: string; loadMore?: boolean }>()
);

export const downloadForGetAll = createAction(
  PROJECTS_PREFIX + 'downloadForGetAll',
  props<{ prepareId: string}>()
);
