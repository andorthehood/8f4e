import { test, expect } from 'vitest';

import ccNames from './ccNames';

test('test if the list matches the snapshot', () => {
	expect(ccNames).toMatchSnapshot();
});

test('if the last item is poly mode', () => {
	expect(ccNames[127]).toMatchObject({ name: 'poly mode' });
});
