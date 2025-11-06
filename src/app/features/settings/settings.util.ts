import {User} from '~/business-logic/model/users/user';
import {Environment} from '../../../environments/base';

export type SettingsUser = User;

export const getBlockNotice= (config: Environment) => config.blockUserScript ?
  'User scripts are blocked by system administrator. you won’t be able to view debug samples, Hyper-Dataset frame previews and embedded resources in reports.' :
  `Block any user and 3rd party scripts from running anywhere in the WebApp. Note that if this is turned on, you won’t be able to view debug samples and embedded resources in reports.`;
