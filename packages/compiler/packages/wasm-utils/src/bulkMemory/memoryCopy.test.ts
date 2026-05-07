import { test, expect } from 'vitest';

import memoryCopy from './memoryCopy';

test('memoryCopy generates bulk-memory instruction bytes', () => {
	expect(memoryCopy(2, 3)).toStrictEqual([0xfc, 0x0a, 0x02, 0x03]);
});
