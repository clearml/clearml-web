import {inject, Injectable, Renderer2, DOCUMENT} from '@angular/core';

import {ConfigurationService} from '@common/shared/services/configuration.service';
import {BreakpointObserver, BreakpointState} from '@angular/cdk/layout';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {map, startWith} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {setForcedTheme, setThemeColors, systemThemeChanged} from '@common/core/actions/layout.actions';
import {selectThemeMode} from '@common/core/reducers/view.reducer';
import {pairwise} from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private config = inject(ConfigurationService);
  private breakpointObserver = inject(BreakpointObserver);
  private store = inject(Store);
  private renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);

  constructor() {
    const {forceTheme, defaultTheme} = this.config.configuration()
    this.store.dispatch(setForcedTheme({theme: forceTheme, default: defaultTheme}))
    if (this.config.configuration().customStyle) {
      this.loadCustomStyle(this.config.configuration().customStyle);
    }

    this.breakpointObserver.observe(['(prefers-color-scheme: dark)'])
      .pipe(
        takeUntilDestroyed(),
        map((result: BreakpointState) => result.matches ? 'dark' : 'light' as 'light' | 'dark'),
      )
      .subscribe(theme => {
        this.store.dispatch(systemThemeChanged({theme}));
      });

    this.store.select(selectThemeMode)
      .pipe(
        startWith(null),
        takeUntilDestroyed(),
        pairwise()
      )
      .subscribe(([prevTheme, theme]) => {
        this.renderer.removeClass(this.document.documentElement, `${prevTheme}-mode`);
        this.renderer.addClass(this.document.documentElement, `${theme}-mode`);
        this.store.dispatch(setThemeColors({colors: this.getAllThemeColors()}));

      });

  }

  getAllThemeColors() {
    const res: Record<string, string> = {};
    if ('computedStyleMap' in document.body) {
      // Chrome
      const styles =  document.body.computedStyleMap();
      styles.forEach((val, key) => {
        if (key.startsWith('--color')) {
          res[key.replace('--color-','')] = val.toString();
        }
      });
    } else {
      // Firefox
      const styles = getComputedStyle(document.body);
      Array.from(styles).forEach(propertyName => {
        if (propertyName.startsWith('--color')) {
          res[propertyName.replace('--color-','')] = styles.getPropertyValue(propertyName);
        }
      });
    }
    return res;
  }

  loadCustomStyle(url: string) {
    const link: HTMLLinkElement = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onerror = () => console.error(`Error loading custom style from ${url}`);

    const head: HTMLHeadElement = document.getElementsByTagName('head')[0];
    head.appendChild(link);
  }
}
