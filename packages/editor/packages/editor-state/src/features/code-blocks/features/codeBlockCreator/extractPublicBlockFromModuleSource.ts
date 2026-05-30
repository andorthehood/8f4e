import { parse8f4eProject } from '@8f4e/tokenizer';

import { parseBlockDirectives } from '../../utils/parseBlockDirectives';
import removeDirective from '../../utils/removeDirective';

import type { ProjectCodeBlock } from '@8f4e/tokenizer';

import { FORMAT_HEADER } from '~/features/project-format';

const PUBLIC_BLOCK_DIRECTIVE = 'public';

function hasPublicDirective(block: ProjectCodeBlock): boolean {
	return parseBlockDirectives(block.code).some(
		directive => directive.prefix === '@' && directive.name === PUBLIC_BLOCK_DIRECTIVE
	);
}

export default function extractPublicBlockFromModuleSource(source: string): string[] {
	const lines = source.split('\n');
	if (lines[0]?.trim() !== FORMAT_HEADER) {
		return lines;
	}

	const project = parse8f4eProject(source);
	const [publicBlock] = project.codeBlocks.filter(block => block.entry !== 'test' && hasPublicDirective(block));

	return publicBlock ? removeDirective(publicBlock.code, PUBLIC_BLOCK_DIRECTIVE) : [];
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractPublicBlockFromModuleSource', () => {
		it('returns plain module source lines unchanged when no header is present', () => {
			expect(extractPublicBlockFromModuleSource('module foo\nmoduleEnd')).toEqual(['module foo', 'moduleEnd']);
		});

		it('returns the public block from module files', () => {
			expect(
				extractPublicBlockFromModuleSource('8f4e/v1\n\nentry main\nmodule foo\n; @public\nmoduleEnd\nentryEnd')
			).toEqual(['module foo', 'moduleEnd']);
		});

		it('returns the public non-test block from module files that include test entries', () => {
			const text = [
				'8f4e/v1',
				'',
				'function helper',
				'; @public',
				'functionEnd',
				'',
				'entry test',
				'module helperTest',
				'push 1',
				'push 1',
				'call assert',
				'moduleEnd',
				'entryEnd',
			].join('\n');

			expect(extractPublicBlockFromModuleSource(text)).toEqual(['function helper', 'functionEnd']);
		});

		it('filters out module files that only mark test entries public', () => {
			const text = [
				'8f4e/v1',
				'',
				'entry test',
				'module helperTest',
				'; @public',
				'push 1',
				'push 1',
				'call assert',
				'moduleEnd',
				'entryEnd',
			].join('\n');

			expect(extractPublicBlockFromModuleSource(text)).toEqual([]);
		});

		it('returns no block when a module file does not mark a public block', () => {
			const text = ['8f4e/v1', '', 'entry main', 'module helper', 'moduleEnd', 'entryEnd'].join('\n');

			expect(extractPublicBlockFromModuleSource(text)).toEqual([]);
		});
	});
}
