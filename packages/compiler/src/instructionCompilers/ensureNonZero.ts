import { ArgumentType } from '@8f4e/compiler-spec';
import { f32const, f64const, i32const, localGet, localSet, Type, WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from './utils/saveByteCode';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `ensureNonZero`.
 * @see [Instruction docs](../../docs/instructions/math-helpers.md)
 */
const ensureNonZero: InstructionCompiler = (line, context) => {
	// Non-null assertion is safe: instruction validation ensures 1 operand exists
	const operand = context.stack.pop()!;

	let defaultNonZeroValue = operand.isInteger ? 1 : 1.0;

	// Preserve the previous synthetic-source lowering, which rounded float defaults to one decimal place.
	if (line.arguments[0] && line.arguments[0].type === ArgumentType.LITERAL && !operand.isInteger) {
		defaultNonZeroValue = Number(line.arguments[0].value.toFixed(1));
	}

	if (line.arguments[0] && line.arguments[0].type === ArgumentType.LITERAL && operand.isInteger) {
		defaultNonZeroValue = line.arguments[0].value;
	}

	const tempVariableName = '__ensureNonZero_temp_' + line.lineNumberAfterMacroExpansion;
	const tempLocalIndex = Object.keys(context.locals).length;

	if (operand.isInteger) {
		context.locals[tempVariableName] = {
			isInteger: true,
			index: tempLocalIndex,
		};
		context.stack.push({ isInteger: true, isNonZero: true });
		return saveByteCode(context, [
			...localSet(tempLocalIndex),
			...localGet(tempLocalIndex),
			WASMInstruction.I32_EQZ,
			WASMInstruction.IF,
			Type.I32,
			...i32const(defaultNonZeroValue),
			WASMInstruction.ELSE,
			...localGet(tempLocalIndex),
			WASMInstruction.END,
		]);
	} else {
		context.locals[tempVariableName] = {
			isInteger: false,
			...(operand.isFloat64 ? { isFloat64: true } : {}),
			index: tempLocalIndex,
		};
		context.stack.push({
			isInteger: false,
			...(operand.isFloat64 ? { isFloat64: true } : {}),
			isNonZero: true,
		});
		const zeroByteCode = operand.isFloat64 ? f64const(0) : f32const(0);
		const fallbackByteCode = operand.isFloat64 ? f64const(defaultNonZeroValue) : f32const(defaultNonZeroValue);
		return saveByteCode(context, [
			...localSet(tempLocalIndex),
			...localGet(tempLocalIndex),
			...zeroByteCode,
			operand.isFloat64 ? WASMInstruction.F64_EQ : WASMInstruction.F32_EQ,
			WASMInstruction.IF,
			Type.VOID,
			...fallbackByteCode,
			...localSet(tempLocalIndex),
			WASMInstruction.END,
			...localGet(tempLocalIndex),
		]);
	}
};

export default ensureNonZero;
