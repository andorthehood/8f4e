import {
	f32load,
	f32store,
	i32const,
	i32load,
	i32store,
	localGet,
	localSet,
	WASMInstruction,
} from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../utils/compilation';
import { allocateInternalResource } from '../utils/internalResources';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `risingEdge`.
 * @see [Instruction docs](../../docs/instructions/signal-helpers.md)
 */
const risingEdge: InstructionCompiler = (line, context) => {
	// Non-null assertion is safe: instruction validation with minOperands: 1 guarantees at least 1 operand exists on the stack
	const operand = context.stack.pop()!;

	const lineNumberAfterMacroExpansion = line.lineNumberAfterMacroExpansion;
	const currentValueName = '__risingEdgeDetector_currentValue' + lineNumberAfterMacroExpansion;
	const previousValueName = '__risingEdgeDetector_previousValue' + lineNumberAfterMacroExpansion;
	const memoryType = operand.isInteger ? 'int' : 'float';
	const previousValue = allocateInternalResource(context, previousValueName, memoryType);
	const currentValueLocalIndex = Object.keys(context.locals).length;

	context.locals[currentValueName] = {
		isInteger: operand.isInteger,
		index: currentValueLocalIndex,
	};
	context.stack.push({ isInteger: true, isNonZero: false });

	const loadByteCode = operand.isInteger ? i32load() : f32load();
	const comparisonByteCode = operand.isInteger ? WASMInstruction.I32_GT_S : WASMInstruction.F32_GT;
	const storeByteCode = operand.isInteger ? i32store() : f32store();

	return saveByteCode(context, [
		...localSet(currentValueLocalIndex),
		...localGet(currentValueLocalIndex),
		...i32const(previousValue.byteAddress),
		...loadByteCode,
		comparisonByteCode,
		...i32const(previousValue.byteAddress),
		...localGet(currentValueLocalIndex),
		...storeByteCode,
	]);
};

export default risingEdge;
