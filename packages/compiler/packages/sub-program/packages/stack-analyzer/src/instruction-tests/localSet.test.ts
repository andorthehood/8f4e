import type { FunctionValueType, ResolvedLocalSetLine } from '@8f4e/language-spec';
import { ArgumentType, ErrorCode } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import createStackAnalyzerTestContext from '../../tests/testUtils';
import { analyzeInstruction } from '../analyzeInstruction';

function localSetLine(type: FunctionValueType): ResolvedLocalSetLine {
	return {
		lineNumber: 7,
		instruction: 'localSet',
		arguments: [{ type: ArgumentType.IDENTIFIER, value: 'target', referenceKind: 'plain', scope: 'local' }],
		binding: { id: 0, name: 'target', type },
	};
}

describe('localSet stack analysis', () => {
	it.each([
		{ type: 'int', local: { isInteger: true }, valueType: 'int' },
		{ type: 'float', local: { isInteger: false }, valueType: 'float' },
		{ type: 'float', local: { isInteger: false, isFloat64: false }, valueType: 'float' },
		{ type: 'float64', local: { isInteger: false, isFloat64: true }, valueType: 'float64' },
		{
			type: 'float64*',
			local: { isInteger: true, isFloat64: false, pointeeBaseType: 'float64', pointerDepth: 1 },
			valueType: 'int',
		},
	] as const)('consumes only the assigned $valueType value for a $type local', ({ type, local, valueType }) => {
		const context = createStackAnalyzerTestContext({ locals: { 0: local } });
		const previous = { kind: 'value', valueType: 'int', isNonZero: false } as const;
		const operand = { kind: 'value', valueType, isNonZero: false } as const;
		context.stack.push(previous, operand);

		const facts = analyzeInstruction(localSetLine(type), context);

		expect(context.stack).toEqual([previous]);
		expect(facts.stackAnalysis.consumedOperands).toEqual([operand]);
		expect(facts.stackAnalysis.producedStackItems).toEqual([]);
	});

	it.each([
		{ type: 'float', local: { isInteger: false }, valueType: 'float64', code: ErrorCode.MIXED_FLOAT_WIDTH },
		{
			type: 'float64',
			local: { isInteger: false, isFloat64: true },
			valueType: 'float',
			code: ErrorCode.MIXED_FLOAT_WIDTH,
		},
		{ type: 'int', local: { isInteger: true }, valueType: 'float', code: ErrorCode.ONLY_INTEGERS },
		{ type: 'int', local: { isInteger: true }, valueType: 'float64', code: ErrorCode.ONLY_INTEGERS },
		{ type: 'float', local: { isInteger: false }, valueType: 'int', code: ErrorCode.ONLY_FLOATS },
		{
			type: 'float64',
			local: { isInteger: false, isFloat64: true },
			valueType: 'int',
			code: ErrorCode.ONLY_FLOATS,
		},
	] as const)(
		'rejects $valueType assigned to $type with the source instruction',
		({ type, local, valueType, code }) => {
			const context = createStackAnalyzerTestContext({ locals: { 0: local } });
			context.stack.push({ kind: 'value', valueType, isNonZero: false });
			const line = localSetLine(type);

			expect(() => analyzeInstruction(line, context)).toThrow(
				expect.objectContaining({ code, line, context: expect.objectContaining({ codeBlockId: 'test' }) })
			);
		}
	);
});
