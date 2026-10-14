import { describe, expect, it } from 'vitest';
import { parseProjectMemoryBindingLine } from './parseProjectMemoryBindingLine';
import { SyntaxErrorCode } from './syntax/syntaxError';

describe('parseProjectMemoryBindingLine', () => {
	it('preserves structured references and accepts an inline comment', () => {
		expect(parseProjectMemoryBindingLine('bind &input &source:output ; connection', 4)).toMatchObject({
			lineNumber: 4,
			instruction: 'bind',
			arguments: [
				{ value: '&input', referenceKind: 'memory-reference', targetMemoryId: 'input' },
				{
					value: '&source:output',
					referenceKind: 'intermodular-reference',
					targetModuleId: 'source',
					targetMemoryId: 'output',
				},
			],
		});
	});

	it.each([
		'bind',
		'bind &input',
		'bind &input &source:output extra',
		'bind input &source:output',
		'bind &group:input &source:output',
		'bind &input output',
		'bind &input &output',
		'bind &input 42',
		'bind input& &source:output',
		'bind &input source:output&',
		'bind &input &outer/source:output',
		'bind &input &source:output+4',
	])('rejects unsupported binding syntax: %s', source => {
		expect(() => parseProjectMemoryBindingLine(source, 2)).toThrow(
			expect.objectContaining({
				code: SyntaxErrorCode.INVALID_PROJECT_MEMORY_BINDING,
				line: { lineNumber: 2, instruction: 'bind' },
			})
		);
	});
});
