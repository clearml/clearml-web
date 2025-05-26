import {inject, Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {addMessage} from '@common/core/actions/layout.actions';
import {LocationStrategy} from '@angular/common';
import {v4} from 'uuid';
import {MESSAGES_SEVERITY} from '@common/constants';
import {selectActiveWorkspace} from '@common/core/reducers/users-reducer';
import {GetCurrentUserResponseUserObjectCompany} from '~/business-logic/model/users/getCurrentUserResponseUserObjectCompany';
import {ConfigurationService} from '@common/shared/services/configuration.service';
import {ClipboardService} from 'ngx-clipboard';
import {take} from 'rxjs';

export interface ReportCodeEmbedConfiguration {
  type: 'plot' | 'multiplot' | 'scalar' | 'multiscalar' | 'sample' | 'parcoords' | 'single';
  objects?: string[];
  objectType: 'model' | 'task';
  domRect: DOMRect;
  name?: string;
  metrics?: string[];
  variants?: string[];
  valueType?: string;
  seriesName?: string[];
  plotsNames?: string[];
  xaxis?: string;
  group?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ReportCodeEmbedBaseService {
  private workspace: GetCurrentUserResponseUserObjectCompany;
  private isCommunity: boolean;
  protected store: Store;
  protected locationStrategy: LocationStrategy;
  protected configService: ConfigurationService;
  protected _clipboardService: ClipboardService;

  constructor() {
    this.store = inject(Store);
    this.locationStrategy = inject(LocationStrategy);
    this.configService = inject(ConfigurationService);
    this._clipboardService = inject(ClipboardService);
    this.isCommunity = this.configService.getStaticEnvironment().communityServer;
    this.store.select(selectActiveWorkspace).subscribe(workspace => this.workspace = workspace);
  }

  createCode(conf: ReportCodeEmbedConfiguration) {
    const code = conf.group ? this.generateEmbedSnippetGroup(conf) : this.generateEmbedSnippet(conf);
    this._clipboardService.copyResponse$
      .pipe(take(1))
      .subscribe(() => this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS,
        'Resource embed code copied to clipboard.You can paste it in your Reports.'))
      );
    this._clipboardService.copy(code);
  }

  encodeSrc(conf: ReportCodeEmbedConfiguration, internal = true) {
    const url = this.getUrl();
    url.searchParams.set('type', conf.type);
    url.searchParams.set('objectType', conf.objectType);
    conf.seriesName && conf.seriesName.forEach(seriesName => seriesName && url.searchParams.append('series', seriesName));
    conf.valueType && url.searchParams.set('value_type', conf.valueType);
    conf.xaxis && url.searchParams.set('xaxis', conf.xaxis);
    let urlStr = url.toString();
    ['objects', 'metrics', 'variants'].forEach(key => {
      if (conf[key]?.filter(v => !!v || typeof v === 'string').length > 0) {
        urlStr += '&' + conf[key].map(val => `${key}=${encodeURIComponent(val)}`).join('&');
      }
    });
    return urlStr;
  }

  getUrl() {
    const url = new URL(window.location.origin + this.locationStrategy.getBaseHref());
    url.pathname = url.pathname + 'widgets/';
    return url;
  }

  generateEmbedSnippetGroup(conf: ReportCodeEmbedConfiguration) {
    const graphsUnmerged = conf.type === 'plot' && conf.variants.length > 1 && Array.from(new Set(conf.seriesName)).length < 2;
    if (conf.objects.length > 1 && graphsUnmerged) {
      return `<h2>${conf.metrics[0]}</h2>\n` + conf.objects.map((object, i) =>
        this.generateEmbedSnippet({...conf, objects: [object], seriesName: [conf.seriesName[i]]})).join('\n');
    } else {
      return `<h2>${conf.metrics[0]}</h2>\n` + conf.variants.map((variant, i) =>
        this.generateEmbedSnippet({...conf, variants: [variant], seriesName: [conf.seriesName[i]]})).join('\n');
    }
  }

  generateEmbedSnippet(conf: ReportCodeEmbedConfiguration) {
    const urlStr = this.encodeSrc(conf);
    return `<iframe src="${urlStr}" name="${conf.name || v4()}" width="100%" height="400"></iframe>`;
  }
}
