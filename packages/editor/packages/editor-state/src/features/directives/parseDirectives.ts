import type { CodeBlockGraphicData } from '~/types';

export interface ParsedDirective {
	name: string;
	args: string[];
	codeBlockId: string;
	codeBlockCreationId: number;
	lineNumber: number;
	sourceOrder: number;
	rawLine: string;
	argText: string | null;
}

export default function parseDirectives(codeBlocks: CodeBlockGraphicData[]): ParsedDirective[] {
	const directives: ParsedDirective[] = [];
	let sourceOrder = 0;

	for (const codeBlock of codeBlocks) {
		for (let lineIndex = 0; lineIndex < codeBlock.code.length; lineIndex++) {
			const rawLine = codeBlock.code[lineIndex];
			const commentMatch = rawLine.match(/^\s*;\s*@(\w+)(?:\s+(.*))?$/);
			if (!commentMatch) {
				continue;
			}

			const argText = commentMatch[2] ?? null;
			const trimmedArgText = argText?.trim() ?? '';
			const args = trimmedArgText.length > 0 ? trimmedArgText.split(/\s+/) : [];

			directives.push({
				name: commentMatch[1],
				args,
				codeBlockId: codeBlock.id,
				codeBlockCreationId: codeBlock.creationIndex ?? -1,
				lineNumber: lineIndex + 1,
				sourceOrder,
				rawLine,
				argText,
			});
			sourceOrder += 1;
		}
	}

	return directives;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseDirectives', () => {
		it('parses directive records with source metadata', () => {
			const codeBlocks = [
				{
					id: 'a',
					creationIndex: 4,
					code: ['module a', '; @color text.code #ff00ff', '; @favorite', 'moduleEnd'],
				},
			] as CodeBlockGraphicData[];

			const result = parseDirectives(codeBlocks);

			expect(result).toEqual([
				{
					name: 'color',
					args: ['text.code', '#ff00ff'],
					codeBlockId: 'a',
					codeBlockCreationId: 4,
					lineNumber: 2,
					sourceOrder: 0,
					rawLine: '; @color text.code #ff00ff',
					argText: 'text.code #ff00ff',
				},
				{
					name: 'favorite',
					args: [],
					codeBlockId: 'a',
					codeBlockCreationId: 4,
					lineNumber: 3,
					sourceOrder: 1,
					rawLine: '; @favorite',
					argText: null,
				},
			]);
		});

		it('keeps sourceOrder stable across blocks', () => {
			const codeBlocks = [
				{
					id: 'a',
					creationIndex: 1,
					code: ['; @one x', '; @two y'],
				},
				{
					id: 'b',
					creationIndex: 2,
					code: ['; @three z'],
				},
			] as CodeBlockGraphicData[];

			const result = parseDirectives(codeBlocks);

			expect(result.map(item => item.name)).toEqual(['one', 'two', 'three']);
			expect(result.map(item => item.sourceOrder)).toEqual([0, 1, 2]);
		});
	});
}
