import {HeaderNavbarTabConfig} from '@common/layout/header-navbar-tabs/header-navbar-tabs-config.types';

export const PROJECTS_FEATURES = ['models',' experiments', 'overview'];

export const PROJECT_ROUTES = [
  {header: 'overview', id: 'overviewTab'},
  {header: 'tasks', id: 'experimentsTab'},
  {header: 'models', id: 'modelsTab'}
] as HeaderNavbarTabConfig[];
