import { InvalidSm2QualityError, Sm2Service } from './sm2.service';

describe('Sm2Service', () => {
  let service: Sm2Service;

  beforeEach(() => {
    // No constructor dependencies — plain `new` is enough. No need to
    // bootstrap a Nest TestingModule for a pure algorithm class.
    service = new Sm2Service();
  });

  describe('correct answers (quality >= 3)', () => {
    it('sets interval to 1 and repetition to 1 on the first correct answer', () => {
      const result = service.calculate({
        quality: 4,
        repetition: 0,
        easeFactor: 2.5,
        previousIntervalDays: 1,
      });
      expect(result.repetition).toBe(1);
      expect(result.intervalDays).toBe(1);
    });

    it('sets interval to 6 and repetition to 2 on the second consecutive correct answer', () => {
      const result = service.calculate({
        quality: 4,
        repetition: 1,
        easeFactor: 2.6,
        previousIntervalDays: 1,
      });
      expect(result.repetition).toBe(2);
      expect(result.intervalDays).toBe(6);
    });

    it('multiplies the previous interval by the ease factor (rounded) from the third repetition onward', () => {
      const result = service.calculate({
        quality: 4,
        repetition: 2,
        easeFactor: 2.7,
        previousIntervalDays: 6,
      });
      expect(result.repetition).toBe(3);
      expect(result.intervalDays).toBe(Math.round(6 * 2.7)); // 16
    });

    it('rounds the computed interval to the nearest whole day', () => {
      const result = service.calculate({
        quality: 3,
        repetition: 5,
        easeFactor: 1.35,
        previousIntervalDays: 10,
      });
      // 10 * 1.35 = 13.5 -> JS Math.round ties go up -> 14
      expect(result.intervalDays).toBe(14);
    });
  });

  describe('incorrect answers (quality < 3) — lapses', () => {
    it('resets repetition to 0 and interval to 1, no matter how far along the word was', () => {
      const result = service.calculate({
        quality: 1,
        repetition: 8,
        easeFactor: 2.9,
        previousIntervalDays: 120,
      });
      expect(result.repetition).toBe(0);
      expect(result.intervalDays).toBe(1);
    });

    it('quality exactly 2 still counts as a lapse (passing threshold is 3)', () => {
      const result = service.calculate({
        quality: 2,
        repetition: 3,
        easeFactor: 2.8,
        previousIntervalDays: 16,
      });
      expect(result.repetition).toBe(0);
      expect(result.intervalDays).toBe(1);
    });
  });

  describe('ease factor adjustment', () => {
    it.each([
      [5, 0.1],
      [4, 0.0],
      [3, -0.14],
      [2, -0.32],
      [1, -0.54],
      [0, -0.8],
    ])('quality=%i shifts ease factor by %f', (quality, delta) => {
      const startingEaseFactor = 2.5;
      const result = service.calculate({
        quality,
        repetition: 3, // arbitrary — EF math doesn't depend on repetition
        easeFactor: startingEaseFactor,
        previousIntervalDays: 10,
      });
      const expected = Math.round((startingEaseFactor + delta) * 10000) / 10000;
      expect(result.easeFactor).toBeCloseTo(expected, 4);
    });

    it('never drops the ease factor below 1.3, even from an already-low starting point', () => {
      const result = service.calculate({
        quality: 0,
        repetition: 3,
        easeFactor: 1.3,
        previousIntervalDays: 10,
      });
      expect(result.easeFactor).toBe(1.3);
    });

    it('clamps the ease factor at 9.9999 (the DECIMAL(5,4) column ceiling)', () => {
      const result = service.calculate({
        quality: 5,
        repetition: 3,
        easeFactor: 9.99,
        previousIntervalDays: 10,
      });
      expect(result.easeFactor).toBe(9.9999);
    });
  });

  describe('input validation', () => {
    it.each([-1, 6, 2.5, NaN])('throws InvalidSm2QualityError for quality=%p', (quality) => {
      expect(() =>
        service.calculate({ quality, repetition: 0, easeFactor: 2.5, previousIntervalDays: 1 }),
      ).toThrow(InvalidSm2QualityError);
    });
  });

  describe('multi-review simulation', () => {
    it('matches hand-calculated state across 5 consecutive perfect (quality=5) reviews', () => {
      let state = { repetition: 0, easeFactor: 2.5, intervalDays: 1 };
      const history: Array<{ repetition: number; easeFactor: number; intervalDays: number }> = [];

      for (let i = 0; i < 5; i++) {
        state = service.calculate({
          quality: 5,
          repetition: state.repetition,
          easeFactor: state.easeFactor,
          previousIntervalDays: state.intervalDays,
        });
        history.push(state);
      }

      expect(history).toEqual([
        { repetition: 1, easeFactor: 2.6, intervalDays: 1 },
        { repetition: 2, easeFactor: 2.7, intervalDays: 6 },
        { repetition: 3, easeFactor: 2.8, intervalDays: 16 },
        { repetition: 4, easeFactor: 2.9, intervalDays: 45 },
        { repetition: 5, easeFactor: 3.0, intervalDays: 131 },
      ]);
    });

    it('a lapse after a streak keeps the ease-factor penalty instead of resetting to the default', () => {
      let state = { repetition: 0, easeFactor: 2.5, intervalDays: 1 };
      for (const quality of [5, 5, 5]) {
        state = service.calculate({
          quality,
          repetition: state.repetition,
          easeFactor: state.easeFactor,
          previousIntervalDays: state.intervalDays,
        });
      }
      expect(state).toEqual({ repetition: 3, easeFactor: 2.8, intervalDays: 16 });

      const afterLapse = service.calculate({
        quality: 2,
        repetition: state.repetition,
        easeFactor: state.easeFactor,
        previousIntervalDays: state.intervalDays,
      });
      expect(afterLapse).toEqual({ repetition: 0, easeFactor: 2.48, intervalDays: 1 });
    });
  });
});
