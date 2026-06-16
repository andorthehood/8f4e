import { call as wasmCall } from '@8f4e/compiler-wasm-utils';
import type { AnalyzedLine, CodegenPushLine, InstructionCompiler, ResolvedCallLine } from '@8f4e/language-spec';
import push from './push';
import { saveByteCode } from './utils/saveByteCode';

/**
 * Instruction compiler for `call`.
 * @see [Instruction docs](../../docs/instructions/program-structure-and-functions.md)
 */
const call: InstructionCompiler<ResolvedCallLine> = (line: ResolvedCallLine, context) => {
	for (const inlinePushLine of line.inlineArgumentPushes ?? []) {
		push(inlinePushLine as AnalyzedLine<CodegenPushLine>, context);
	}

	saveByteCode(context, wasmCall(line.targetFunction.wasmIndex));

	return context;
};

export default call;
