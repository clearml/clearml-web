import { Injectable } from '@angular/core';

export interface Error {
  meta: {
    result_code: number;
    result_subcode: number;
    result_msg: string;
    error_data?: any;
  };
  data: any;
}
@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  template(strings, ...keys) {
    return (values => {
      const result = [strings[0]];
      keys.forEach((key, i) => {
        const value = values[key];
        result.push(value, strings[i + 1]);
      });
      return result.join('');
    });
  }

  private codes = {
    400: {
      12: this.template`Field excided allowed value`,
      50: this.template`Account reached the maximum number of credentials.`,
      51: this.template`This operation could not be completed at this time. Please try again later. \n${'resultMsg'}`,
      52: this.template`Could not complete identity verification. The provider may be down - Please try again later`,
      53: this.template`Could not complete identity verification. The provider may be down - Please try again later`,
      54: this.template`Could not resolve link destination. Contact the person who provided you with the link to join their team.`,
      55: this.template`Could not complete identity verification. Your sign-up session has probably timed out, please try again.
** If this issue persists, the identity provider may be down - please try again later.`,
      56: this.template`The invitation to ${'user_name'}'s team has expired. Contact ${'user_name'} to join their team, or sign up for a free standalone account.`,
      57: this.template`Account already exists for this ${'provider'}  identity. Use 'Log In' Instead.`,
      58: this.template`No account exists. Use the provider you signed up with or sign up to create a new account`,
      62: this.template`Please check your email to continue the signup process`,
      67: this.template`${'email'} does not have access to ClearML - Ask your admin to whitelist this address`,
      86: this.template`Can't deactivate last SSO configuration`,
      1205: this.template`This workspace is at its limit for concurrently running instances.`,
      505: this.template`This version is currently linked to one or more annotation tasks ${'tasks'}`,
      509: this.template`Can't edit frame's metadata for published version.`
    }
  };

  getErrorMsg(error: Error, extraParams: Record<string, string> = {}) {
    const template = this.codes?.[error?.meta?.result_code]?.[error?.meta?.result_subcode];
    if (template) {
      let params = {resultMsg: error?.meta?.result_msg, ...extraParams};
      if (error?.meta?.error_data) {
        params = {...error.meta.error_data, ...params};
      }
      try {
        return template(params);
      } catch {
        console.warn('failed to render error message', error);
      }
    }
    return error?.meta?.result_msg || '';
  }

  lastRunError(error: Error) {
    return error?.meta?.result_code === 400 && error?.meta?.result_subcode === 160;
  }
}
