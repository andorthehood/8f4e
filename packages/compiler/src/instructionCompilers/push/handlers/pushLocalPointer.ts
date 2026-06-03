import type { CodegenContext, ResolvedLocalPointerPushLine } from '@8f4e/compiler-spec';
import { localGet } from '@8f4e/compiler-wasm-utils';
import assertFunctionMemoryIoAllowed from '../../assertFunctionMemoryIoAllowed';
import { saveByteCode } from '../../utils/saveByteCode';
import { buildPointerDereferenceByteCode } from '../shared';

/**
 * Emits bytecode for pushing the value reached by dereferencing a local pointer.
 *
 * @param line - Compiler line being processed.
 * @param context - Current compiler context consulted or updated by the operation.
 * @returns The result of the operation.
 */
export default function pushLocalPointer(line: ResolvedLocalPointerPushLine, context: CodegenContext): CodegenContext {
	const { local } = line.resolvedTarget;
	const { dereferenceDepth } = line.arguments[0];
	assertFunctionMemoryIoAllowed(line, context);
	const dereference = buildPointerDereferenceByteCode(
		context,
		line.lineNumber,
		local,
		localGet(local.index),
		'pointer-value',
		dereferenceDepth
	);

	return saveByteCode(context, dereference.byteCode);
}
