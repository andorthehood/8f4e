import { describe, it, expect } from 'vitest';

import { serializeGroupToClipboard, parseClipboardData } from './clipboardUtils';

import { extractGroupName } from '../group/extractGroupName';

import { createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';

describe('serializeGroupToClipboard', () => {
	it('should serialize group blocks with relative coordinates', () => {
		const anchor = createMockCodeBlock({
			code: ['module foo', 'moduleEnd'],
			gridX: 10,
			gridY: 20,
		});

		const block2 = createMockCodeBlock({
			code: ['module bar', 'moduleEnd'],
			gridX: 22,
			gridY: 24,
		});

		const result = serializeGroupToClipboard([anchor, block2], anchor);
		const parsed = JSON.parse(result);

		expect(parsed).toHaveLength(2);
		expect(parsed[0]).toEqual({
			code: ['module foo', 'moduleEnd'],
			gridCoordinates: { x: 0, y: 0 },
		});
		expect(parsed[1]).toEqual({
			code: ['module bar', 'moduleEnd'],
			gridCoordinates: { x: 12, y: 4 },
		});
	});

	it('should include disabled flag when true', () => {
		const anchor = createMockCodeBlock({
			code: ['module foo', 'moduleEnd'],
			gridX: 0,
			gridY: 0,
			disabled: true,
		});

		const result = serializeGroupToClipboard([anchor], anchor);
		const parsed = JSON.parse(result);

		expect(parsed[0].disabled).toBe(true);
	});

	it('should not include disabled flag when false', () => {
		const anchor = createMockCodeBlock({
			code: ['module foo', 'moduleEnd'],
			gridX: 0,
			gridY: 0,
			disabled: false,
		});

		const result = serializeGroupToClipboard([anchor], anchor);
		const parsed = JSON.parse(result);

		expect(parsed[0].disabled).toBeUndefined();
	});

	it('should handle negative relative coordinates', () => {
		const anchor = createMockCodeBlock({
			code: ['module anchor', 'moduleEnd'],
			gridX: 10,
			gridY: 10,
		});

		const block2 = createMockCodeBlock({
			code: ['module left', 'moduleEnd'],
			gridX: 5,
			gridY: 8,
		});

		const result = serializeGroupToClipboard([anchor, block2], anchor);
		const parsed = JSON.parse(result);

		expect(parsed[1].gridCoordinates).toEqual({ x: -5, y: -2 });
	});

	it('should preserve exact code lines including empty lines', () => {
		const anchor = createMockCodeBlock({
			code: ['module test', '', '; comment', '', 'moduleEnd'],
			gridX: 0,
			gridY: 0,
		});

		const result = serializeGroupToClipboard([anchor], anchor);
		const parsed = JSON.parse(result);

		expect(parsed[0].code).toEqual(['module test', '', '; comment', '', 'moduleEnd']);
	});
});

describe('parseClipboardData', () => {
	describe('multi-block detection', () => {
		it('should parse valid multi-block JSON array', () => {
			const clipboardText = JSON.stringify([
				{ code: ['module foo', 'moduleEnd'], gridCoordinates: { x: 0, y: 0 } },
				{ code: ['module bar', 'moduleEnd'], gridCoordinates: { x: 12, y: 4 } },
			]);

			const result = parseClipboardData(clipboardText);

			expect(result.type).toBe('multi');
			if (result.type === 'multi') {
				expect(result.blocks).toHaveLength(2);
				expect(result.blocks[0].code).toEqual(['module foo', 'moduleEnd']);
				expect(result.blocks[1].gridCoordinates).toEqual({ x: 12, y: 4 });
			}
		});

		it('should parse multi-block with disabled flag', () => {
			const clipboardText = JSON.stringify([
				{ code: ['module foo', 'moduleEnd'], gridCoordinates: { x: 0, y: 0 }, disabled: true },
				{ code: ['module bar', 'moduleEnd'], gridCoordinates: { x: 12, y: 4 }, disabled: false },
			]);

			const result = parseClipboardData(clipboardText);

			expect(result.type).toBe('multi');
			if (result.type === 'multi') {
				expect(result.blocks[0].disabled).toBe(true);
				expect(result.blocks[1].disabled).toBe(false);
			}
		});
	});

	describe('single-block fallback', () => {
		it('should fallback to single-block for plain text', () => {
			const clipboardText = 'module test\n\nmoduleEnd';

			const result = parseClipboardData(clipboardText);

			expect(result.type).toBe('single');
			if (result.type === 'single') {
				expect(result.text).toBe(clipboardText);
			}
		});

		it('should fallback to single-block for invalid JSON', () => {
			const clipboardText = '{invalid json';

			const result = parseClipboardData(clipboardText);

			expect(result.type).toBe('single');
		});

		it('should fallback to single-block for JSON array with only 1 item', () => {
			const clipboardText = JSON.stringify([{ code: ['module foo', 'moduleEnd'], gridCoordinates: { x: 0, y: 0 } }]);

			const result = parseClipboardData(clipboardText);

			expect(result.type).toBe('single');
		});

		it('should fallback to single-block for JSON array with 0 items', () => {
			const clipboardText = JSON.stringify([]);

			const result = parseClipboardData(clipboardText);

			expect(result.type).toBe('single');
		});

		it('should fallback to single-block for JSON non-array', () => {
			const clipboardText = JSON.stringify({ code: ['module foo', 'moduleEnd'] });

			const result = parseClipboardData(clipboardText);

			expect(result.type).toBe('single');
		});

		it('should fallback to single-block when array items missing required fields', () => {
			const clipboardText = JSON.stringify([
				{ code: ['module foo', 'moduleEnd'] }, // Missing gridCoordinates
				{ code: ['module bar', 'moduleEnd'], gridCoordinates: { x: 12, y: 4 } },
			]);

			const result = parseClipboardData(clipboardText);

			expect(result.type).toBe('single');
		});

		it('should fallback to single-block when code is not an array', () => {
			const clipboardText = JSON.stringify([
				{ code: 'not an array', gridCoordinates: { x: 0, y: 0 } },
				{ code: ['module bar', 'moduleEnd'], gridCoordinates: { x: 12, y: 4 } },
			]);

			const result = parseClipboardData(clipboardText);

			expect(result.type).toBe('single');
		});

		it('should fallback to single-block when code contains non-strings', () => {
			const clipboardText = JSON.stringify([
				{ code: ['module foo', 123], gridCoordinates: { x: 0, y: 0 } },
				{ code: ['module bar', 'moduleEnd'], gridCoordinates: { x: 12, y: 4 } },
			]);

			const result = parseClipboardData(clipboardText);

			expect(result.type).toBe('single');
		});

		it('should fallback to single-block when gridCoordinates is missing x or y', () => {
			const clipboardText = JSON.stringify([
				{ code: ['module foo', 'moduleEnd'], gridCoordinates: { x: 0 } },
				{ code: ['module bar', 'moduleEnd'], gridCoordinates: { x: 12, y: 4 } },
			]);

			const result = parseClipboardData(clipboardText);

			expect(result.type).toBe('single');
		});

		it('should fallback to single-block when disabled is not boolean', () => {
			const clipboardText = JSON.stringify([
				{ code: ['module foo', 'moduleEnd'], gridCoordinates: { x: 0, y: 0 }, disabled: 'true' },
				{ code: ['module bar', 'moduleEnd'], gridCoordinates: { x: 12, y: 4 } },
			]);

			const result = parseClipboardData(clipboardText);

			expect(result.type).toBe('single');
		});
	});
});

describe('extractGroupName', () => {
	it('should extract group name from code with @group directive', () => {
		const code = ['module test', '; @group audio-chain', 'moduleEnd'];

		const groupName = extractGroupName(code);

		expect(groupName).toBe('audio-chain');
	});

	it('should return undefined when no @group directive', () => {
		const code = ['module test', 'moduleEnd'];

		const groupName = extractGroupName(code);

		expect(groupName).toBeUndefined();
	});

	it('should extract group name ignoring sticky flag', () => {
		const code = ['module test', '; @group audio-chain sticky', 'moduleEnd'];

		const groupName = extractGroupName(code);

		expect(groupName).toBe('audio-chain');
	});
});
