import {EXPERIMENT_INFO_ONLY_FIELDS_BASE} from '@common/experiments/experiment.consts';
export {INITIAL_EXPERIMENT_TABLE_COLS} from '../../webapp-common/experiments/experiment.consts';

export const GET_ALL_QUERY_ANY_FIELDS = ['id', 'name', 'comment', 'system_tags', 'models.output.model', 'models.input.model'];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getExperimentInfoOnlyFields = (hasDataFeature: boolean) => EXPERIMENT_INFO_ONLY_FIELDS_BASE;

export interface Link {
  name: string;
  url: string[];
  activeBy?: string;
}

export const infoTabLinks = [
  {name: 'execution', url: ['execution']},
  {name: 'configuration', url: ['hyper-params', 'hyper-param', '_empty_'], activeBy: 'hyper-params'},
  {name: 'artifacts', url: ['artifacts']},
  {name: 'info', url: ['general']},
  {name: 'console', url: ['log'], output: true},
  {name: 'scalars', url: ['scalars'], output: true},
  {name: 'plots', url: ['plots'], output: true},
  {name: 'debug samples', url: ['debugImages'], output: true}
];
