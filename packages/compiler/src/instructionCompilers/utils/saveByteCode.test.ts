import { describe, expect, it } from 'vitest';

import { saveByteCode } from './saveByteCode';

import type { CompilationContext } from '@8f4e/compiler-spec';

describe('saveByteCode', () => {
	it('saves bytecode to the context', () => {
		const context = {
			blockStack: [],
			byteCode: [],
		} as unknown as CompilationContext;

		const result = saveByteCode(context, [1, 2, 3]);
		expect(result.byteCode).toEqual([1, 2, 3]);
	});

	it('appends to existing bytecode', () => {
		const context = {
			blockStack: [],
			byteCode: [1, 2],
		} as unknown as CompilationContext;

		const result = saveByteCode(context, [3, 4]);
		expect(result.byteCode).toEqual([1, 2, 3, 4]);
	});
});
