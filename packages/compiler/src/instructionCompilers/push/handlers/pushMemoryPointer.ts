import { i32const } from '@8f4e/compiler-wasm-utils';

import assertFunctionMemoryIoAllowed from '../../assertFunctionMemoryIoAllowed';
import { saveByteCode } from '../../utils/saveByteCode';
import { buildPointerDereferenceByteCode } from '../shared';

import type { CodegenContext, ResolvedMemoryPointerPushLine } from '@8f4e/compiler-spec';

export default function pushMemoryPointer(
	line: ResolvedMemoryPointerPushLine,
	context: CodegenContext
): CodegenContext {
	const { memoryItem } = line.resolvedTarget;
	assertFunctionMemoryIoAllowed(line, context);
	const dereference = buildPointerDereferenceByteCode(
		context,
		line.lineNumberAfterMacroExpansion,
		memoryItem,
		i32const(memoryItem.byteAddress),
		'pointer-slot'
	);

	return saveByteCode(context, dereference.byteCode);
}
