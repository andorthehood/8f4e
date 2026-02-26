import parseLocalDirectives from '../local-directives/parseDirectives';

import type { CodeBlockGraphicData } from '~/types';

export interface BinaryAssetLoadDirective {
	assetId: string;
	memoryRef: string;
	codeBlockId: string;
}

export default function parseBinaryAssetLoads(codeBlocks: CodeBlockGraphicData[]): BinaryAssetLoadDirective[] {
	const loadDirectives: BinaryAssetLoadDirective[] = [];

	for (const codeBlock of codeBlocks) {
		const localDirectives =
			codeBlock.directives && codeBlock.directives.length > 0
				? codeBlock.directives
				: parseLocalDirectives(codeBlock.code);
		for (const directive of localDirectives) {
			if (directive.name !== 'loadAsset') {
				continue;
			}

			if (directive.args.length < 2) {
				continue;
			}

			const [assetId, memoryRef] = directive.args;
			if (!assetId || !memoryRef) {
				continue;
			}

			loadDirectives.push({ assetId, memoryRef, codeBlockId: codeBlock.id });
		}
	}

	return loadDirectives;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseBinaryAssetLoads', () => {
		it('parses load directives', () => {
			const codeBlocks = [
				{
					id: 'foo',
					code: ['module foo', '; @loadAsset kick &buffer', 'moduleEnd'],
				},
			] as CodeBlockGraphicData[];

			const result = parseBinaryAssetLoads(codeBlocks);
			expect(result).toEqual([{ assetId: 'kick', memoryRef: '&buffer', codeBlockId: 'foo' }]);
		});

		it('keeps all load directives in source order', () => {
			const codeBlocks = [
				{ id: 'a', code: ['module a', '; @loadAsset kick &a', 'moduleEnd'] },
				{ id: 'b', code: ['module b', '; @loadAsset snare &b', 'moduleEnd'] },
			] as CodeBlockGraphicData[];

			const result = parseBinaryAssetLoads(codeBlocks);
			expect(result).toEqual([
				{ assetId: 'kick', memoryRef: '&a', codeBlockId: 'a' },
				{ assetId: 'snare', memoryRef: '&b', codeBlockId: 'b' },
			]);
		});

		it('ignores malformed load directives', () => {
			const codeBlocks = [
				{ id: 'foo', code: ['module foo', '; @loadAsset onlyId', '; @loadAsset', 'moduleEnd'] },
			] as CodeBlockGraphicData[];

			const result = parseBinaryAssetLoads(codeBlocks);
			expect(result).toEqual([]);
		});
	});
}
