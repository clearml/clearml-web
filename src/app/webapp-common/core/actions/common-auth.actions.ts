import {createAction, props} from '@ngrx/store';
import {CredentialKeyExt, Credentials} from '../reducers/common-auth-reducer';
import {GetCurrentUserResponseUserObjectCompany} from '~/business-logic/model/users/getCurrentUserResponseUserObjectCompany';
import {SettingsUser} from '~/features/settings/settings.util';

export const AUTH_PREFIX = '[AUTH] ';

export const refreshS3Credential = createAction(AUTH_PREFIX + ' [Refresh S3Credential]');
export const setS3Credentials = createAction(
  AUTH_PREFIX + ' [Set S3]',
  props<{ bucketCredentials: Credentials[] }>()
);

export const updateS3Credential = createAction(
  AUTH_PREFIX + 'SET_BUCKETS_CREDENTIALS',
  props<{s3BucketCredentials: {bucketCredentials: Credentials[]}}>()
);
export const createCredential = createAction(
  AUTH_PREFIX + 'CREATE_CREDENTIAL (API)',
  props<{workspace: GetCurrentUserResponseUserObjectCompany; openCredentialsPopup?: boolean; label?: string; user?: SettingsUser}>()
);

export const createCredentialPopup = createAction(
  AUTH_PREFIX + 'CREATE_CREDENTIAL POPUP',
  props<{workspace: GetCurrentUserResponseUserObjectCompany; openCredentialsPopup?: boolean; label?: string; user?: SettingsUser}>()
);

export const updateCredentialLabel = createAction(
  AUTH_PREFIX + 'UPDATE_CREDENTIAL_LABEL',
  props<{credential: CredentialKeyExt; label?: string}>()
);

export const setCredentialLabel = createAction(
  AUTH_PREFIX + 'SET_CREDENTIAL_LABEL',
  props<{credential: CredentialKeyExt; label?: string}>()
);
export const addCredential = createAction(
  AUTH_PREFIX + 'ADD_CREDENTIAL',
  props<{ newCredential: CredentialKeyExt; workspaceId: string }>()
);
export const resetCredential = createAction(AUTH_PREFIX + 'RESET_CREDENTIAL');
export const resetCredentials = createAction(AUTH_PREFIX + 'RESET_CREDENTIALS');
export const removeCredential = createAction(
  AUTH_PREFIX + '[remove credentials]',
  props<{ accessKey: string; workspaceId: string }>()
);
export const saveS3Credentials = createAction(AUTH_PREFIX + 'SET_BUCKET_CREDENTIALS',
  props<{ newCredential: Credentials }>()
);
export const cancelS3Credentials = createAction(
  AUTH_PREFIX + 'CANCEL_BUCKET_CREDENTIALS',
  props<{ dontAskAgainForBucketName: string }>()
);
export const resetDontShowAgainForBucketEndpoint = createAction(AUTH_PREFIX + 'RESET_DONT_SHOW_AGAIN_FOR_BUCKET_ENDPOINT');
export const resetShowS3Popup = createAction(AUTH_PREFIX + 'RESET_SHOW_S3_POPUP');
export const showS3PopUp = createAction(
  AUTH_PREFIX + 'SHOW_S3_POPUP',
  props<{credentials: Credentials; credentialsError: string; provider: 's3' | 'azure' | 'gcs'}>()
);
export const getTutorialBucketCredentials = createAction(AUTH_PREFIX + 'GET_TUTORIAL_BUCKET_CREDENTIALS');
export const showLocalFilePopUp = createAction(
  AUTH_PREFIX + 'SHOW_LOCAL_FILE_POPUP',
  props<{ url: string }>()
);
export const getAllCredentials = createAction(
  AUTH_PREFIX + 'GET_ALL_CREDENTIALS',
  props<{userId?: string; autorefresh?: boolean}>());
export const credentialRevoked = createAction(
  AUTH_PREFIX + 'REVOKE_CREDENTIAL (API)',
  props<{ accessKey: string; workspaceId: string }>()
);
export const updateAllCredentials = createAction(
  AUTH_PREFIX + 'UPDATE_ALL_CREDENTIALS',
  props<{ credentials: CredentialKeyExt[]; extra: Record<string, CredentialKeyExt[]>; workspace: string; maxCredentials: number }>()
);
export const getSignedUrl = createAction(
  AUTH_PREFIX + '[get signed url]',
  props<{url: string; config?: {
    skipLocalFile?: boolean;
    skipFileServer?: boolean;
    disableCache?: number;
    dprsUrl?: string | boolean;
    error?: boolean;
  }}>()
);
export const signUrls = createAction(
  AUTH_PREFIX + '[sign urls]',
  props<{sign: {
    url: string;
    config?: {
      skipLocalFile?: boolean;
      skipFileServer?: boolean;
      disableCache?: number;
      dprsUrl?: string | boolean;
      error?: boolean;
    }
  }[]}>()
);
export const setSignedUrl = createAction(
  AUTH_PREFIX + '[set signed url]',
  props<{url: string; signed: string; expires: number}>()
);

export const setSignedUrls = createAction(
  AUTH_PREFIX + '[set signed urls]',
  props<{signed: {url: string; signed: string; expires: number}[]}>()
);

export const removeSignedUrl = createAction(
  AUTH_PREFIX + '[remove signed url]',
  props<{url: string}>()
);
