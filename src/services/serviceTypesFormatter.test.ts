import { describe, expect, it } from 'vitest';
import { formatServiceTypes } from './serviceTypesFormatter.js';

describe('formatServiceTypes', () => {
  it('formats service type list with examples', () => {
    expect(formatServiceTypes()).toContain('Типы обслуживания:');
    expect(formatServiceTypes()).toContain('- масло: замена масла');
    expect(formatServiceTypes()).toContain('- тормозные колодки: колодки');
    expect(formatServiceTypes()).toContain('/service масло 6200 пробег 126000 след 8000');
    expect(formatServiceTypes()).toContain('/service тормозная жидкость 1200 след 24 месяца');
  });
});
