import {SmApiRequestsService} from './api-services/api-requests.service';
import {BlTasksService} from './services/tasks.service';
import {BlModelsService} from './services/models.service';
import {ApiTasksService} from './api-services/tasks.service';
import {ApiQueuesService} from './api-services/queues.service';
import {ApiWorkersService} from './api-services/workers.service';
import {ApiAuthService} from './api-services/auth.service';
import {ApiModelsService} from './api-services/models.service';
import {ApiEventsService} from './api-services/events.service';
import {ApiProjectsService} from './api-services/projects.service';
import {ApiUsersService} from './api-services/users.service';
import {ApiServerService} from './api-services/server.service';
import {ApiOrganizationService} from './api-services/organization.service';
import {ApiLoginService} from './api-services/login.service';
import {ApiPipelinesService} from './api-services/pipelines.service';
import {ApiReportsService} from './api-services/reports.service';
import {ApiServingService} from './api-services/serving.service';
import {ApiStorageService} from './api-services/storage.service';

export const businessLogicProviders = [
  SmApiRequestsService,
  BlTasksService,
  BlModelsService,
  ApiTasksService,
  ApiQueuesService,
  ApiWorkersService,
  ApiAuthService,
  ApiModelsService,
  ApiEventsService,
  ApiProjectsService,
  ApiUsersService,
  ApiServerService,
  ApiOrganizationService,
  ApiLoginService,
  ApiPipelinesService,
  ApiReportsService,
  ApiServingService,
  ApiStorageService
];
