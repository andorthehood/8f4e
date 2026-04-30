import { describe, expect, it } from 'vitest';

import resolveIntermodularReferenceValue from './resolveIntermodularReferenceValue';

import type { AST, CompilationContext } from '@8f4e/compiler-types';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('resolveIntermodularReferenceValue', () => {
	const line = {
		lineNumberBeforeMacroExpansion: 1,
		lineNumberAfterMacroExpansion: 1,
		instruction: 'int*',
		arguments: [],
	} as unknown as AST[number];

	it('returns undefined for intermodular-module-reference (now handled by resolveCompileTimeOperand)', () => {
		const context = {
			namespace: {
				namespaces: {
					source: {
						consts: {},
						byteAddress: 12,
						wordAlignedSize: 3,
						memory: {},
					},
				},
			},
		} as unknown as CompilationContext;

		expect(resolveIntermodularReferenceValue(classifyIdentifier('&source:'), line, context)).toBeUndefined();
	});

	it('returns undefined for intermodular-reference (now handled by resolveCompileTimeOperand)', () => {
		const context = {
			namespace: {
				namespaces: {
					source: {
						consts: {},
						byteAddress: 12,
						wordAlignedSize: 3,
						memory: {
							buf: {
								byteAddress: 12,
								wordAlignedSize: 2,
								numberOfElements: 2,
								elementWordSize: 4,
							},
						},
					},
				},
			},
		} as unknown as CompilationContext;

		expect(resolveIntermodularReferenceValue(classifyIdentifier('&source:buf'), line, context)).toBeUndefined();
	});
});
