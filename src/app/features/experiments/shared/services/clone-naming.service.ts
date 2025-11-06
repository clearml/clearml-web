import {computed, inject, Injectable} from '@angular/core';
import {format} from 'date-fns';
import {ConfigurationService} from '@common/shared/services/configuration.service';

@Injectable({
  providedIn: 'root'
})
export class CloneNamingService {
  private readonly config = inject(ConfigurationService);

  public readonly deafultTempalte = 'Clone of ${name}'


  private compiled =  computed(() => {
    const templateStr =  this.config.configuration().interfaceCustomization?.clonePrefix ||
      this.deafultTempalte;
    return templateStr;
  });

  getClonePrefix(name: string) {
    const replacements = {name, date: format(new Date(), 'Ppp')};
    return  this.compiled().replace(/\${\s*([^}|\s]+)\s*}/g, (match, key) => replacements[key] ?? '');
  }
}
