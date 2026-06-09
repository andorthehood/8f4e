import type { AnalyzedLine, CodegenPushLine, InstructionCompiler, ResolvedPushShapeLine } from '@8f4e/compiler-spec';
import push from './push';

/**
 * Instruction compiler for `pushShape`.
 * Emits the same bytecode as explicit `push &field` lines in prototype declaration order.
 */
const pushShape: InstructionCompiler<ResolvedPushShapeLine> = (line, context) => {
	for (const { pushLine } of line.shapeExpansions) {
		push(pushLine as AnalyzedLine<CodegenPushLine>, context);
	}

	return context;
};

export default pushShape;
