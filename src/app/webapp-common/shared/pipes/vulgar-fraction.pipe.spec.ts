import {VulgarFractionPipe} from '@common/shared/pipes/vulgar-fraction.pipe';

describe('VulgarFractionPipe', () => {
  let pipe: VulgarFractionPipe;

  beforeEach(() => {
    pipe = new VulgarFractionPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('nullish and NaN', () => {
    it('should return empty string for null', () => {
      expect(pipe.transform(null)).toBe('');
    });
    it('should return empty string for undefined', () => {
      expect(pipe.transform(undefined)).toBe('');
    });
    it('should return empty string for NaN', () => {
      expect(pipe.transform(Number.NaN)).toBe('');
    });
  });

  describe('whole numbers and rounding edge cases', () => {
    it('should return 0 for 0', () => {
      expect(pipe.transform(0)).toBe('0');
    });
    it('should return positive integers unchanged', () => {
      expect(pipe.transform(3)).toBe('3');
    });
    it('should return negative integers with sign', () => {
      expect(pipe.transform(-2)).toBe('-2');
    });
    it('should round 2.99999999999 to 3 due to EPS handling', () => {
      expect(pipe.transform(2.99999999999)).toBe('3');
    });
    it('should treat tiny fraction below EPS as whole number', () => {
      expect(pipe.transform(5 + 1e-10)).toBe('5');
    });
  });

  describe('unicode mapped simple fractions', () => {
    it('should map 1/2 to <span class="vulgar-fraction">½</span>', () => {
      expect(pipe.transform(0.5)).toBe('<span class="vulgar-fraction">½</span>');
    });
    it('should map -1/2 to -<span class="vulgar-fraction">½</span>', () => {
      expect(pipe.transform(-0.5)).toBe('-<span class="vulgar-fraction">½</span>');
    });
    it('should map 1 1/4 to 1 <span class="vulgar-fraction">¼</span>', () => {
      expect(pipe.transform(1.25)).toBe('1 <span class="vulgar-fraction">¼</span>');
    });
    it('should map 2 3/4 to 2 <span class="vulgar-fraction">¾</span>', () => {
      expect(pipe.transform(2.75)).toBe('2 <span class="vulgar-fraction">¾</span>');
    });
    it('should map thirds correctly', () => {
      expect(pipe.transform(1/3)).toBe('<span class="vulgar-fraction">⅓</span>');
      expect(pipe.transform(2/3)).toBe('<span class="vulgar-fraction">⅔</span>');
    });
    it('should map fifths correctly', () => {
      expect(pipe.transform(1/5)).toBe('<span class="vulgar-fraction">⅕</span>');
      expect(pipe.transform(2/5)).toBe('<span class="vulgar-fraction">⅖</span>');
      expect(pipe.transform(3/5)).toBe('<span class="vulgar-fraction">⅗</span>');
      expect(pipe.transform(4/5)).toBe('<span class="vulgar-fraction">⅘</span>');
    });
    it('should map eighths correctly', () => {
      expect(pipe.transform(1/8)).toBe('<span class="vulgar-fraction">⅛</span>');
      expect(pipe.transform(3/8)).toBe('<span class="vulgar-fraction">⅜</span>');
      expect(pipe.transform(5/8)).toBe('<span class="vulgar-fraction">⅝</span>');
      expect(pipe.transform(7/8)).toBe('<span class="vulgar-fraction">⅞</span>');
    });
  });

  describe('fallback formatting (a/b)', () => {
    it('should fallback for 7/100', () => {
      expect(pipe.transform(0.07)).toBe('7/100');
    });
    it('should include integer part and fallback fraction', () => {
      expect(pipe.transform(1.07)).toBe('1 7/100');
    });
    it('should preserve negative sign with integer and fraction', () => {
      expect(pipe.transform(-3.2)).toBe('-3 <span class="vulgar-fraction">⅕</span>');
    });
  });
});
