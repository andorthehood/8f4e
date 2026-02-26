import { peekStackOperands } from './peekStackOperands';
import { validateArgumentTypes } from './validateArgumentTypes';
import { validateOperandTypes } from './validateOperandTypes';
import { validateScope } from './validateScope';

import { ArgumentType, BLOCK_TYPE, type InstructionCompiler } from '../types';
import { ErrorCode, getError } from '../errors';
import { isInstructionIsInsideBlock } from '../utils/blockStack';

import type { ValidationSpec } from './types';

export function withValidation(spec: ValidationSpec, compiler: InstructionCompiler): InstructionCompiler {
	return function (line, context) {
		const insideConstantsBlock = isInstructionIsInsideBlock(context.blockStack, BLOCK_TYPE.CONSTANTS);
		if (insideConstantsBlock && !spec.allowedInConstantsBlocks) {
			throw getError(ErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK, line, context);
		}

		const insideMapBlock = isInstructionIsInsideBlock(context.blockStack, BLOCK_TYPE.MAP);
		if (insideMapBlock && !spec.allowedInMapBlocks) {
			throw getError(ErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK, line, context);
		}

		if (spec.scope) {
			validateScope(
				context.blockStack,
				spec.scope,
				line,
				context,
				spec.onInvalidScope ?? ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK
			);
		}

		if (spec.minArguments !== undefined && line.arguments.length < spec.minArguments) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (spec.argumentTypes) {
			validateArgumentTypes(line.arguments, spec.argumentTypes, line, context);
		}

		const validatedOperands = spec.validateOperands?.(line, context);
		const operandsNeeded = validatedOperands?.minOperands ?? spec.minOperands ?? 0;
		const operandTypes = validatedOperands?.operandTypes ?? spec.operandTypes;

		if (operandsNeeded > 0) {
			const operands = peekStackOperands(context.stack, operandsNeeded);

			if (operands.length < operandsNeeded) {
				throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
			}

			if (operandTypes) {
				validateOperandTypes(operands, operandTypes, line, context);
			}
		}

		return compiler(line, context);
	};
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	const line: Parameters<InstructionCompiler>[0] = {
		lineNumber: 1,
		instruction: 'test' as never,
		arguments: [],
	};

	const createContext = () =>
		({
			blockStack: [{ hasExpectedResult: false, expectedResultIsInteger: false, blockType: BLOCK_TYPE.MODULE }],
			stack: [],
		}) as unknown as Parameters<InstructionCompiler>[1];

	describe('withValidation (in-source)', () => {
		it('calls compiler when validation passes', () => {
			const compiler = withValidation({ minOperands: 1 }, (_line, context) => {
				context.stack.push({ isInteger: true });
				return context;
			});
			const context = createContext();
			context.stack.push({ isInteger: true });

			expect(() => compiler(line, context)).not.toThrow();
			expect(context.stack).toHaveLength(2);
		});

		it('rejects instructions in constants blocks by default', () => {
			const compiler = withValidation({}, (_line, context) => context);
			const context = createContext();
			context.blockStack = [
				{ hasExpectedResult: false, expectedResultIsInteger: false, blockType: BLOCK_TYPE.CONSTANTS },
			];

			expect(() => compiler(line, context)).toThrow();
		});

		it('prefers validateOperands output over static spec', () => {
			const compiler = withValidation(
				{
					minOperands: 2,
					operandTypes: 'float',
					validateOperands: () => ({ minOperands: 1, operandTypes: 'int' }),
				},
				(_line, context) => context
			);
			const context = createContext();
			context.stack.push({ isInteger: true });

			expect(() => compiler(line, context)).not.toThrow();
		});

		it('validates argument types when configured', () => {
			const compiler = withValidation({ argumentTypes: 'identifier' }, (_line, context) => context);
			const context = createContext();
			const identifierLine: Parameters<InstructionCompiler>[0] = {
				...line,
				arguments: [{ type: ArgumentType.IDENTIFIER, value: 'arg' }],
			};

			expect(() => compiler(identifierLine, context)).not.toThrow();
		});
	});
}
