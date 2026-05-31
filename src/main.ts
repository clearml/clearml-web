import {enableProdMode} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';
import {ConfigurationService, fetchConfigOutSideAngular} from '@common/shared/services/configuration.service';
import {updateHttpUrlBaseConstant} from '~/app.constants';
import {Environment} from './environments/base';
import {AppRootComponent} from '~/app';
import {getAppConfig} from '~/app.config';

const environment = ConfigurationService.globalEnvironment;

if (environment.production) {
  enableProdMode();
}

(async () => {
  let configData = {} as Environment;
  try {
    configData = await fetchConfigOutSideAngular();
    (window as any).configuration = configData;
  } finally {
    const baseHref = (window as any).__env?.subPath || '' as string;
    updateHttpUrlBaseConstant({...environment, ...configData, ...(baseHref && !baseHref.startsWith('${') && {apiBaseUrl: baseHref + environment.apiBaseUrl})});
    bootstrapApplication(AppRootComponent, getAppConfig(configData)).catch(err => console.error(err));
  }
})();
