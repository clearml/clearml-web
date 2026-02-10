import { Pipe, PipeTransform } from '@angular/core';
import { TaskStatusEnum } from '~/business-logic/model/tasks/taskStatusEnum';

@Pipe({
  name: 'hasCompleted',
  })
export class HasCompletedPipe implements PipeTransform {

  transform(tasks: any[]): boolean {
    if(!tasks){
      return false;
    }
    return !!tasks.some((task)=> [TaskStatusEnum.Completed, TaskStatusEnum.Closed, TaskStatusEnum.Failed, TaskStatusEnum.Published, TaskStatusEnum.Stopped].includes(task.status));
  }

}
