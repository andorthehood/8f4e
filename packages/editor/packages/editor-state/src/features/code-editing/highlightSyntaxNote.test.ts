import { describe, expect, it } from 'vitest';
import highlightSyntaxNote from './highlightSyntaxNote';

const spriteLookups = {
	fontLineNumber: 'line',
	fontInstruction: 'instruction',
	fontCode: 'code',
	fontCodeComment: 'comment',
	fontNumbers: 'number',
	fontBinaryZero: 'zero',
	fontBinaryOne: 'one',
	fontBasePrefix: 'prefix',
} as const;

describe('highlightSyntaxNote', () => {
	it('renders note bodies as comments while keeping note delimiters as instructions', () => {
		const result = highlightSyntaxNote(['note', 'todo: this is a note', '; @pos 10 20', 'noteEnd'], spriteLookups);

		expect(result[0][0]).toBe('instruction');
		expect(result[1][0]).toBe('comment');
		expect(result[2][0]).toBe('comment');
		expect(result[2][2]).toBe('code');
		expect(result[2][3]).toBe('comment');
		expect(result[3][0]).toBe('instruction');
	});

	it('preserves indentation while coloring note delimiters as instructions', () => {
		const result = highlightSyntaxNote(['  note', '\tindented body', '  noteEnd'], spriteLookups);

		expect(result[0][2]).toBe('instruction');
		expect(result[1][0]).toBe('comment');
		expect(result[2][2]).toBe('instruction');
	});
});
