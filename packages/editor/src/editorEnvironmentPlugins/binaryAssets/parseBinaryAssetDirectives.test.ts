import { describe, expect, it } from 'vitest';

import parseBinaryAssetDirectives from './parseBinaryAssetDirectives';

import type { CodeBlockGraphicData } from '@8f4e/editor-state-types';

describe('parseBinaryAssetDirectives', () => {
	it('parses definitions and load directives', () => {
		const codeBlocks = [
			{
				id: 'module_foo',
				moduleId: 'foo',
				code: ['module foo', '; @defAsset kick https://example.com/kick.pcm', '; @loadAsset kick &buffer', 'moduleEnd'],
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
				code: ['module foo', '; @defAsset onlyId', '; @loadAsset onlyId', '; @plot &buffer', 'moduleEnd'],
			},
		] as CodeBlockGraphicData[];

		const result = parseBinaryAssetDirectives(codeBlocks);
		expect(result.definitionsById.size).toBe(0);
		expect(result.loadDirectives).toEqual([]);
	});
});
