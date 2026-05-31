import type { CodegenContext, NormalizedArgumentLiteral } from '@8f4e/compiler-spec';
import { saveByteCode } from '../../utils/saveByteCode';
import { constOpcode, resolveArgumentValueKind } from '../shared';

export default function pushLiteral(argument: NormalizedArgumentLiteral, context: CodegenContext): CodegenContext {
	const kind = resolveArgumentValueKind(argument);
	return saveByteCode(context, constOpcode[kind](argument.value));
}
