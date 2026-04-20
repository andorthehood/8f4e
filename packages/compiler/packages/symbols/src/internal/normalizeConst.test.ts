import { ArgumentType, compileToAST, type ConstLine } from '@8f4e/tokenizer';
import { describe, expect, it } from 'vitest';

import { normalizeConst } from './normalizeConst';

import { SymbolResolutionErrorCode, type SymbolResolutionContext } from '../types';

function parseConst(source: string): ConstLine {
	return compileToAST([source])[0] as ConstLine;
}

describe('normalizeConst', () => {
	const context = {
		namespace: {
			consts: {
				SIZE: { value: 16, isInteger: true },
			},
			moduleName: 'test',
			namespaces: {},
		},
		blockStack: [],
	} satisfies SymbolResolutionContext;

	it('normalizes constants that depend only on literals and other constants', () => {
		const result = normalizeConst(parseConst('const TOTAL SIZE*2'), context);

		expect(result.arguments[1]).toMatchObject({
			type: ArgumentType.LITERAL,
			value: 32,
			isInteger: true,
		});
	});

	it('rejects constants that depend on memory metadata', () => {
		expect(() => normalizeConst(parseConst('const BYTES sizeof(samples)*2'), context)).toThrow(
			`${SymbolResolutionErrorCode.LAYOUT_DEPENDENT_CONSTANT}`
		);
	});

	it('rejects constants that depend on memory addresses', () => {
		expect(() => normalizeConst(parseConst('const START &samples'), context)).toThrow(
			`${SymbolResolutionErrorCode.LAYOUT_DEPENDENT_CONSTANT}`
		);
	});
});
