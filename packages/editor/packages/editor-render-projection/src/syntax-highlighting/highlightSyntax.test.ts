import { describe, expect, it } from 'vitest';
import highlightSyntax from './highlightSyntax';
import { syntaxFonts } from './testUtils';

describe('highlightSyntax', () => {
	it('selects GLSL highlighting for shader notes', () => {
		const result = highlightSyntax(['note fragmentShaderBackground', 'uniform float value'], 'note', syntaxFonts);

		expect(result[1][0]).toBe('instruction');
	});

	it('selects note highlighting for regular notes', () => {
		const result = highlightSyntax(['note', 'uniform float value'], 'note', syntaxFonts);

		expect(result[1][0]).toBe('comment');
	});
});
