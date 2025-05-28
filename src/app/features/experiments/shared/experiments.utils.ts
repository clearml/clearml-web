import {isExample} from '@common/shared/utils/shared-utils';
import {ExperimentTagsEnum} from '~/features/experiments/shared/experiments.const';


export function isDevelopment(entity): boolean {
  return false;
}

export function getSystemTags(experiment: {system_tags?: string[]}) {
  const ignoredTags: string[] = [ExperimentTagsEnum.Hidden, ExperimentTagsEnum.Development];
  ignoredTags.push(ExperimentTagsEnum.Pipeline, ExperimentTagsEnum.Dataset);
  if (experiment?.system_tags?.includes(ExperimentTagsEnum.Dataset) || experiment?.system_tags?.includes(ExperimentTagsEnum.Pipeline)) {
    ignoredTags.push(ExperimentTagsEnum.Development);
  }
  return experiment?.system_tags?.filter(tag => !ignoredTags.includes(tag))  // remove ignored tags
    .map(tag => tag === ExperimentTagsEnum.Development ? 'dev' : tag)  // development => dev
    .concat(isExample(experiment) ? [ExperimentTagsEnum.Example] : []);  // add example when needed
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getExtraHeaders = (workspace: string) => ({headers: {}});
