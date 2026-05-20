import {
	f32load,
	f32store,
	i32const,
	i32load,
	i32store,
	localGet,
	localSet,
	WASM_F32_EQ,
	WASM_I32_EQ,
	WASM_I32_EQZ,
} from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from './utils/saveByteCode';
import { allocateInternalResource } from './utils/internalResources';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `hasChanged`.
 * @see [Instruction docs](../../docs/instructions/signal-helpers.md)
 */
const hasChanged: InstructionCompiler = (line, context) => {
	const [operand] = line.stackAnalysis.consumedOperands;

	const lineNumberAfterMacroExpansion = line.lineNumberAfterMacroExpansion;
	const currentValueName = '__hasChangedDetector_currentValue' + lineNumberAfterMacroExpansion;
	const previousValueName = '__hasChangedDetector_previousValue' + lineNumberAfterMacroExpansion;
	const memoryType = operand.isInteger ? 'int' : 'float';
	const previousValue = allocateInternalResource(context, previousValueName, memoryType);
	const currentValueLocalIndex = Object.keys(context.locals).length;

	context.locals[currentValueName] = {
		isInteger: operand.isInteger,
		index: currentValueLocalIndex,
	};

	const loadByteCode = operand.isInteger ? i32load() : f32load();
	const equalityByteCode = operand.isInteger ? WASM_I32_EQ : WASM_F32_EQ;
	const storeByteCode = operand.isInteger ? i32store() : f32store();

	return saveByteCode(context, [
		...localSet(currentValueLocalIndex),
		...i32const(previousValue.byteAddress),
		...loadByteCode,
		...localGet(currentValueLocalIndex),
		equalityByteCode,
		WASM_I32_EQZ,
		...i32const(previousValue.byteAddress),
		...localGet(currentValueLocalIndex),
		...storeByteCode,
	]);
};

export default hasChanged;
