import { isProjectTestModule, parse8f4eProject } from '@8f4e/tokenizer';

import { FORMAT_HEADER } from '~/features/project-format';

export default function parseModuleSource(source: string): string[] {
	const lines = source.split('\n');
	if (lines[0]?.trim() !== FORMAT_HEADER) {
		return lines;
	}

	const project = parse8f4eProject(source);
	const [firstNonTestBlock] = project.codeBlocks.filter(block => !isProjectTestModule(block));

	return firstNonTestBlock?.code ?? [];
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseModuleSource', () => {
		it('returns plain module source lines unchanged when no header is present', () => {
			expect(parseModuleSource('module foo\nmoduleEnd')).toEqual(['module foo', 'moduleEnd']);
		});

		it('removes 8f4e/v1 header and following blank lines', () => {
			expect(parseModuleSource('8f4e/v1\n\nmodule foo\nmoduleEnd')).toEqual(['module foo', 'moduleEnd']);
		});

		it('returns the first non-test block from module files that include #test modules', () => {
			const text = [
				'8f4e/v1',
				'',
				'function helper',
				'functionEnd',
				'',
				'module helperTest',
				'#test',
				'push 1',
				'assert 1',
				'moduleEnd',
			].join('\n');

			expect(parseModuleSource(text)).toEqual(['function helper', 'functionEnd']);
		});

		it('filters out module files that only contain #test modules', () => {
			const text = ['8f4e/v1', '', 'module helperTest', '#test', 'push 1', 'assert 1', 'moduleEnd'].join('\n');

			expect(parseModuleSource(text)).toEqual([]);
		});
	});
}
