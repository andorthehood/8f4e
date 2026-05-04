import { compileToAST } from '@8f4e/tokenizer';
import { describe, test, expect } from 'vitest';

import modules from './__fixtures__/modules';

import { compileModules, createInitialMemoryDataSegments } from '../src';

describe('compiler', () => {
	test('createInitialMemoryDataSegments', () => {
		const astModules = modules.map(({ code }) => compileToAST(code));
		const compiledModules = compileModules(astModules, {
			startingMemoryWordAddress: 0,
		});
		const requiredMemoryBytes = compiledModules.reduce(
			(max, module) => Math.max(max, module.byteAddress + module.wordAlignedSize * 4),
			0
		);
		expect(
			createInitialMemoryDataSegments(compiledModules, requiredMemoryBytes).map(segment => ({
				byteAddress: segment.byteAddress,
				bytes: Array.from(segment.bytes),
			}))
		).toMatchSnapshot();
	});
});
