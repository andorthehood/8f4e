import { describe, it, expect } from 'vitest';

import { compileConfig } from '../index';

describe('compileConfig - append slot [] syntax', () => {
	it('should handle simple append slot with rescope', () => {
		const source = `
rescope "items[]"
push "first"
set

rescope "items[]"
push "second"
set
`;
		const result = compileConfig([source]);
		expect(result.config).toEqual({
			items: ['first', 'second'],
		});
	});

	it('should handle append slot with property', () => {
		const source = `
rescope "items[].name"
push "first"
set

rescope "items[].name"
push "second"
set
`;
		const result = compileConfig([source]);
		expect(result.config).toEqual({
			items: [{ name: 'first' }, { name: 'second' }],
		});
	});

	it('should handle append slot with multiple properties', () => {
		const source = `
rescope "items[]"
scope "name"
push "Item 1"
set

rescope "items[]"
scope "name"
push "Item 2"
set
`;
		const result = compileConfig([source]);
		expect(result.config).toEqual({
			items: [{ name: 'Item 1' }, { name: 'Item 2' }],
		});
	});

	it('should handle append slot with complex objects', () => {
		const source = `
rescope "items[]"
scope "id"
push 1
set

rescopeTop "data.name"
push "First"
set

rescope "items[]"
scope "id"
push 2
set

rescopeTop "data.name"
push "Second"
set
`;
		const result = compileConfig([source]);
		expect(result.config).toEqual({
			items: [
				{ id: 1, data: { name: 'First' } },
				{ id: 2, data: { name: 'Second' } },
			],
		});
	});

	it('should handle the binaryAssets example from the todo', () => {
		const source = `
rescope "binaryAssets[]"

const PROTOCOL "https://"
const DOMAIN "llllllllllll.com"
const SUBDOMAIN "static"
const PATH "/andor/8f4e/"
const SAMPLE "amen"
const BPM "170bpm"
const RES "8bit"
const SIGNEDNESS "unsigned"
const EXT ".pcm"

scope "url"
push PROTOCOL
push SUBDOMAIN
push "."
push DOMAIN
push PATH
push SAMPLE
push "_"
push BPM
push "_"
push RES
push "_"
push SIGNEDNESS
push EXT
concat
set

rescope "memoryId"
push "pcmPlayer8bit.buffer"
set
`;
		const result = compileConfig([source]);
		expect(result.config).toEqual({
			binaryAssets: [
				{
					url: 'https://static.llllllllllll.com/andor/8f4e/amen_170bpm_8bit_unsigned.pcm',
				},
			],
			memoryId: 'pcmPlayer8bit.buffer',
		});
	});

	it('should handle multiple binaryAssets with append slot', () => {
		const source = `
rescope "binaryAssets[]"
scope "url"
push "https://example.com/file1.pcm"
set

rescope "binaryAssets[]"
scope "url"
push "https://example.com/file2.pcm"
set
`;
		const result = compileConfig([source]);
		expect(result.config).toEqual({
			binaryAssets: [{ url: 'https://example.com/file1.pcm' }, { url: 'https://example.com/file2.pcm' }],
		});
	});

	it('should handle append slot with nested arrays', () => {
		const source = `
rescope "items[]"
scope "tags[]"
push "tag1"
set

rescope "items[]"
scope "tags[]"
push "tag2"
set
`;
		const result = compileConfig([source]);
		expect(result.config).toEqual({
			items: [{ tags: ['tag1'] }, { tags: ['tag2'] }],
		});
	});

	it('should handle mixed numeric and append slot indices', () => {
		const source = `
rescope "items[0]"
push "first"
set

rescope "items[]"
push "appended"
set
`;
		const result = compileConfig([source]);
		expect(result.config).toEqual({
			items: ['first', 'appended'],
		});
	});
});
