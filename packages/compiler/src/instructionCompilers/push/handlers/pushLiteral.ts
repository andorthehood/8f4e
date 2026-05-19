import { saveByteCode } from '../../utils/saveByteCode';
import { constOpcode, kindToStackItem, resolveArgumentValueKind } from '../shared';

import type { CodegenArgumentLiteral, CompilationContext } from '@8f4e/compiler-spec';

export default function pushLiteral(argument: CodegenArgumentLiteral, context: CompilationContext): CompilationContext {
	const kind = resolveArgumentValueKind(argument);
	context.stack.push(
		kindToStackItem(kind, {
			isNonZero: argument.value !== 0,
			...(argument.isInteger && Number.isInteger(argument.value) ? { knownIntegerValue: argument.value } : {}),
			...(argument.address?.safeRange
				? { address: { safeRange: argument.address.safeRange, clampRange: argument.address.safeRange } }
				: {}),
		})
	);
	return saveByteCode(context, constOpcode[kind](argument.value));
}
