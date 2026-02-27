import type { CodeBlockGraphicData } from '~/types';

export interface BinaryAssetDefinition {
	id: string;
	url: string;
}

export interface BinaryAssetLoadDirective {
	assetId: string;
	memoryRef: string;
	moduleId?: string;
}

export interface ParsedBinaryAssetDirectives {
	definitionsById: Map<string, BinaryAssetDefinition>;
	loadDirectives: BinaryAssetLoadDirective[];
}

export default function parseBinaryAssetDirectives(codeBlocks: CodeBlockGraphicData[]): ParsedBinaryAssetDirectives {
	const definitionsById = new Map<string, BinaryAssetDefinition>();
	const loadDirectives: BinaryAssetLoadDirective[] = [];

	for (const codeBlock of codeBlocks) {
		for (const line of codeBlock.code) {
			const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.*)/);
			if (!commentMatch) {
				continue;
			}

			const directive = commentMatch[1];
			const args = commentMatch[2].trim().split(/\s+/);

			if (directive === 'defAsset') {
				if (args.length < 2) {
					continue;
				}

				const [id, url] = args;
				if (!id || !url) {
					continue;
				}

				definitionsById.set(id, { id, url });
				continue;
			}

			if (directive === 'loadAsset') {
				if (args.length < 2) {
					continue;
				}

				const [assetId, memoryRef] = args;
				if (!assetId || !memoryRef) {
					continue;
				}

				loadDirectives.push({ assetId, memoryRef, moduleId: codeBlock.moduleId });
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
					id: 'module_foo',
					moduleId: 'foo',
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
			expect(result.loadDirectives).toEqual([{ assetId: 'kick', memoryRef: '&buffer', moduleId: 'foo' }]);
		});

		it('uses last definition for duplicate ids', () => {
			const codeBlocks = [
				{
					id: 'defs',
					code: [
						'module defs',
						'; @defAsset kick https://example.com/old.pcm',
						'; @defAsset kick https://example.com/new.pcm',
						'moduleEnd',
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
