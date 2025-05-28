import {effect, inject, Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {from, fromEvent, Observable, of, Subject} from 'rxjs';
import {fromFetch} from 'rxjs/fetch';
import {catchError, debounceTime, filter, map} from 'rxjs/operators';
import {DeleteObjectsCommand, GetObjectCommand, ObjectIdentifier, S3Client, S3ClientConfig} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {convertToReverseProxy, isFileserverUrl} from '~/shared/utils/url';
import {
  Credentials,
  selectRevokeSucceed,
  selectS3BucketCredentialsBucketCredentials
} from '../../core/reducers/common-auth-reducer';
import {getAllCredentials, refreshS3Credential, showLocalFilePopUp} from '../../core/actions/common-auth.actions';
import {ConfigurationService} from '../../shared/services/configuration.service';
import {DEFAULT_REGION} from '../../shared/utils/amazon-s3-uri';
import {getBucketAndKeyFromSrc, isGoogleCloudUrl, SignResponse} from '@common/settings/admin/base-admin-utils';
import {selectCompanyPreSignServices} from '~/core/reducers/auth.reducers';

const LOCAL_SERVER_PORT = 27878;
const FOUR_DAYS = 60 * 60 * 24 * 4;
const HTTP_REGEX = /^https?:\/\//;


@Injectable()
export class BaseAdminService {
  protected store = inject(Store);
  protected confService = inject(ConfigurationService);

  public s3Services: Record<string, S3Client> = {};
  private revokeSucceed = this.store.selectSignal(selectRevokeSucceed);
  protected preSignServices = this.store.selectSignal(selectCompanyPreSignServices);
  private environment = this.confService.configuration;
  private credentials = this.getCredentials();
  private deleteS3FilesSubject: Subject<{ success: boolean; files: string[] }>;
  private localServerWorking = false;

  constructor() {
    effect(() => {
      if (this.revokeSucceed()) {
        this.getAllCredentials();
      }
    });

    this.deleteS3FilesSubject = new Subject();

    fromEvent(window, 'storage')
      .pipe(
        filter((event: StorageEvent) => event.key === '_saved_state_'),
        debounceTime(50)
      )
      .subscribe(() => {
        this.store.dispatch(refreshS3Credential());
      });
  }

  protected getCredentials() {
    return this.store.selectSignal(selectS3BucketCredentialsBucketCredentials);
  }

  showLocalFilePopUp(url) {
    this.store.dispatch(showLocalFilePopUp({url}));
  }

  signUrlIfNeeded(
    url: string,
    config?: { skipLocalFile?: boolean; skipFileServer?: boolean; disableCache?: number },
    previousSignedUrl?: { signed: string; expires: number }
  ): Observable<SignResponse> {
    config = {...{skipLocalFile: true, skipFileServer: this.confService.getStaticEnvironment().production, disableCache: null}, ...config};

    if (isFileserverUrl(url)) {
      if (this.environment().communityServer) {
        url = this.addTenant(url);
      }
      if (config.disableCache) {
        url = this.addS3TimeStamp(url, config.disableCache);
      }
      if (!config.skipFileServer && this.environment().useFilesProxy) {
        return of({type: 'sign', signed: convertToReverseProxy(url), expires: Number.MAX_VALUE});
      }
      return of({type: 'sign', signed: url, expires: Number.MAX_VALUE});
    }

    if (this.isLocalFile(url) && !config.skipLocalFile) {
      this.checkLocalServerRunning(url);
      return of({type: 'sign', signed: this.redirectToLocalServer(url), expires: Number.MAX_VALUE});
    }

    if (this.preSignServices().length > 0) {
      const signed = this.redirectToSignServer(url);
      if (signed !== url) {
        return of({type: 'sign', signed, expires: Number.MAX_VALUE});
      }
    }

    if (this.isAzureUrl(url)) {
      const azureBucket = this.credentials().find((b) => b.Bucket && b.Bucket.toLowerCase() == 'azure');
      if (azureBucket) {
        return of({type: 'sign', signed: this.signAzureUrl(url, azureBucket), expires: Number.MAX_VALUE});
      }
    }
    const bucketKeyEndpoint = url && getBucketAndKeyFromSrc(url);
    if (bucketKeyEndpoint) {
      if (this.isAzureUrl(url)) {
        return of({type: 'popup', bucket: bucketKeyEndpoint, provider: 'azure'});
      }
      const s3 = this.findOrInitBucketS3(bucketKeyEndpoint);
      if (s3) {
        const command = new GetObjectCommand({
          Key: bucketKeyEndpoint.Key,
          Bucket: bucketKeyEndpoint.Bucket/*, ResponseContentType: 'image/jpeg'*/
        });
        return from(getSignedUrl(s3, command, {
          expiresIn: FOUR_DAYS,
          unhoistableHeaders: new Set(['x-amz-content-sha256', 'x-id']),
          unsignableHeaders: new Set(['x-amz-content-sha256', 'x-id'])
        }))
          .pipe(map(signed => ({type: 'sign', signed, expires: (new Date()).getTime() + FOUR_DAYS * 1000})));
      } else if (isGoogleCloudUrl(url) && !previousSignedUrl?.signed) {
        return of({type: 'sign', signed: this.signGoogleCloudUrl(url), expires: Number.MAX_VALUE});
      } else {
        delete bucketKeyEndpoint.Key;
        return of({type: 'popup', bucket: bucketKeyEndpoint, provider: isGoogleCloudUrl(url) ? 'gcs' : 's3'});
      }
    } else {
      return of({type: 'sign', signed: url, expires: Number.MAX_VALUE});
    }
  }

  findS3CredentialsInStore(bucketKeyEndpoint: Credentials) {
    const endpoint = bucketKeyEndpoint.Endpoint?.replace(HTTP_REGEX, '') ?? '';
    return this.credentials()
      .find(bucket => bucket?.Bucket === bucketKeyEndpoint.Bucket && (bucket?.Endpoint?.replace(HTTP_REGEX, '') ?? '') === endpoint);
  }

  findOrInitBucketS3(bucketKeyEndpoint: Credentials) {
    const set = this.findS3CredentialsInStore(bucketKeyEndpoint);
    const s3Service = this.s3Services[bucketKeyEndpoint.Bucket + bucketKeyEndpoint.Endpoint];
    if (set) {
      if (s3Service) {
        return s3Service;
      }
      this.s3Services[bucketKeyEndpoint.Bucket + bucketKeyEndpoint.Endpoint] = this.createS3Service(set);
      return this.s3Services[bucketKeyEndpoint.Bucket + bucketKeyEndpoint.Endpoint];
    }
    return null;
  }

  createS3Service(set) {
    // const [hostPort, path] = set.Endpoint?.split('/');
    const [hostname, port] = set.Endpoint?.replace(HTTP_REGEX, '')?.split(':') || ['', ''];
    const config = {
      region: set.Region || DEFAULT_REGION,
      credentials: {
        accessKeyId: set.Key,
        secretAccessKey: set.Secret,
        sessionToken: set.Token
      },
      ...(set.Endpoint && {
        endpoint: {
          protocol: set.Endpoint?.startsWith('https') ? 'https:' : 'http:',
          hostname,
          ...(!['80', '443'].includes(port) && {port}),
          path: ''
        },
        forcePathStyle: true,
        tls: false
      })
    } as S3ClientConfig;
    return new S3Client(config);
  }

  resetS3Services() {
    this.s3Services = {};
  }

  public getAllCredentials() {
    this.store.dispatch(getAllCredentials({}));
  }

  // Uses Allegro Chrome extension injecting patch_local_link function to window - hack to get local files.
  redirectToLocalServer(url: string): string {
    return `http://localhost:${LOCAL_SERVER_PORT}${url.replace('file://', '/')}`;
  }

  redirectToSignServer(url: string): string {
    return url;
  }

  isLocalFile(url: string): boolean {
    return url && (url.startsWith('/') || url.startsWith('file://') ||
      url.startsWith(':\\', 1) || url.startsWith('\\\\'));
  }

  checkLocalServerRunning(url: string) {
    if (this.localServerWorking) {
      return;
    }

    fromFetch(`http://localhost:${LOCAL_SERVER_PORT}`, {mode: 'no-cors'})
      .pipe(catchError(() => {
        this.showLocalFilePopUp(url);
        return [];
      }))
      .subscribe(() =>
        this.localServerWorking = true);
  }

  signGoogleCloudUrl(url: string): string {
    let result = url.slice(5);
    if (result.search(/[ !"#$&'()*+,;<=>?@\[\\\]^]/) > -1) {
      result = result.split('/').map(part => encodeURIComponent(part)).join('/');
    }
    return 'https://storage.cloud.google.com/' + result;
  }

  signAzureUrl(url: string, azureBucket) {
    let sas = azureBucket ? azureBucket.Secret : '';
    sas = sas.startsWith('?') ? sas : `?${sas}`;
    const sasQueryString = url.includes('?') ? sas.replace('?', '&') : sas;
    return url.replace('azure://', 'https://').concat(sasQueryString);
  }

  isAzureUrl(url: string) {
    return url.startsWith('azure://');
  }


  protected addTenant(url: string) {
    return url;
  }

  public deleteS3Files(files: string[], skipSubjectReturn): Observable<{ success: boolean; files: string[] }> {
    const url = files[0];
    const bucketKeyEndpoint = url && getBucketAndKeyFromSrc(url);
    const s3 = this.findOrInitBucketS3(bucketKeyEndpoint) as S3Client;


    const command = new DeleteObjectsCommand({
      Bucket: bucketKeyEndpoint.Bucket,
      Delete: {
        Quiet: true,
        Objects: files.map(file => ({Key: file} as ObjectIdentifier))
      }
    });

    if (s3) {
      s3.send(command).then(response => {
        if (response.Errors?.length > 0) {
          this.deleteS3FilesSubject.next({success: false, files});
        } else {
          this.deleteS3FilesSubject.next({success: true, files});
        }
      });
    } else {
      delete bucketKeyEndpoint.Key;
      // TODO: use store
      // this.showS3PopUp(bucketKeyEndpoint).pipe(skip(1), take(1))
      //   .subscribe(() => this.deleteS3Files(files, true));
    }
    return !skipSubjectReturn && this.deleteS3FilesSubject.asObservable();
  }

  addS3TimeStamp(url: string, timestamp: number) {
    timestamp = timestamp || new Date().getTime();
    try {
      const parsed = new URL(url);
      parsed.searchParams.append('X-Amz-Date', `${timestamp}`);
      return parsed.toString();
    } catch {
      return url;
    }
  }

}
