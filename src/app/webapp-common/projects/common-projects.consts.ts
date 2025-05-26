import {ExperimentSettings} from '@common/experiments/reducers/experiment-output.reducer';
import {Project} from '~/business-logic/model/projects/project';

export const PROJECTS_PREFIX         = 'PROJECTS_';

export const pageSize = 16;

export interface ProjectSettingsDialog {
  chartSettings: ExperimentSettings,
  project: Project;
  hiddenMetricsScalar: string[];
  dialogId: string;
}
