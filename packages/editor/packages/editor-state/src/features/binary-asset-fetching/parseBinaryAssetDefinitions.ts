import parseDirectives from '../global-directives/parseDirectives';

import type { ParsedDirective } from '../global-directives/types';
import type { CodeBlockGraphicData } from '../code-blocks/types';

export interface BinaryAssetDefinition {
	id: string;
	url: string;
}

export default function parseBinaryAssetDefinitions(directives: ParsedDirective[]): Map<string, BinaryAssetDefinition> {
	const definitionsById = new Map<string, BinaryAssetDefinition>();

	for (const directive of directives) {
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

			const result = parseBinaryAssetDefinitions(parseDirectives(codeBlocks));
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

			const result = parseBinaryAssetDefinitions(parseDirectives(codeBlocks));
			expect(result.get('kick')).toEqual({ id: 'kick', url: 'https://example.com/new.pcm' });
		});

		it('ignores malformed definitions', () => {
			const codeBlocks = [
				{
					id: 'foo',
					code: ['module foo', '; @defAsset onlyId', '; @defAsset', 'moduleEnd'],
				},
			] as CodeBlockGraphicData[];

			const result = parseBinaryAssetDefinitions(parseDirectives(codeBlocks));
			expect(result.size).toBe(0);
		});
	});
}
