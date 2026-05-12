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
 * Instruction compiler for `hasChanged`.
 * @see [Instruction docs](../../docs/instructions/signal-helpers.md)
 */
const hasChanged: InstructionCompiler = (line, context) => {
	const operand = context.stack.pop()!;

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

	context.stack.push({ isInteger: true, isNonZero: false });

	const loadByteCode = operand.isInteger ? i32load() : f32load();
	const equalityByteCode = operand.isInteger ? WASMInstruction.I32_EQ : WASMInstruction.F32_EQ;
	const storeByteCode = operand.isInteger ? i32store() : f32store();

	return saveByteCode(context, [
		...localSet(currentValueLocalIndex),
		...i32const(previousValue.byteAddress),
		...loadByteCode,
		...localGet(currentValueLocalIndex),
		equalityByteCode,
		WASMInstruction.I32_EQZ,
		...i32const(previousValue.byteAddress),
		...localGet(currentValueLocalIndex),
		...storeByteCode,
	]);
};

export default hasChanged;
