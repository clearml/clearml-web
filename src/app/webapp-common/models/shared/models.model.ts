//table
import {Model} from '~/business-logic/model/models/model';
import {User} from '~/business-logic/model/users/user';
import {Task} from '~/business-logic/model/tasks/task';
import {Project} from '~/business-logic/model/projects/project';

export type ModelTableColFieldsEnum = 'system_tags' | 'id' | 'project.name' | 'name' | 'created' | 'framework' | 'user.name' | 'ready' | 'task.name' | 'selected' | 'last_update';

export interface SelectedModel extends Omit<Model, 'id' | 'user' | 'task' | 'project'> {
  id: string;
  user?: User;
  company?: any;
  task?: Task;
  project?: Project;
  readOnly?: boolean;
  design?: any;
}

export interface TableModel {
  id: Model['id'];
  system_tags?: Model['system_tags'];
  ready?: Model['ready'];
  name?: Model['name'];
  tags?: Model['tags'];
}
