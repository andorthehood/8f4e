import { localGet } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../../utils/saveByteCode';

import type { CodegenContext, ResolvedLocalPushLine } from '@8f4e/compiler-spec';

export default function pushLocal(line: ResolvedLocalPushLine, context: CodegenContext): CodegenContext {
	const { local } = line.resolvedTarget;

	return saveByteCode(context, localGet(local.index));
}
