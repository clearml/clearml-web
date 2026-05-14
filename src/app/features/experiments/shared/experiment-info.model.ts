import {Task} from '../../../business-logic/model/tasks/task';
import {Model} from '../../../business-logic/model/models/model';
import {User} from '../../../business-logic/model/users/user';
import {TaskTypeEnum} from '../../../business-logic/model/tasks/taskTypeEnum';
import {TaskStatusEnum} from '../../../business-logic/model/tasks/taskStatusEnum';
import {Project} from '../../../business-logic/model/projects/project';
import {Script} from '../../../business-logic/model/tasks/script';
import {IExecutionForm} from './experiment-execution.model';
import {IHyperParamsForm} from '../../../webapp-common/experiments/shared/experiment-hyper-params.model';
import {Artifact} from '../../../business-logic/model/tasks/artifact';
import {
  IExperimentModelInfo,
  IModelInfo
} from '../../../webapp-common/experiments/shared/common-experiment-model.model';
import {ParamsItem} from '../../../business-logic/model/tasks/paramsItem';
import {ConfigurationItem} from '../../../business-logic/model/tasks/configurationItem';
import {GetCurrentUserResponseUserObjectCompany} from '../../../business-logic/model/users/getCurrentUserResponseUserObjectCompany';
import {Queue} from '../../../business-logic/model/queues/queue';
import {Container} from '../../../business-logic/model/tasks/container';
import {Output} from '~/business-logic/model/tasks/output';

/**
 * an extended object of task that includes projection, will come from the server as an api response.
 */
export interface ISelectedExperiment {
  id: string;
  name?: string;
  user?: User;
  company?: GetCurrentUserResponseUserObjectCompany;
  type?: TaskTypeEnum;
  status?: TaskStatusEnum;
  comment?: string;
  created?: string;
  completed?: string;
  started?: string;
  last_update?: string | Date;
  parent?: {id: string; name: string; project?: {id: string}};
  active_duration?: number;
  project?: Project;
  input?: any; // TODO: fix projection...
  output?: ISelectedExperimentOutput;
  execution?: ISelectedExperimentExecution;
  script?: Script;
  tags?: Array<string>;
  system_tags?: Array<string>;
  published?: Task['published'];
  status_changed?: string;
  status_message?: string;
  status_reason?: string;
  last_iteration?: number;
  last_worker?: string;
  hyperparams?: { [section: string]: { [key: string]: ParamsItem } };
  configuration?: { [key: string]: ConfigurationItem };
  currentUser?: any;
  models?: {input: {name: string; model: IModelInfo}[]; output: {name: string; model: IModelInfo}[]};
  runtime?: Record<string, string>;
}

/**
 * an object that will transfrom from the ISelectedExperiment response to more comfortable object to display.
 */
export interface IExperimentInfo extends Omit<Task, 'id' | 'user' | 'project' | 'company' | 'execution' | 'container'|'output'> {
  id: string;
  model?: IExperimentModelInfo;
  execution?: IExecutionForm;
  hyperParams?: IHyperParamsForm;
  artifacts?: Artifact[];
  hyperparams?: { [key: string]: { [key: string]: ParamsItem }};
  configuration?: { [key: string]: ConfigurationItem };
  readonly?: boolean;
  user?: User;
  project?: Project;
  company?: GetCurrentUserResponseUserObjectCompany;
  container?: Container;
  output?: ISelectedExperimentOutput
}

export interface ISelectedExperimentOutput extends Omit<Output, 'model'> {
  destination?: string;
  model?: {
    id: Model['id'];
    name: Model['name'];
    design?: Model['design'];
    framework?: Model['framework'];
  };
  result?: string;
  error?: string;
}

export interface ISelectedExperimentExecution {
  model?: {
    id: Model['id'];
    name: Model['name'];
    uri: Model['uri'];
    design?: Model['design'];
    created: Model['created'];
    labels: Model['labels'];
    task: {
      id: Task['id'];
      name: Task['name'];
    };
    project: {
      id: Project['id'];
      name: Project['name'];
    };
    user: {
      id: User['id'];
      name: User['name'];
    };
  };
  framework?: any;
  model_labels?: { [key: string]: number};
  artifacts?: Artifact[];
  docker_cmd?: string;
  queue?: Queue;
}

export interface IExperimentInfoFormComponent {
  editable: boolean;
}
