import { describe, expect, it } from 'vitest';
import highlightSyntaxGlsl from './highlightSyntaxGlsl';
import { syntaxFonts } from './testUtils';

describe('highlightSyntaxGlsl', () => {
	it('highlights keywords, numbers, comments, and preprocessors', () => {
		const line = 'uniform float value = 1.0; // comment';
		const [colors, preprocessor] = highlightSyntaxGlsl([line, '#version 300 es'], syntaxFonts);

		expect(colors[0]).toBe('instruction');
		expect(colors[7]).toBe('code');
		expect(colors[line.indexOf('1.0')]).toBe('number');
		expect(colors[line.indexOf('//')]).toBe('comment');
		expect(preprocessor[0]).toBe('instruction');
	});
});
