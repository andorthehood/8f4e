import { describe, expect, it } from 'vitest';

import { compileProject } from '../src/compile/compileProject';

describe('compileProject', () => {
	it('resolves included functions from raw project source before block compilation', async () => {
		const source = [
			'8f4e/v1',
			'',
			'includes',
			'include std/test/includedOne',
			'includesEnd',
			'',
			'entry main',
			'module target',
			'call includedOne',
			'drop',
			'moduleEnd',
			'entryEnd',
		].join('\n');

		const result = await compileProject(source, {
			compilerOptions: { startingMemoryWordAddress: 0 },
			resolveInclude: includeId =>
				includeId === 'std/test/includedOne'
					? ['function includedOne', '#export', 'push 1', 'functionEnd int'].join('\n')
					: undefined,
		});

		expect(result.compiledModules.target).toBeDefined();
	});
});
