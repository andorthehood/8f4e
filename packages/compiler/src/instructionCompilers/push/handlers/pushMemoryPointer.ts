import type { CodegenContext, ResolvedMemoryPointerPushLine } from '@8f4e/compiler-spec';
import { i32const } from '@8f4e/compiler-wasm-utils';
import assertFunctionMemoryIoAllowed from '../../assertFunctionMemoryIoAllowed';
import { saveByteCode } from '../../utils/saveByteCode';
import { buildPointerDereferenceByteCode } from '../shared';

/**
 * Emits bytecode for pushing the value reached by dereferencing a memory pointer.
 *
 * @param line - Compiler line being processed.
 * @param context - Current compiler context consulted or updated by the operation.
 * @returns The result of the operation.
 */
export default function pushMemoryPointer(
	line: ResolvedMemoryPointerPushLine,
	context: CodegenContext
): CodegenContext {
	const { memoryItem } = line.resolvedTarget;
	const { dereferenceDepth } = line.arguments[0];
	assertFunctionMemoryIoAllowed(line, context);
	const dereference = buildPointerDereferenceByteCode(
		context,
		line.lineNumber,
		memoryItem,
		i32const(memoryItem.byteAddress),
		'pointer-slot',
		dereferenceDepth
	);

	return saveByteCode(context, dereference.byteCode);
}
