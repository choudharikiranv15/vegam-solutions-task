import { describe, it, expect } from 'vitest';
import { formatDate } from './index';

describe('formatDate Utility', () => {
    it('formats date as YYYY-MM-DD when requested', () => {
        const date = '2023-05-15T10:00:00.000Z';
        expect(formatDate(date, 'YYYY-MM-DD')).toBe('2023-05-15');
    });

    it('formats date to readable string by default', () => {
        const date = '2023-01-01';
        const formatted = formatDate(date);
        // Testing that it returns a string and contains expected parts
        // Exact match depends on locale/timezone, so we check stricture
        expect(formatted).toMatch(/2023/);
        expect(formatted).toMatch(/Jan/);
    });
});
