const { calculateStatus, normalizeSteps, validateStepIndex, TOTAL_STEPS } = require('../src/status');

describe('status calculation', () => {
  test('0 completed -> planned', () => {
    expect(calculateStatus([])).toBe('planned');
  });

  test('1-7 completed -> ongoing', () => {
    expect(calculateStatus([0])).toBe('ongoing');
    expect(calculateStatus([0, 1, 2, 3, 4, 5, 6])).toBe('ongoing');
  });

  test('8 completed -> done', () => {
    expect(calculateStatus([0, 1, 2, 3, 4, 5, 6, 7])).toBe('done');
  });

  test('dedupes steps', () => {
    expect(calculateStatus([1, 1, 1])).toBe('ongoing');
  });

  test('normalizeSteps filters invalid indexes', () => {
    expect(normalizeSteps([0, 99, -1, 3.5, 7])).toEqual([0, 7]);
  });

  test('validateStepIndex rejects out of range', () => {
    expect(() => validateStepIndex(-1)).toThrow();
    expect(() => validateStepIndex(8)).toThrow();
    expect(() => validateStepIndex(0)).not.toThrow();
    expect(() => validateStepIndex(7)).not.toThrow();
    expect(TOTAL_STEPS).toBe(8);
  });
});
