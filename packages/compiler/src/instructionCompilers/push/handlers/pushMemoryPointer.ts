import type { CodegenContext, ResolvedMemoryPointerPushLine } from '@8f4e/compiler-spec';
import { i32const } from '@8f4e/compiler-wasm-utils';
import assertFunctionMemoryIoAllowed from '../../assertFunctionMemoryIoAllowed';
import { saveByteCode } from '../../utils/saveByteCode';
import { buildPointerDereferenceByteCode } from '../shared';

/**
 * Emits bytecode for pushing the value reached by dereferencing a memory pointer.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The computed result.
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
