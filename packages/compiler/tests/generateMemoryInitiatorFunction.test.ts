import { compileToAST } from '@8f4e/tokenizer';
import { describe, test, expect } from 'vitest';

import modules from './__fixtures__/modules';

import { compileModules, createInitialMemoryDataSegments } from '../src';

function serializeSegments(segments: ReturnType<typeof createInitialMemoryDataSegments>) {
	return segments.map(segment => ({
		byteAddress: segment.byteAddress,
		bytes: Array.from(segment.bytes),
	}));
}

describe('compiler', () => {
	test('createInitialMemoryDataSegments', () => {
		const astModules = modules.map(({ code }) => {
			const ast = compileToAST(code);
			if (ast.type === 'function') {
				throw new Error('Expected module AST.');
			}
			return ast;
		});
		const compiledModules = compileModules(astModules, {
			startingMemoryWordAddress: 0,
		});
		expect(serializeSegments(createInitialMemoryDataSegments(compiledModules))).toMatchSnapshot();
	});
});
