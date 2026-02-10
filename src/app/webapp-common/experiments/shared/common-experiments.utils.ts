import {DIGITS_AFTER_DECIMAL} from '~/features/experiments/shared/experiments.const';
import {ITableExperiment} from '@common/experiments/shared/common-experiment-model.model';

export const convertStopToComplete = (tasks) => tasks.map(task => {
  if (task.status === 'closed') {
    task.status = 'completed';
  }
  return task;
});

export const filterArchivedExperiments = (experiments, showArchived): ITableExperiment[] => {
  if (showArchived) {
    return experiments.filter(ex => ex?.system_tags?.includes('archived'));
  } else {
    return experiments.filter(ex => !(ex?.system_tags?.includes('archived')));
  }
};

export const getRoundedNumber = (value: number) => Math.round(value * Math.pow(10, DIGITS_AFTER_DECIMAL)) / Math.pow(10, DIGITS_AFTER_DECIMAL);

export const downloadObjectAsJson = (exportObj, exportName) => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.href= dataStr;
  downloadAnchorNode.download=  exportName + '.json';
  downloadAnchorNode.click();
};

export const encodeHyperParameter = (path: string) => {
  const [prefix, section, ...param] = path.split('.');
  return [prefix, section, param.length > 0 ? param.join('%2E') : null, 'value'].filter(val => val !== null).join('.');
};

export const buildGitRepoUrl = (
  repoUrl: string,
  branch?: string | null,
  commitId?: string | null,
  defaultPort?: number | null,
  defaultScheme: 'http' | 'https' = 'https'
) => {
  if (!repoUrl) {
    return {targetUrl: repoUrl, type: null};
  }

  let httpsUrl: string;

  if (repoUrl.startsWith('git@')) {
    // Handle scp-like SSH syntax: git@host:namespace/repo.git
    const match = repoUrl.match(/^git@(.*?):(.*?)(\.git)?$/);
    if (!match) {
      return {targetUrl: null, type: null};
    }
    const host = match[1];
    const path = match[2].replace(/\.git$/, '');
    const port = defaultPort ? `:${defaultPort}` : '';
    httpsUrl = `${defaultScheme}://${host}${port}/${path}`;
  } else if (repoUrl.startsWith('ssh://')) {
    // Handle full SSH URL with port
    const urlObj = new URL(repoUrl);
    const host = urlObj.hostname;
    const port = urlObj.port ? `:${urlObj.port}` : (defaultPort ? `:${defaultPort}` : '');
    const path = urlObj.pathname.replace(/^\//, '').replace(/\.git$/, '');
    httpsUrl = `${defaultScheme}://${host}${port}/${path}`;
  } else {
    // HTTPS case
    try {
      const urlObj = new URL(repoUrl);
      const host = urlObj.hostname;
      const port = urlObj.port ? `:${urlObj.port}` : '';
      const path = urlObj.pathname.replace(/\.git$/, '');
      httpsUrl = `${urlObj.protocol}//${host}${port}${path}`;
    } catch {
      return {targetUrl: null, type: null};
    }
  }

  const host = new URL(httpsUrl).hostname;
  let targetUrl = httpsUrl;
  let type;

  if (host.includes('github.com')) {
    type = 'github';
    if (commitId) targetUrl += `/tree/${commitId}`;
    else if (branch) targetUrl += `/tree/${branch}`;
  } else if (host.includes('bitbucket')) {
    type = 'bitbucket';
    if (commitId) targetUrl += `/src/${commitId}`;
    else if (branch) targetUrl += `/src/HEAD/?at=${encodeURIComponent(branch)}`;
  } else if (host.includes('dev.azure.com') || host.includes('azure.com')) {
    type = 'azure';
    if (commitId) targetUrl += `?version=GC${commitId}`;
    else if (branch) targetUrl += `?version=GB${branch}`;
  } else {
    // Default: assume GitLab (self-hosted or gitlab.com)
    if (commitId) targetUrl += `/-/tree/${commitId}`;
    else if (branch) targetUrl += `/-/tree/${branch}`;
  }

  return {targetUrl, type};
}
