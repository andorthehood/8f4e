import { call as wasmCall } from '@8f4e/compiler-wasm-utils';
import type { CodegenPushLine, InstructionCompiler, SemanticCallLine } from '@8f4e/language-spec';
import push from './push';
import { saveByteCode } from './utils/saveByteCode';

/**
 * Instruction compiler for `call`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const call: InstructionCompiler<SemanticCallLine> = (line, context, facts) => {
	for (const inlinePushLine of line.inlineArgumentPushes ?? []) {
		push(inlinePushLine as CodegenPushLine, context, facts);
	}

	const targetFunction = context.namespace.functions!.byId[facts.targetFunctionId!]!;
	saveByteCode(context, wasmCall(targetFunction.wasmIndex));

	return context;
};

export default call;
