import parseLocalDirectives from '../code-blocks/features/local-directives/parseDirectives';

import type { CodeBlockGraphicData } from '~/types';

export interface BinaryAssetDefinition {
	id: string;
	url: string;
}

export interface BinaryAssetLoadDirective {
	assetId: string;
	memoryRef: string;
	codeBlockId: string;
}

export interface ParsedBinaryAssetDirectives {
	definitionsById: Map<string, BinaryAssetDefinition>;
	loadDirectives: BinaryAssetLoadDirective[];
}

export default function parseBinaryAssetDirectives(codeBlocks: CodeBlockGraphicData[]): ParsedBinaryAssetDirectives {
	const definitionsById = new Map<string, BinaryAssetDefinition>();
	const loadDirectives: BinaryAssetLoadDirective[] = [];

	for (const codeBlock of codeBlocks) {
		const localDirectives =
			codeBlock.directives && codeBlock.directives.length > 0
				? codeBlock.directives
				: parseLocalDirectives(codeBlock.code);
		for (const directive of localDirectives) {
			if (directive.name === 'defAsset') {
				// Keep legacy behavior: directives without an argument segment are ignored.
				if (directive.argText === null || directive.args.length < 2) {
					continue;
				}

				const [id, url] = directive.args;
				if (!id || !url) {
					continue;
				}

				definitionsById.set(id, { id, url });
				continue;
			}

			if (directive.name === 'loadAsset') {
				// Keep legacy behavior: directives without an argument segment are ignored.
				if (directive.argText === null || directive.args.length < 2) {
					continue;
				}

				const [assetId, memoryRef] = directive.args;
				if (!assetId || !memoryRef) {
					continue;
				}

				loadDirectives.push({ assetId, memoryRef, codeBlockId: codeBlock.id });
			}
		}
	}

	return { definitionsById, loadDirectives };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseBinaryAssetDirectives', () => {
		it('parses definitions and load directives', () => {
			const codeBlocks = [
				{
					id: 'foo',
					code: [
						'module foo',
						'; @defAsset kick https://example.com/kick.pcm',
						'; @loadAsset kick &buffer',
						'moduleEnd',
					],
				},
			] as CodeBlockGraphicData[];

			const result = parseBinaryAssetDirectives(codeBlocks);

			expect([...result.definitionsById.values()]).toEqual([{ id: 'kick', url: 'https://example.com/kick.pcm' }]);
			expect(result.loadDirectives).toEqual([{ assetId: 'kick', memoryRef: '&buffer', codeBlockId: 'foo' }]);
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

			const result = parseBinaryAssetDirectives(codeBlocks);
			expect(result.definitionsById.get('kick')).toEqual({ id: 'kick', url: 'https://example.com/new.pcm' });
		});

		it('ignores malformed directives', () => {
			const codeBlocks = [
				{
					id: 'foo',
					code: ['module foo', '; @defAsset onlyId', '; @loadAsset onlyId', '; @plot buffer -1 1', 'moduleEnd'],
				},
			] as CodeBlockGraphicData[];

			const result = parseBinaryAssetDirectives(codeBlocks);
			expect(result.definitionsById.size).toBe(0);
			expect(result.loadDirectives).toEqual([]);
		});
	});
}
