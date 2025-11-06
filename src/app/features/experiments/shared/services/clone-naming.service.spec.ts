import { TestBed } from '@angular/core/testing';

import { CloneNamingService } from './clone-naming.service';

describe('CloneNamingService', () => {
  let service: CloneNamingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CloneNamingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getclonePrefix should return the correct template with name and date', () => {
     const expectedTemplate = 'Clone of ${name} ${date}';
     const taskName = 'myTask';
  });
});
