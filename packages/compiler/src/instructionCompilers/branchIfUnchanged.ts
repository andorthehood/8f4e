import {
	br_if,
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

import type { BranchIfUnchangedLine, InstructionCompiler } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `branchIfUnchanged`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const branchIfUnchanged: InstructionCompiler<BranchIfUnchangedLine> = (line: BranchIfUnchangedLine, context) => {
	// Non-null assertion is safe: instruction validation ensures 1 operand exists
	const operand = context.stack.pop()!;

	const depth = line.arguments[0].value;
	const type = operand.isInteger ? 'int' : 'float';
	const lineNumberAfterMacroExpansion = line.lineNumberAfterMacroExpansion;
	const previousValueMemoryName = '__branchIfUnchanged_previousValue' + lineNumberAfterMacroExpansion;
	const currentValueMemoryName = '__branchIfUnchanged_currentValue' + lineNumberAfterMacroExpansion;
	const previousValue = allocateInternalResource(context, previousValueMemoryName, type);
	const currentValueLocalIndex = Object.keys(context.locals).length;

	context.locals[currentValueMemoryName] = {
		isInteger: operand.isInteger,
		index: currentValueLocalIndex,
	};

	const loadByteCode = operand.isInteger ? i32load() : f32load();
	const equalityByteCode = operand.isInteger ? WASMInstruction.I32_EQ : WASMInstruction.F32_EQ;
	const storeByteCode = operand.isInteger ? i32store() : f32store();

	return saveByteCode(context, [
		...localSet(currentValueLocalIndex),
		...i32const(previousValue.byteAddress),
		...loadByteCode,
		...localGet(currentValueLocalIndex),
		equalityByteCode,
		...br_if(depth),
		...i32const(previousValue.byteAddress),
		...localGet(currentValueLocalIndex),
		...storeByteCode,
	]);
};

export default branchIfUnchanged;
