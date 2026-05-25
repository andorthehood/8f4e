import { localGet } from '@8f4e/compiler-wasm-utils';

import assertFunctionMemoryIoAllowed from '../../assertFunctionMemoryIoAllowed';
import { saveByteCode } from '../../utils/saveByteCode';
import { buildPointerDereferenceByteCode } from '../shared';

import type { CodegenContext, ResolvedLocalPointerPushLine } from '@8f4e/compiler-spec';

export default function pushLocalPointer(line: ResolvedLocalPointerPushLine, context: CodegenContext): CodegenContext {
	const { local } = line.resolvedTarget;
	assertFunctionMemoryIoAllowed(line, context);
	const dereference = buildPointerDereferenceByteCode(
		context,
		line.lineNumberAfterMacroExpansion,
		local,
		localGet(local.index),
		'pointer-value'
	);

	return saveByteCode(context, dereference.byteCode);
}
