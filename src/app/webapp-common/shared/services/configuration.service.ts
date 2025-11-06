import {computed, inject, Injectable} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {guessAPIServerURL, HTTP} from '~/app.constants';
import {environment} from '../../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, of, timer, throwError} from 'rxjs';
import {catchError, retryWhen, mergeMap, tap} from 'rxjs/operators';
import {Environment} from '../../../../environments/base';
import { retryOperation } from '../utils/promie-with-retry';

export const fetchConfigOutSideAngular = async (prefix = ''): Promise<Environment> =>
  retryOperation(() => fetch(prefix + 'configuration.json').then(res => res.json()), 500, 2) as Promise<Environment>;

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  private httpClient = inject(HttpClient);

  public static globalEnvironment = environment as Environment;
  public globalEnvironmentObservable = new BehaviorSubject(environment as Environment);
  public readonly configuration = toSignal<Environment>(this.globalEnvironmentObservable.asObservable());
  public readonly fileServerUrl = computed(() => {
    const filesServer = this.configuration().displayedServerUrls?.filesServer;
    if (filesServer) {
      if (filesServer.match(/^(https?|s3|gs|azure):\/\//)) {
        return filesServer;
      }
      const url = new URL(window.location.origin);
      url.pathname = filesServer;
      return url.toString();
    } else if (filesServer === null) {
      return null;
    } else {
      return HTTP.FILE_BASE_URL;
    }
  });

  public readonly apiServerUrl = computed(() => {
    const apiServer = this.configuration().displayedServerUrls?.apiServer
    if (apiServer) {
      if (apiServer.match(/^(https?|s3|gs|azure):\/\//)) {
        return apiServer;
      }
      const url = new URL(window.location.origin);
      url.pathname = apiServer;
      return url.toString();
    } else {
      return guessAPIServerURL();
    }
  });

  initConfigurationService() {
    if ((window as any).configuration) {
      this.setEnv((window as any).configuration);
      return of(null);
    }
    return this.httpClient.get('configuration.json')
      .pipe(
        retryWhen(errors => errors.pipe(
            mergeMap((err, i) => i > 2 ? throwError('Error from retry!') : timer(500))
        )),
        catchError(() => of({})),
        tap(env => this.setEnv(env))
      );
  }

  setEnv(env) {
    ConfigurationService.globalEnvironment = {...ConfigurationService.globalEnvironment, ...env};
    this.globalEnvironmentObservable.next(ConfigurationService.globalEnvironment);
  }
  // If someone must have it the rxjs way
  getEnvironment() {
    return this.globalEnvironmentObservable.asObservable();
  }

  getStaticEnvironment() {
    return ConfigurationService.globalEnvironment;
  }
}
