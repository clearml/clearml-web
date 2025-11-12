import versionConf from '../version.json';

export interface CommunityContext {
  title?: string;
  subtitle?: string;
  background?: string;
  backgroundPosition?: string;
  list?: { icon: string; title: string; text: string }[];
}

export interface GettingStartedContext {
  install?: string;
  configure?: string;
  packageName?: string;
}

export interface Legal {
  TOULink?: string;
  pricingLink?: string;
}

export interface InterfaceCustomizations {
  clonePrefix: string;
}

export interface Environment {
  production: boolean;
  apiBaseUrl: string;
  fileBaseUrl: string;
  displayedServerUrls?: {apiServer?: string; filesServer?: string};
  productName: string;
  demo: boolean;
  headerPrefix: string;
  version: string;
  userKey: string;
  userSecret: string;
  companyID: string;
  loginNotice?: string;
  loginBanner?: string;
  autoLogin?: boolean;
  whiteLabelLogo?: boolean;
  whiteLabelLink?: any;
  whiteLabelLoginTitle?: string;
  whiteLabelLoginSubtitle?: string;
  whiteLabelSlogan?: string;
  communityServer?: boolean;
  enterpriseServer?: boolean;
  accountAdministration: boolean;
  communityContext?: CommunityContext;
  GTM_ID?: string;
  hideUpdateNotice: boolean;
  showSurvey: boolean;
  plotlyURL: string;
  slackLink: string;
  docsLink?: string;
  supportEmail?: string;
  useFilesProxy: boolean;
  branding?: {faviconUrl?: string; logo?: string; logoSmall?: string};
  gettingStartedContext?: GettingStartedContext;
  serverDownMessage?: string;
  legal: Legal;
  loginPopup?: string;
  platformYoutubeChannel: string;
  appsYouTubeIntroVideoId?: string;
  newExperimentYouTubeVideoId: string;
  baseHref?: string;
  loginFallback?: 'password-less' | 'error'; // defaults to 'password-less'
  displayTips: boolean;
  onlyPasswordLogin: boolean;
  blockUserScript?: boolean;
  forceTheme?: 'light' | 'dark';
  defaultTheme?: 'light' | 'dark';
  customStyle?: string;
  interfaceCustomization?: InterfaceCustomizations| undefined;
}

export const BASE_ENV = {
  production: true,
  apiBaseUrl: null,
  fileBaseUrl: null,
  productName: 'clearml',
  demo: false,
  headerPrefix: 'X-Clearml',
  version: versionConf.version,
  userKey: 'EYVQ385RW7Y2QQUH88CZ7DWIQ1WUHP',
  userSecret: 'XhkH6a6ds9JBnM_MrahYyYdO-wS2bqFSm8gl-V0UZXH26Ydd6Eyi28TeBEoSr6Z3Bes',
  companyID: 'd1bd92a3b039400cbafc60a7a5b1e52b',
  loginNotice: '',
  loginBanner: '',
  autoLogin: false,
  whiteLabelLogo: null,
  whiteLabelLink: null,
  whiteLabelLoginTitle: null,
  whiteLabelLoginSubtitle: null,
  whiteLabelSlogan: null,
  communityContext: {
    background: 'app/webapp-common/assets/icons/human-polygon.svg'
  },
  GTM_ID: null,
  hideUpdateNotice: false,
  showSurvey: false,
  accountAdministration: false,
  useFilesProxy: true,
  legal: {TOULink: 'https://github.com/allegroai/clearml-server/blob/master/LICENSE'},
  plotlyURL: 'app/webapp-common/assets/plotly-2.35.0.min.js',
  slackLink: 'https://joinslack.clear.ml',
  docsLink: 'https://clear.ml/docs',
  supportEmail: 'support@clear.ml',
  branding: {logo: 'assets/autothought.webp?v=7', logoSmall: 'assets/small-autothought.webp?=2'},
  serverDownMessage: 'The ClearML server is currently unavailable.<BR>' +
    'Please try to reload this page in a little while.<BR>' +
    'If the problem persists, verify your network connection is working and check the ClearML server logs for possible errors',
  platformYoutubeChannel: 'https://www.youtube.com/c/ClearML/featured',
  newExperimentYouTubeVideoId: 's3k9ntmQmD4',
  displayTips: true,
} as Environment;

