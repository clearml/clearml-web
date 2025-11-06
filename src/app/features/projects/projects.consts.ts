import {HeaderNavbarTabConfig} from '@common/layout/header-navbar-tabs/header-navbar-tabs-config.types';

export const PROJECTS_FEATURES = ['models',' experiments', 'overview', 'workloads' ];

export const PROJECT_ROUTES = [
  {header: 'overview', id: 'overviewTab'},
  {header: 'workloads', id: 'workloadsTab'},
  {header: 'tasks', id: 'experimentsTab'},
  {header: 'models', id: 'modelsTab'}
] as HeaderNavbarTabConfig[];
