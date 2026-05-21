import { saveByteCode } from '../../utils/saveByteCode';
import { constOpcode, resolveArgumentValueKind } from '../shared';

import type { CodegenArgumentLiteral, CodegenContext } from '@8f4e/compiler-spec';

export default function pushLiteral(argument: CodegenArgumentLiteral, context: CodegenContext): CodegenContext {
	const kind = resolveArgumentValueKind(argument);
	return saveByteCode(context, constOpcode[kind](argument.value));
}
