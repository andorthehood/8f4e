import type { InstructionCompiler } from '@8f4e/compiler-spec';
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
import { allocateInternalResource } from './utils/internalResources';
import { saveByteCode } from './utils/saveByteCode';

/**
 * Instruction compiler for `hasChanged`.
 * @see [Instruction docs](../../docs/instructions/signal-helpers.md)
 */
const hasChanged: InstructionCompiler = (line, context) => {
	const [operand] = line.stackAnalysis.consumedOperands;

	const lineNumberAfterMacroExpansion = line.lineNumberAfterMacroExpansion;
	const currentValueName = '__hasChangedDetector_currentValue' + lineNumberAfterMacroExpansion;
	const previousValueName = '__hasChangedDetector_previousValue' + lineNumberAfterMacroExpansion;
	const isInteger = operand.valueType === 'int';
	const memoryType = isInteger ? 'int' : 'float';
	const previousValue = allocateInternalResource(context, previousValueName, memoryType);
	const currentValueLocalIndex = Object.keys(context.locals).length;

	context.locals[currentValueName] = {
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
		WASM_I32_EQZ,
		...i32const(previousValue.byteAddress),
		...localGet(currentValueLocalIndex),
		...storeByteCode,
	]);
};

export default hasChanged;
