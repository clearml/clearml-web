import {Injectable} from '@angular/core';
import {Model} from '../model/models/model';

@Injectable({providedIn: 'root'})
export class BlModelsService {

  constructor() {
  }

  addHiddenTag(modelTags: Model['system_tags']): Model['system_tags'] {
    if (modelTags) {
      if (modelTags.includes('archived')) {
        return modelTags;
      } else {
        return modelTags.concat(['archived']);
      }
    } else {
      return ['archived'];
    }
  }

  removeHiddenTag(modelTags: Model['system_tags']): Model['system_tags'] {
    if (modelTags.includes('archived')) {
      return modelTags.filter(tag => tag !== 'archived');
    }
    return modelTags;
  }

}
