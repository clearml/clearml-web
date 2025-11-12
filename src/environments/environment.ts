import {BASE_ENV} from './base';

export const environment = {
  ...BASE_ENV,
  production             : false,
  autoLogin              : false,
  apiBaseUrl             : 'service/1/api',
  spaLogin               : true,
  hideUpdateNotice       : true,
  showSurvey: false
};
