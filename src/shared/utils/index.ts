import { randomFillSync } from 'crypto';

export * from './lowercase-first-letter';
export * from './constants';
export * from './hash';
export * from './generate-slug';
export * from './date';
export * from './percent-transit-to-vn';

export function generateNumericCode(length = 15): string {
  return Array.from(randomFillSync(new Uint32Array(length)))
    .map((x) => x % 10) // Chuyển đổi số ngẫu nhiên thành chữ số từ 0-9
    .join('');
}
