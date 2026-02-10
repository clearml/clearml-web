import {computed, inject, Injectable} from '@angular/core';
import {template} from 'lodash-es';
import {format} from 'date-fns';
import {ConfigurationService} from '@common/shared/services/configuration.service';

@Injectable({
  providedIn: 'root'
})
export class CloneNamingService {
  private readonly config = inject(ConfigurationService);

  public readonly defaultTemplate = 'Clone of ${name}'

  private compiled =  computed(() => {
    const templateStr = this.config.configuration().interfaceCustomization?.clonePrefix ?? this.defaultTemplate;
    return template(templateStr);
  });

  getTaskCloneTemplate(name: string) {
    return this.compiled()({name, date: format(new Date(), 'Ppp')});
  }
}
