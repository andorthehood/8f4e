import {
	br_if,
	f32load,
	f32store,
	i32const,
	i32load,
	i32store,
	localGet,
	localSet,
	WASM_F32_EQ,
	WASM_I32_EQ,
} from '@8f4e/compiler-wasm-utils';
import { isStackInteger } from '@8f4e/compiler-spec';

import { saveByteCode } from './utils/saveByteCode';
import { allocateInternalResource } from './utils/internalResources';

import type { BranchIfUnchangedLine, InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `branchIfUnchanged`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const branchIfUnchanged: InstructionCompiler<BranchIfUnchangedLine> = (line, context) => {
	const [operand] = line.stackAnalysis.consumedOperands;

	const depth = line.arguments[0].value;
	const isInteger = isStackInteger(operand);
	const type = isInteger ? 'int' : 'float';
	const lineNumberAfterMacroExpansion = line.lineNumberAfterMacroExpansion;
	const previousValueMemoryName = '__branchIfUnchanged_previousValue' + lineNumberAfterMacroExpansion;
	const currentValueMemoryName = '__branchIfUnchanged_currentValue' + lineNumberAfterMacroExpansion;
	const previousValue = allocateInternalResource(context, previousValueMemoryName, type);
	const currentValueLocalIndex = Object.keys(context.locals).length;

	context.locals[currentValueMemoryName] = {
		isInteger,
		index: currentValueLocalIndex,
	};

	const loadByteCode = isInteger ? i32load() : f32load();
	const equalityByteCode = isInteger ? WASM_I32_EQ : WASM_F32_EQ;
	const storeByteCode = isInteger ? i32store() : f32store();

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
