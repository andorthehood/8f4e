import { localGet, i32const } from '@8f4e/compiler-wasm-utils';
import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import assertFunctionMemoryIoAllowed from '../../assertFunctionMemoryIoAllowed';
import { saveByteCode } from '../../../utils/compilation';
import { getPointeeElementWordSizeFromMetadata } from '../../../utils/memoryData';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '../../../consts';

import type { CompilationContext, PushIdentifierLine } from '../../../types';

/**
 * Pushes the end-address of the pointee allocation for a local pointer variable (*name&).
 *
 * Emits:
 *   local.get <localIndex>                ; load pointer value (start of pointee)
 *   [i32.const <offset>]                  ; only when pointee spans > 1 word slot (e.g. float64*)
 *   [i32.add]
 *
 * Where offset = (ceil(pointeeElementWordSize / GLOBAL_ALIGNMENT_BOUNDARY) - 1) * GLOBAL_ALIGNMENT_BOUNDARY.
 * For all pointee types except float64, the offset is zero and the add is omitted.
 */
export default function pushLocalPointerEndAddress(
	line: PushIdentifierLine,
	context: CompilationContext
): CompilationContext {
	const argument = line.arguments[0];
	if (argument.referenceKind !== 'pointee-memory-reference') {
		return context;
	}

	const local = context.locals[argument.targetMemoryId];
	if (!local?.pointeeBaseType) {
		return context;
	}

	assertFunctionMemoryIoAllowed(line, context);

	// Load the pointer value from the local variable
	const byteCode: number[] = [...localGet(local.index)];

	// Compute the offset to the last word-aligned chunk of the pointee element.
	const pointeeElementWordSize = getPointeeElementWordSizeFromMetadata(local);
	const pointeeWordSlots = Math.ceil(pointeeElementWordSize / GLOBAL_ALIGNMENT_BOUNDARY);
	const offset = (pointeeWordSlots - 1) * GLOBAL_ALIGNMENT_BOUNDARY;

	if (offset > 0) {
		byteCode.push(...i32const(offset), WASMInstruction.I32_ADD);
	}

	// The result is an integer address
	context.stack.push({ isInteger: true, isNonZero: false });

	return saveByteCode(context, byteCode);
}
