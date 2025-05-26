import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {ApiAuthService} from '~/business-logic/api-services/auth.service';
import * as authActions from '../actions/common-auth.actions';
import {setCredentialLabel, setSignedUrls} from '../actions/common-auth.actions';
import {requestFailed} from '../actions/http.actions';
import {activeLoader, deactivateLoader, setServerError} from '../actions/layout.actions';
import {catchError, filter, finalize, map, mergeMap, switchMap, throttleTime} from 'rxjs/operators';
import {AuthGetCredentialsResponse} from '~/business-logic/model/auth/authGetCredentialsResponse';
import {Action, Store} from '@ngrx/store';
import {selectCurrentUser} from '../reducers/users-reducer';
import {GetCurrentUserResponseUserObject} from '~/business-logic/model/users/getCurrentUserResponseUserObject';
import {AdminService} from '~/shared/services/admin.service';
import {
  selectDontShowAgainForBucketEndpoint,
  selectS3BucketCredentialsBucketCredentials,
  selectSignedUrl,
  selectSignedUrls
} from '@common/core/reducers/common-auth-reducer';
import {EMPTY, forkJoin, of} from 'rxjs';
import {
  S3AccessDialogData,
  S3AccessDialogResult,
  S3AccessResolverComponent
} from '@common/layout/s3-access-resolver/s3-access-resolver.component';
import {MatDialog} from '@angular/material/dialog';
import {isGoogleCloudUrl, SignResponse} from '@common/settings/admin/base-admin-utils';
import {isFileserverUrl} from '~/shared/utils/url';
import {selectRouterQueryParams} from '@common/core/reducers/router-reducer';
import {concatLatestFrom} from '@ngrx/operators';
import {selectCompanyPreSignServices, selectExtraCredentials} from '~/core/reducers/auth.reducers';
import {ErrorService} from '@common/shared/services/error.service';

@Injectable()
export class CommonAuthEffects {
  private signAfterPopup: Action[] = [];
  private openPopup: Record<string, boolean> = {};

  constructor(
    private actions: Actions,
    private credentialsApi: ApiAuthService,
    private store: Store,
    private adminService: AdminService,
    private errorService: ErrorService,
    private matDialog: MatDialog
  ) {
  }

  activeLoader = createEffect(() => this.actions.pipe(
    ofType(authActions.getAllCredentials, authActions.createCredential),
    map(action => activeLoader(action.type))
  ));

  getAllCredentialsEffect = createEffect(() => this.actions.pipe(
    ofType(authActions.getAllCredentials),
    switchMap(action => this.credentialsApi.authGetCredentials({},
      {userId: action.userId}).pipe(
      concatLatestFrom(() => this.store.select(selectCurrentUser)),
      mergeMap(([res, user]: [AuthGetCredentialsResponse, GetCurrentUserResponseUserObject]) => [
        authActions.updateAllCredentials({credentials: res.credentials, extra: res?.['additional_credentials'], workspace: user.company.id}),
        deactivateLoader(action.type)
      ]),
      catchError(error => [requestFailed(error), deactivateLoader(action.type)])
    ))
  ));

  revokeCredential = createEffect(() => this.actions.pipe(
    ofType(authActions.credentialRevoked),
    concatLatestFrom(() => [
      this.store.select(selectRouterQueryParams).pipe(map(params => params.userId))
    ]),
    mergeMap(([action, userId]) => this.credentialsApi.authRevokeCredentials(
      {access_key: action.accessKey}, {userId}).pipe(
      mergeMap(() => [
        authActions.removeCredential(action),
        deactivateLoader(action.type)
      ]),
      catchError(error => [
        requestFailed(error),
        deactivateLoader(action.type),
        setServerError(error, null, `Can't delete this credentials.`)
      ])
    ))
  ));

  createCredential = createEffect(() => this.actions.pipe(
    ofType(authActions.createCredential),
    concatLatestFrom(() => [
      this.store.select(selectRouterQueryParams).pipe(map(params => params.userId))
    ]),
    mergeMap(([action, userId]) =>
      this.credentialsApi.authCreateCredentials({label: action.label}, {userId}).pipe(
        mergeMap(({credentials}) => [
          authActions.addCredential({newCredential: credentials, workspaceId: action.workspace?.id}),
          ...(action.openCredentialsPopup && [authActions.createCredentialPopup({...action})] || []),
          deactivateLoader(action.type)
        ]),
        catchError(error => [
          requestFailed(error),
          setServerError(error, null, this.errorService.getErrorMsg(error?.error)),
          authActions.addCredential({newCredential: {}, workspaceId: action.workspace?.id}),
          deactivateLoader(action.type)])
      ))
  ));

  updateCredentialLabel = createEffect(() => this.actions.pipe(
    ofType(authActions.updateCredentialLabel),
    concatLatestFrom(() => this.store.select(selectRouterQueryParams).pipe(map(params => params.userId))),

    mergeMap(([action, userId]) =>
      this.credentialsApi.authEditCredentials({access_key: action.credential.access_key, label: action.label},
        {userId}).pipe(
        mergeMap(() => [
          setCredentialLabel({credential: action.credential, label: action.label}),
          deactivateLoader(action.type)
        ]),
        catchError(error => [
          requestFailed(error),
          setServerError(error, null, 'Unable to update credentials'),
          deactivateLoader(action.type)])
      ))
  ));

  refresh = createEffect(() => this.actions.pipe(
    ofType(authActions.refreshS3Credential, authActions.getSignedUrl),
    map(() => {
      const state = JSON.parse(window.localStorage.getItem('_saved_state_'));
      return authActions.setS3Credentials({bucketCredentials: state?.auth?.s3BucketCredentials?.bucketCredentials});
    })
  ));

  signUrl = createEffect(() => this.actions.pipe(
    ofType(authActions.getSignedUrl),
    switchMap(action => this.store.select(selectExtraCredentials)
      .pipe(
        filter(c => c !== null),
        map(() => action)
      )
    ),
    filter(action => !!action.url),
    mergeMap(action =>
      of(action).pipe(
        concatLatestFrom(() =>
          this.store.select(selectSignedUrl(action.url))
        ),
        switchMap(([, signedUrl]) =>
          (!signedUrl?.expires || signedUrl.expires < (new Date()).getTime() ||
            (isFileserverUrl(action.url) && action.config?.disableCache) ||
            (action.config?.error && isGoogleCloudUrl(action.url) && !signedUrl.signed.includes('X-Amz-Signature'))
          ) ?
            this.adminService.signUrlIfNeeded(action.url, action.config, signedUrl) : of({type: 'none'})
        ),
        filter(res => !!res),
        switchMap((res: SignResponse) => {
            switch (res.type) {
              case 'popup':
                this.signAfterPopup.push(action);
                return [authActions.showS3PopUp({credentials: res.bucket, provider: res.provider, credentialsError: null})];
              case 'sign':
                return [authActions.setSignedUrl({url: action.url, signed: res.signed, expires: res.expires})];
              default:
                return EMPTY;
            }
          }
        )
      )
    )
  ));

  signUrls = createEffect(() => {
    return this.actions.pipe(
      ofType(authActions.signUrls),
      filter(action => action.sign.length > 0),
      switchMap(action => this.store.select(selectExtraCredentials)
        .pipe(
          filter(c => c !== null),
          map(() => action)
        )
      ),
      concatLatestFrom(() => [
        this.store.select(selectSignedUrls)
      ]),
      mergeMap(([action, prevSigns]) =>
        forkJoin(action.sign.map(req =>
          of(action).pipe(
            concatLatestFrom(() => [
              this.store.select(selectSignedUrl(req.url)),
              this.store.select(selectCompanyPreSignServices)
            ]),
            switchMap(([, signedUrl, preSignService]) => (!signedUrl?.expires || signedUrl.expires < (new Date()).getTime() ||
              (isFileserverUrl(req.url) && req.config?.disableCache) ||
              (req.config?.error && isGoogleCloudUrl(req.url) && !signedUrl.signed.includes('X-Amz-Signature')) ||
              preSignService.length > 0
            ) ? this.adminService.signUrlIfNeeded(req.url, req.config, prevSigns[req.url]) : of({type: 'none'})),
            map(res => ({res, orgUrl: req.url}))
          )
        )).pipe(
          switchMap((responses) => {
            const groups = responses
              .filter(res => !!res.res)
              .reduce((acc, res) => {
                if (Object.hasOwn(acc, res.res.type)) {
                  acc[res.res.type].push(res);
                } else {
                  acc[res.res.type] = [res];
                }
                return acc;
              }, {});
            return Object.keys(groups).map(type => {
              switch (type) {
                case 'popup': {
                  this.signAfterPopup.push(action);
                  const res = groups[type][0].res;
                  return [authActions.showS3PopUp({
                    credentials: res.bucket,
                    provider: res.provider,
                    credentialsError: null
                  })];
                }
                case 'sign':
                  return setSignedUrls({
                    signed: groups['sign'].map((res: { res: SignResponse, orgUrl: string }) =>
                      ({url: res.orgUrl, signed: res.res.signed, expires: res.res.expires}))
                  });
                default:
                  return null;
              }
            })
              .filter(a => !!a)
              .flat();
          })
        )
      )
    );
  });

  s3popup = createEffect(() => this.actions.pipe(
    ofType(authActions.showS3PopUp),
    concatLatestFrom(() => this.store.select(selectDontShowAgainForBucketEndpoint)),
    throttleTime(500),
    filter(([action, dontShowAgain]) =>
      action?.credentials?.Bucket + action?.credentials?.Endpoint !== dontShowAgain &&
      !this.openPopup[action?.credentials?.Bucket]
    ),
    switchMap(([action]) => {
      if (action?.credentials?.Bucket) {
        this.openPopup[action.credentials.Bucket] = true;
      }
      return this.matDialog.open<S3AccessResolverComponent, S3AccessDialogData, S3AccessDialogResult>(
        S3AccessResolverComponent, {data: action, maxWidth: 700}
      ).afterClosed()
        .pipe(
          concatLatestFrom(() => this.store.select(selectS3BucketCredentialsBucketCredentials)),
          switchMap(([data, bucketCredentials]) => {
            let actions = [];
            if (data) {
              actions = [...this.signAfterPopup];
              if (!data.success) {
                const emptyCredentials = bucketCredentials.find((cred => cred?.Bucket === data.Bucket)) === undefined;
                const dontAskAgainForBucketName = emptyCredentials ? '' : data.Bucket + data.Endpoint;
                return [authActions.cancelS3Credentials({dontAskAgainForBucketName})];
              }
              return [authActions.saveS3Credentials({newCredential: data}), ...actions];
            }
            this.signAfterPopup = [];
            return actions;
          }),
          finalize(() => action?.credentials?.Bucket && delete this.openPopup[action.credentials.Bucket])
        );
    })
  ));
}
