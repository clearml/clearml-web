import { TestBed } from '@angular/core/testing';

import { LuceneParserService } from './lucene-parser.service';

describe('LuceneParserService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const lucene: LuceneParserService = TestBed.inject(LuceneParserService);
    expect(lucene).toBeTruthy();
  });

  it('should be a valid query', () => {
    const lucene: LuceneParserService = TestBed.inject(LuceneParserService);

    expect(lucene.isValid('keywords:"labels"')).toBeTruthy();
    expect(lucene.isValid('keywords:* ')).toBeTruthy();
    expect(lucene.isValid('keywords:"labels" AND keywords:"labels2"')).toBeTruthy();
    expect(lucene.isValid('keywords:"labels" OR keywords:"labels2"')).toBeTruthy();
    expect(lucene.isValid('keywords:"labels" && keywords:"labels2"')).toBeTruthy();
    expect(lucene.isValid('keywords: "labels"')).toBeTruthy();
  });

  it('should not be a valid query', () => {
    const lucene: LuceneParserService = TestBed.inject(LuceneParserService);

    expect(lucene.isValid(null)).toBeFalsy();
    expect(lucene.isValid('keywords:')).toBeFalsy();
    expect(lucene.isValid('keywords:"labels" OR ')).toBeFalsy();
    expect(lucene.isValid('keywords:"labels" && ')).toBeFalsy();
  });

});
