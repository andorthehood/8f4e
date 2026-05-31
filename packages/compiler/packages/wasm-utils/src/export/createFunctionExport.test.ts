import { expect, test } from 'vitest';
import { ExportDesc } from '../section';
import createFunctionExport from './createFunctionExport';

test('createFunctionExport generates correct entry', () => {
	const exp = createFunctionExport('test', 0);
	expect(exp).toContain(ExportDesc.FUNC);
	expect(exp).toContain(0);
});
