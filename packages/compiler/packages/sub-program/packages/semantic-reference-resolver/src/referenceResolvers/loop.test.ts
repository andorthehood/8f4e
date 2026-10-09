import type { CompileTimeValueArgument, LoopLine, ResolvedLoopLine } from '@8f4e/language-spec';
import { ArgumentType, ErrorCode } from '@8f4e/language-spec';
import { createCompilationContext } from '@8f4e/semantic-utils';
import { parseArgument } from '@8f4e/tokenizer';
import { describe, expect, it } from 'vitest';
import type { ReferenceResolutionContext } from '../context';
import resolveLineReferences from '../resolveLineReferences';

describe('resolved loop caps', () => {
	it.each([
		{ cap: undefined, directive: undefined, expected: 1000 },
		{ cap: undefined, directive: 25, expected: 25 },
		{ cap: '8', directive: 25, expected: 8 },
		{ cap: '0', directive: 25, expected: 0 },
		{ cap: '4*4', directive: undefined, expected: 16 },
	])('resolves $cap with directive $directive to $expected', ({ cap, directive, expected }) => {
		const context = createCompilationContext<ReferenceResolutionContext>({ loopCap: directive });
		const line: LoopLine = {
			instruction: 'loop',
			lineNumber: 7,
			arguments: cap === undefined ? [] : [parseArgument(cap) as CompileTimeValueArgument],
		};
		const resolved: ResolvedLoopLine = resolveLineReferences(line, context);

		expect(resolved.arguments).toEqual([{ type: ArgumentType.LITERAL, value: expected, isInteger: true }]);
		expect(line.arguments).toHaveLength(cap === undefined ? 0 : 1);
	});

	it.each([
		{ cap: '1.5', code: ErrorCode.TYPE_MISMATCH },
		{ cap: '-1', code: ErrorCode.EXPECTED_VALUE },
		{ cap: 'MISSING', code: ErrorCode.UNDECLARED_IDENTIFIER },
	])('rejects $cap during semantic resolution', ({ cap, code }) => {
		const context = createCompilationContext<ReferenceResolutionContext>();
		const line: LoopLine = {
			instruction: 'loop',
			lineNumber: 7,
			arguments: [parseArgument(cap) as CompileTimeValueArgument],
		};

		expect(() => resolveLineReferences(line, context)).toThrow(String(code));
	});
});
