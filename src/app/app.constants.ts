import {createAction} from '@ngrx/store';
import {Environment} from '../environments/base';

export const NA                      = 'N/A';
export const ALLEGRO_TUTORIAL_BUCKET = 'allegro-tutorials';
export const UPDATE_SERVER_PATH      = 'https://updates.clear.ml/updates';

export const BASE_REGEX = {
  DOMAIN           : '([A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+([A-Za-z]{2,6}\\.?|[A-Za-z0-9-]{1,}[A-Za-z0-9]\\.?)',
  PATH             : '(\\/?|[\\/?]\\S+)',
  IPV4             : '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}',
  IPV6             : '\\[?[A-F0-9]*:[A-F0-9:]+\\]?',
  FILE_PROTOCOL    : '[fF][iI][lL][eE]:\\/\\/',
  S3_PROTOCOL      : '[sS]3:\\/\\/',
  GS_PROTOCOL      : '[gG][sS]:\\/\\/',
  AZURE_PROTOCOL   : 'azure:\\/\\/',
  SCHEME           : '^[hH][tT][tT][pP][sS]?:\\/\\/',
  FILE_SUFFIX      : '\\/\\S*[^\\/ ]+$',
  FOLDER           : '\\/\\S*[^\\/ ]',
  S3_BUCKET_NAME   : '(?!(xn--|.+-s3alias$|.*\\.{2}.*))[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]',
  GS_BUCKET_NAME   : '(\\w[A-Za-z0-9\\-_]+\\w\\.)*\\w[A-Za-z0-9\\-_]+\\w',
  AZURE_BUCKET_NAME: '(\\w[A-Za-z0-9\\-_]+\\w\\.)*\\w[A-Za-z0-9\\-_]+\\w',
  AZURE_CONTAINER: '\\/[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]'
};

export const URI_REGEX = {
  S3_WITH_BUCKET            : BASE_REGEX.S3_PROTOCOL + BASE_REGEX.S3_BUCKET_NAME + BASE_REGEX.PATH,
  GS_WITH_BUCKET            : BASE_REGEX.GS_PROTOCOL + BASE_REGEX.GS_BUCKET_NAME + BASE_REGEX.PATH,
  AZURE_WITH_BUCKET: BASE_REGEX.AZURE_PROTOCOL + BASE_REGEX.AZURE_BUCKET_NAME + BASE_REGEX.AZURE_CONTAINER,
  S3_WITH_BUCKET_AND_HOST   : BASE_REGEX.S3_PROTOCOL + BASE_REGEX.S3_BUCKET_NAME + BASE_REGEX.DOMAIN + BASE_REGEX.PATH,
  GS_WITH_BUCKET_AND_HOST   : BASE_REGEX.GS_PROTOCOL + BASE_REGEX.GS_BUCKET_NAME + BASE_REGEX.DOMAIN + BASE_REGEX.PATH,
  AZURE_WITH_BUCKET_AND_HOST: BASE_REGEX.AZURE_PROTOCOL + BASE_REGEX.AZURE_BUCKET_NAME + BASE_REGEX.DOMAIN + BASE_REGEX.PATH,
  NON_AWS_S3                : BASE_REGEX.S3_PROTOCOL + '(' + BASE_REGEX.DOMAIN + '|' +
    '(localhost|LOCALHOST)' +
    BASE_REGEX.IPV4 + '|' +
    BASE_REGEX.IPV6 + ')' +
    '(:\\d+)?\\/' + // optional port.
    BASE_REGEX.S3_BUCKET_NAME +
    BASE_REGEX.PATH,
  HTTP                      : BASE_REGEX.SCHEME + '(' + BASE_REGEX.DOMAIN + '|' +
    '(localhost|LOCALHOST)|' +
    BASE_REGEX.IPV4 + '|' +
    BASE_REGEX.IPV6 + ')' +
    '(:\\d+)?',
  FILE                      : BASE_REGEX.FILE_PROTOCOL + BASE_REGEX.FOLDER,
  FILE_WITH_FILE_NAME       : BASE_REGEX.FILE_PROTOCOL + '(' + BASE_REGEX.FOLDER + ')?' + BASE_REGEX.FILE_SUFFIX
};


export const TASK_TYPES = {
  TRAINING         : 'training',
  ANNOTATION       : 'annotation',
  MANUAL_ANNOTATION: 'annotation_manual',
  TESTING          : 'testing',
};

export const VIEW_PREFIX  = 'VIEW_';

export type MediaContentTypeEnum = 'image/bmp' | 'image/jpeg' | 'image/png' | 'video/mp4';

export const MEDIA_VIDEO_EXTENSIONS = ['flv', 'avi', 'mp4', 'mov', 'mpg', 'wmv', '3gp', 'mkv'];

export type MessageSeverityEnum = 'success' | 'error' | 'info' | 'warn';

export const MESSAGES_SEVERITY = {
  SUCCESS: 'success' as MessageSeverityEnum,
  ERROR  : 'error' as MessageSeverityEnum,
  INFO   : 'info' as MessageSeverityEnum,
  WARN   : 'warn' as MessageSeverityEnum
};

export const USERS_PREFIX  = 'USERS_';

export const NAVIGATION_PREFIX  = 'NAVIGATION_';

export const guessAPIServerURL = () => {
  const url = window.location.origin;
  if (/https?:\/\/(demo|)app\./.test(url)) {
    return url.replace(/(https?):\/\/(demo|)app/, '$1://$2api');
  } else if (window.location.port === '30080') {
    return url.replace(/:\d+/, '') + ':30008';
  } else if (window.location.pathname === '/widgets') {
    return url + '/api';
  }
  return url.replace(/:\d+/, '') + ':8008';
};

export const ENVIRONMENT = {API_VERSION: '/v999.0'};

export let HTTP = {
  API_BASE_URL: '',
  API_BASE_URL_NO_VERSION : '',
  FILE_BASE_URL: '',
  ALT_FILES: null
};

export const updateHttpUrlBaseConstant = (_environment: Environment) => {

  let apiBaseUrl: string;
  if (_environment.apiBaseUrl) {
    apiBaseUrl = _environment.apiBaseUrl;
  } else {
    apiBaseUrl = guessAPIServerURL();
  }
  const apiBaseUrlNoVersion = apiBaseUrl;
  apiBaseUrl += ENVIRONMENT.API_VERSION;

  const url = window.location.origin;
  let fileBaseUrl;
  if (_environment.fileBaseUrl) {
    fileBaseUrl = _environment.fileBaseUrl;
  } else if (/https?:\/\/(demo|)app\./.test(url)) {
    fileBaseUrl = url.replace(/(https?):\/\/(demo|)app/, '$1://$2files');
  } else if (window.location.port === '30080') {
    fileBaseUrl = url.replace(/:\d+/, '') + ':30081';
  } else if (window.location.port === '8080') {
    fileBaseUrl = url.replace(/:\d+/, '') + ':8081';
  }

  HTTP.API_BASE_URL = apiBaseUrl;  // <-- DIRECT CALL DOESN'T WORK
  HTTP.API_BASE_URL_NO_VERSION = apiBaseUrlNoVersion;
  HTTP.FILE_BASE_URL = fileBaseUrl;
};


export const HTTP_PREFIX         = 'HTTP_';

export const emptyAction = createAction('EMPTY_ACTION');


export const AUTO_REFRESH_INTERVAL = 10 * 1000;
