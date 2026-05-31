import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Renderer2 } from '@angular/core';
import { ConfigurationService } from '@common/shared/services/configuration.service';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideMockStore({}),
        { 
          provide: Renderer2, 
          useValue: { 
            addClass: () => {}, 
            removeClass: () => {} 
          } 
        },
        {
            provide: ConfigurationService,
            useValue: { configuration: () => ({}) }
        }
      ]
    });
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
