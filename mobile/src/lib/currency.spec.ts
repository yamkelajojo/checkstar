import { formatZar } from './currency';
test('min', () => { expect(formatZar(100)).toBe('R 1,00'); });
