import { expect, test } from 'vitest';

import createFunctionExport from './createFunctionExport';

import { ExportDesc } from '../section';

test('createFunctionExport generates correct entry', () => {
	const exp = createFunctionExport('test', 0);
	expect(exp).toContain(ExportDesc.FUNC);
	expect(exp).toContain(0);
});
