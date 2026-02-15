import { describe, it, expect } from 'vitest';

import parseFavorite from './codeParser';

describe('parseFavorite', () => {
	it('should return false for empty code', () => {
		expect(parseFavorite([])).toBe(false);
	});

	it('should return false for code without @favorite directive', () => {
		const code = ['module test', 'output out 1', 'moduleEnd'];
		expect(parseFavorite(code)).toBe(false);
	});

	it('should return true for code with @favorite directive', () => {
		const code = ['module test', '; @favorite', 'output out 1', 'moduleEnd'];
		expect(parseFavorite(code)).toBe(true);
	});

	it('should return true when @favorite is on first line', () => {
		const code = ['; @favorite', 'module test', 'output out 1', 'moduleEnd'];
		expect(parseFavorite(code)).toBe(true);
	});

	it('should return true when @favorite is on last line', () => {
		const code = ['module test', 'output out 1', 'moduleEnd', '; @favorite'];
		expect(parseFavorite(code)).toBe(true);
	});

	it('should handle @favorite with extra whitespace', () => {
		const code = ['module test', ';   @favorite', 'moduleEnd'];
		expect(parseFavorite(code)).toBe(true);
	});

	it('should handle @favorite with leading whitespace', () => {
		const code = ['module test', '  ; @favorite', 'moduleEnd'];
		expect(parseFavorite(code)).toBe(true);
	});

	it('should not match @favorite in non-comment lines', () => {
		const code = ['module test', '@favorite', 'moduleEnd'];
		expect(parseFavorite(code)).toBe(false);
	});

	it('should not match hash-style comments', () => {
		const code = ['module test', '# @favorite', 'moduleEnd'];
		expect(parseFavorite(code)).toBe(false);
	});

	it('should only match the first @favorite directive (others are redundant)', () => {
		const code = ['module test', '; @favorite', 'output out 1', '; @favorite', 'moduleEnd'];
		expect(parseFavorite(code)).toBe(true);
	});

	it('should not match @favoriteOther (strict word boundary)', () => {
		const code = ['module test', '; @favoriteOther', 'moduleEnd'];
		expect(parseFavorite(code)).toBe(false);
	});

	it('should ignore text after @favorite directive', () => {
		const code = ['module test', '; @favorite some extra text', 'moduleEnd'];
		expect(parseFavorite(code)).toBe(true);
	});

	it('should work with different block types', () => {
		expect(parseFavorite(['function test', '; @favorite', 'functionEnd'])).toBe(true);
		expect(parseFavorite(['comment', '; @favorite', 'commentEnd'])).toBe(true);
		expect(parseFavorite(['vertexShader postprocess', '; @favorite', 'vertexShaderEnd'])).toBe(true);
	});
});
