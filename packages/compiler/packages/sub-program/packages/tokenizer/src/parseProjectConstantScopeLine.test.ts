import { ArgumentType } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import { parseProjectConstantScopeLine } from './parseProjectConstantScopeLine';
import { SyntaxErrorCode } from './syntax/syntaxError';

describe('parseProjectConstantScopeLine', () => {
	it('parses project const declarations with compile-time expressions', () => {
		expect(parseProjectConstantScopeLine('const BLOCK_SIZE SAMPLE_RATE/1000', 4)).toMatchObject({
			instruction: 'const',
			lineNumber: 4,
			arguments: [
				{ type: ArgumentType.IDENTIFIER, value: 'BLOCK_SIZE', referenceKind: 'constant' },
				{ type: ArgumentType.COMPILE_TIME_EXPRESSION, operator: '/' },
			],
		});
	});

	it('parses one same-named pass argument and ignores inline comments', () => {
		expect(parseProjectConstantScopeLine('pass SAMPLE_RATE ; required by child', 7)).toEqual({
			instruction: 'pass',
			lineNumber: 7,
			arguments: [
				{
					type: ArgumentType.IDENTIFIER,
					value: 'SAMPLE_RATE',
					referenceKind: 'constant',
					scope: 'local',
				},
			],
		});
	});

	it.each([
		'pass',
		'pass SAMPLE_RATE RENAMED_RATE',
		'pass sampleRate',
		'pass 1',
	])('rejects invalid pass declaration %s', line => {
		expect(() => parseProjectConstantScopeLine(line, 9)).toThrow(
			expect.objectContaining({ line: expect.objectContaining({ lineNumber: 9, instruction: 'pass' }) })
		);
	});

	it('rejects instructions outside the project constant scope grammar', () => {
		expect(() => parseProjectConstantScopeLine('expose int value &source:value', 2)).toThrow(
			expect.objectContaining({ code: SyntaxErrorCode.UNRECOGNISED_INSTRUCTION })
		);
	});
});
