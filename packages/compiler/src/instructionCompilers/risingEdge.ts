import {
	f32load,
	f32store,
	i32const,
	i32load,
	i32store,
	localGet,
	localSet,
	WASM_F32_GT,
	WASM_I32_GT_S,
} from '@8f4e/compiler-wasm-utils';
import { isStackInteger } from '@8f4e/compiler-spec';

import { saveByteCode } from './utils/saveByteCode';
import { allocateInternalResource } from './utils/internalResources';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `risingEdge`.
 * @see [Instruction docs](../../docs/instructions/signal-helpers.md)
 */
const risingEdge: InstructionCompiler = (line, context) => {
	const [operand] = line.stackAnalysis.consumedOperands;

	const lineNumberAfterMacroExpansion = line.lineNumberAfterMacroExpansion;
	const currentValueName = '__risingEdgeDetector_currentValue' + lineNumberAfterMacroExpansion;
	const previousValueName = '__risingEdgeDetector_previousValue' + lineNumberAfterMacroExpansion;
	const isInteger = isStackInteger(operand);
	const memoryType = isInteger ? 'int' : 'float';
	const previousValue = allocateInternalResource(context, previousValueName, memoryType);
	const currentValueLocalIndex = Object.keys(context.locals).length;

	context.locals[currentValueName] = {
		isInteger,
		index: currentValueLocalIndex,
	};

	const loadByteCode = isInteger ? i32load() : f32load();
	const comparisonByteCode = isInteger ? WASM_I32_GT_S : WASM_F32_GT;
	const storeByteCode = isInteger ? i32store() : f32store();

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
