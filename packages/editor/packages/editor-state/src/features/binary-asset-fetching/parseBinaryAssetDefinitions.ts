import parseLocalDirectives from '../code-blocks/features/local-directives/parseDirectives';

import type { CodeBlockGraphicData } from '~/types';

export interface BinaryAssetDefinition {
	id: string;
	url: string;
}

export default function parseBinaryAssetDefinitions(
	codeBlocks: CodeBlockGraphicData[]
): Map<string, BinaryAssetDefinition> {
	const definitionsById = new Map<string, BinaryAssetDefinition>();

	for (const codeBlock of codeBlocks) {
		const localDirectives =
			codeBlock.directives && codeBlock.directives.length > 0
				? codeBlock.directives
				: parseLocalDirectives(codeBlock.code);
		for (const directive of localDirectives) {
			if (directive.name !== 'defAsset') {
				continue;
			}

			if (directive.args.length < 2) {
				continue;
			}

			const [id, url] = directive.args;
			if (!id || !url) {
				continue;
			}

			// Last one wins by insertion order.
			definitionsById.set(id, { id, url });
		}
	}

	return definitionsById;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseBinaryAssetDefinitions', () => {
		it('parses definition directives', () => {
			const codeBlocks = [
				{
					id: 'foo',
					code: ['module foo', '; @defAsset kick https://example.com/kick.pcm', 'moduleEnd'],
				},
			] as CodeBlockGraphicData[];

			const result = parseBinaryAssetDefinitions(codeBlocks);
			expect([...result.values()]).toEqual([{ id: 'kick', url: 'https://example.com/kick.pcm' }]);
		});

		it('uses last definition for duplicate ids', () => {
			const codeBlocks = [
				{
					id: 'defs',
					code: [
						'comment',
						'; @defAsset kick https://example.com/old.pcm',
						'; @defAsset kick https://example.com/new.pcm',
						'commentEnd',
					],
				},
			] as CodeBlockGraphicData[];

			const result = parseBinaryAssetDefinitions(codeBlocks);
			expect(result.get('kick')).toEqual({ id: 'kick', url: 'https://example.com/new.pcm' });
		});

		it('ignores malformed definitions', () => {
			const codeBlocks = [
				{
					id: 'foo',
					code: ['module foo', '; @defAsset onlyId', '; @defAsset', 'moduleEnd'],
				},
			] as CodeBlockGraphicData[];

			const result = parseBinaryAssetDefinitions(codeBlocks);
			expect(result.size).toBe(0);
		});
	});
}
