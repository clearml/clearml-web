import {LoginService} from '~/shared/services/login.service';
import {ConfigurationService} from '@common/shared/services/configuration.service';
import {switchMap} from 'rxjs';
import {inject} from '@angular/core';

export const loadUserAndPreferences = ()=>
  new Promise((resolve) => {
    const loginService = inject(LoginService);
    const confService = inject(ConfigurationService);

    confService.initConfigurationService()
      .pipe(switchMap(() => loginService.initCredentials()))
      .subscribe(() => loginService.loginFlow(resolve));
  });
