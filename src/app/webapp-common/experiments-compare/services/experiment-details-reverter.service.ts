import {Inject, Injectable, LOCALE_ID} from '@angular/core';
import {ExperimentReverterService} from '~/features/experiments/shared/services/experiment-reverter.service';
import {ExecutionDetails, ModelDetails} from '../shared/experiments-compare-details.model';
import {Task} from '~/business-logic/model/tasks/task';
import {
  ExperimentDetailsReverterServiceBase
} from '~/features/experiments-compare/experiment-details-reverter-service.base';
import {ARTIFACTS_TYPES, TAGS} from '../../tasks/tasks.constants';
import {Artifact} from '~/business-logic/model/tasks/artifact';
import {crc32} from '../../shared/utils/shared-utils';
import {TaskModelItem} from '~/business-logic/model/tasks/taskModelItem';
import {CompareIModelInfo} from '../../experiments/shared/common-experiment-model.model';
import {ITask} from '~/business-logic/model/al-task';
import {formatDate} from '@angular/common';
import {TIME_FORMAT_STRING} from '@common/constants';
import {NA} from '~/app.constants';
import {DurationPipe} from '@common/shared/pipes/duration.pipe';

@Injectable({
  providedIn: 'root'
})
export class ExperimentDetailsReverterService extends ExperimentDetailsReverterServiceBase {

  private durationPipe: DurationPipe;

  constructor(experimentReverter: ExperimentReverterService, @Inject(LOCALE_ID) public locale: string) {
    super(experimentReverter);
    this.durationPipe = new DurationPipe();
    this.locale = locale;
  }

  public revertInfo(experiment: ITask) {
    return {
      archive: experiment.system_tags.includes(TAGS.HIDDEN) ? 'Yes' : 'No',
      'changed at': experiment.last_change && formatDate(experiment.last_change, TIME_FORMAT_STRING, this.locale) || NA,
      'last iteration': experiment.last_iteration || NA,
      'status message': experiment.status_message || NA,
      'status reason': experiment.status_reason || NA,
      'created at': experiment.created && formatDate(experiment.created, TIME_FORMAT_STRING, this.locale) || NA,
      'started at': experiment.started && formatDate(experiment.started, TIME_FORMAT_STRING, this.locale) || NA,
      'last update at': experiment.last_update && formatDate(experiment.last_update, TIME_FORMAT_STRING, this.locale) || NA,
      'completed at': experiment.completed && formatDate(experiment.completed, TIME_FORMAT_STRING, this.locale) || NA,
      'run time': this.durationPipe.transform(experiment.active_duration) || NA,
      'queue': experiment.execution.queue?.display_name || experiment.execution.queue?.name || NA,
      'worker': experiment.last_worker || NA,
      'created by': experiment.user.name || NA,
      'parent task': (experiment.parent as ITask)?.name || NA,
      'project': experiment.project?.name || NA,
      ...Object.entries(experiment.runtime || {})
        .filter(([key,]) => !key.startsWith('_'))
        .reduce((res, [key, val]) => {
          res[key.replace(/_/g, ' ')] = val;
          return res;
        }, {})
    };
  }

  revertArtifacts(experiment: ITask): any {
    const result = {
      ' input models': this.revertModels(experiment.models.input),
      ' output models': this.revertModels(experiment.models.output)
    };
    experiment.execution.artifacts.forEach(artifact => result[artifact.key] = this.revertArtifact(artifact));
    return result;
  }

  revertArtifact(artifact: Artifact): any {
    if (artifact.type === ARTIFACTS_TYPES.AUDIT_LOG) {
      return this.revertAuditLog(artifact);
    }

    // Currently we have only audit_log so:
    return this.revertAuditLog(artifact);
  }

  revertAuditLog(artifact: Artifact): any {
    const {uri, content_size, hash, timestamp, display_data, mode, key, type_data, ...restArtifact} = artifact;
    const result = {
      ...restArtifact,
      'file size': content_size,
      'file hash': hash,
      'file path': {
        dataDictionary: true,
        link: uri,
        dataValue: uri
      }
    };

    if (type_data) {
      const preview = type_data.preview && type_data.preview.trim().split('\n') || [];
      result['content type'] = type_data['content_type'] || '';
      result['preview'] = (preview.length < 3000 && preview[0]?.length < 3000) ? preview : [`** Content is too large to display. Hash: ${crc32(type_data.preview)}`];
      result['data hash'] = type_data.data_hash || '';
    }
    display_data.forEach(pair => result[pair[0]] = pair[1]);

    return result;
  }

  revertModels(models: TaskModelItem[]) {
    return models.reduce((acc, model) => {
      acc[model.name] = this.revertModel(model);
      return acc;
    }, {});
  }

  revertModel(model: TaskModelItem): ModelDetails {
    return {
      model: this.revertModelInput(model),
      network_design: this.revertNetworkDesign(model.model),
    };
  }

  revertNetworkDesign(model): string {
    let networkDesign = model?.design?.design || model?.design;
    networkDesign = typeof networkDesign === 'string' ? networkDesign.split('\n') : {};
    return networkDesign;
  }

  revertExecution(experiment: ITask): ExecutionDetails {
    let pip = experiment?.script?.requirements?.['pip'];
    pip = (pip === undefined || Array.isArray(pip)) ? pip : pip.split('\n');
    pip = pip?.filter(row => !row.startsWith('#') && row.length > 0); // Should we remove comments????

    let diff = experiment?.script?.diff as any;
    if (diff) {
      diff = (Array.isArray(diff)) ? diff : diff.split('\n');
      diff = (diff.length < 3000 && diff[0]?.length < 3000) ? diff : [`** Content is too large to display. Hash: ${crc32(experiment?.script?.diff)}`];
    }

    return {
      source: experiment.script ? this.revertExecutionSource(experiment.script) : undefined,
      uncommitted_changes: diff,
      installed_packages: pip,
      container: {
        image: experiment.container?.image || '',
        arguments: experiment.container?.arguments || '',
        setup_shell_script: experiment.container?.setup_shell_script?.split('\n') || []
      }
    };
  }


  public revertModelInput(model: TaskModelItem): CompareIModelInfo {
    return {
      name: model?.model?.name,
      id: {
        dataDictionary: true,
        link: `/projects/${model?.model?.project?.id ? model?.model?.project?.id : '*'}/models/${model?.model?.id}`,
        dataValue: model?.model?.id,
      },
      framework: model?.model?.framework || model?.model?.framework
    };
  }

  public revertExecutionSource(script: Task['script']) {
    return {
      binary: script.binary,
      repository: script.repository,
      working_dir: script.working_dir,
      script_path: script.entry_point,
      branch: script.branch,
      commit_id: script.version_num,
      tag_name: script.tag || '' // In tag_name we want undefined == null == ""
    };
  }

}
