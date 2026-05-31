// table
import {Task} from '../../../business-logic/model/tasks/task';

export type ExperimentTableColFieldsEnum = 'output.result' | 'comment' | 'id' | 'project.name' | 'name' | 'type' | 'status' | 'created' | 'completed' | 'user.name' | 'queue.name' | 'last_worker' | 'selected' |'last_iteration' | 'last_update' | 'tags' | 'active_duration'| 'parent';

export interface ITableExperiment {
  id: Task['id'];
  type: Task['type'];
  name: Task['name'];
  created: Task['created'];
  completed: Task['completed'];
  status: Task['status'];
  tags: Task['tags'];
  system_tags: Task['system_tags'];
  last_update?: string | Date;
  active_duration?: Date;
}

export interface CloneForm {
  project: string;
  name: string;
  comment: string;
}

export interface ExtendForm {
  project: string;
  name: string;
  comment: string;
}
