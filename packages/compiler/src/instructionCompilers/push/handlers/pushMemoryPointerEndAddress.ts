import { i32const, i32load } from '@8f4e/compiler-wasm-utils';
import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import assertFunctionMemoryIoAllowed from '../../assertFunctionMemoryIoAllowed';
import { saveByteCode } from '../../../utils/compilation';
import { getDataStructure, getPointeeElementWordSizeFromMetadata } from '../../../utils/memoryData';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '../../../consts';

import type { CompilationContext, PushIdentifierLine } from '../../../types';

/**
 * Pushes the end-address of the pointee allocation for a pointer memory item (*name&).
 *
 * Emits:
 *   i32.const <byteAddressOfPointerSlot>
 *   i32.load                              ; load pointer value (start of pointee)
 *   [i32.const <offset>]                  ; only when pointee spans > 1 word slot (e.g. float64*)
 *   [i32.add]
 *
 * Where offset = (ceil(pointeeElementWordSize / 4) - 1) * 4.
 * For all pointee types except float64, the offset is zero and the add is omitted.
 */
export default function pushMemoryPointerEndAddress(
	line: PushIdentifierLine,
	context: CompilationContext
): CompilationContext {
	const memory = context.namespace.memory;
	const argument = line.arguments[0];
	if (argument.referenceKind !== 'pointee-memory-reference') {
		return context;
	}
	const base = argument.targetMemoryId;
	const memoryItem = getDataStructure(memory, base)!;

	assertFunctionMemoryIoAllowed(line, context);

	// Load the pointer value (start address of the pointee allocation)
	const byteCode: number[] = [...i32const(memoryItem.byteAddress), ...i32load()];

	// Compute the offset to the last word-aligned chunk of the pointee element.
	// Each word slot is GLOBAL_ALIGNMENT_BOUNDARY (4) bytes. For most types the
	// pointee fits in 1 slot (offset = 0); for float64 it occupies 2 slots (offset = 4).
	const pointeeElementWordSize = getPointeeElementWordSizeFromMetadata(memoryItem);
	const pointeeWordSlots = Math.ceil(pointeeElementWordSize / GLOBAL_ALIGNMENT_BOUNDARY);
	const offset = (pointeeWordSlots - 1) * GLOBAL_ALIGNMENT_BOUNDARY;

	if (offset > 0) {
		byteCode.push(...i32const(offset), WASMInstruction.I32_ADD);
	}

	// The result is an integer address
	context.stack.push({ isInteger: true, isNonZero: false });

	return saveByteCode(context, byteCode);
}
