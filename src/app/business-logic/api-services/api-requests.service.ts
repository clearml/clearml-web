import {Injectable} from '@angular/core';
import {HTTP} from '../../app.constants';
import {Observable} from 'rxjs';
import {IApiRequest, SmHttpResponse} from '../model/api-request';
import {HttpClient, HttpParams} from '@angular/common/http';
import {HttpHeaders} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {ApiOptions} from '~/business-logic/api-services/api';

@Injectable({providedIn: 'root'})
export class SmApiRequestsService {

  constructor(private http: HttpClient) {
  }

  createRequest(request: IApiRequest): Observable<any> {

    return this.http.request(
      request.meta.method,
      request.meta.endpoint[0] === '/' ? request.meta.endpoint : `${HTTP.API_BASE_URL}/${request.meta.endpoint}`,
      {
        params         : this.getParams(request.params),
        body           : request.payload,
        withCredentials: true
      });
  }

  post<T>(url: string, body: any | null, options?: {
    headers?: HttpHeaders | {
      [header: string]: string | string[];
    };
    observe?: 'body';
    params?: HttpParams | {
      [param: string]: string | string[];
    };
    reportProgress?: boolean;
    responseType?: 'json';
    withCredentials?: boolean;
  }, extOptions?: ApiOptions): Observable<T> {
    options.withCredentials = true;
    return this.http.post<SmHttpResponse>(url, body, options).pipe(map(res => res.data));
  }

  posti(url: string, body: any | null, options?: {
    headers?: HttpHeaders | {
      [header: string]: string | string[];
    };
    observe?: 'body';
    params?: HttpParams | {
      [param: string]: string | string[];
    };
    reportProgress?: boolean;
    responseType?: 'json';
    withCredentials?: boolean;
  }): Observable<SmHttpResponse> {
    options.withCredentials = true;
    return this.http.post<SmHttpResponse>(url, body, options);
  }

  private getParams(actionParams) {
    let params: HttpParams = new HttpParams();

    if (actionParams) {
      Object.keys(actionParams)
        .forEach(key => params = params.append(key, actionParams[key]));
    }

    return params;
  }

}
