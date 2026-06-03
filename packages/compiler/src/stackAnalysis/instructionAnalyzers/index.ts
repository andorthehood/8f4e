import type {
	CompilationContext,
	CompilerASTLine,
	MapEndLine,
	NormalizedPushLine,
	ResolvedCallLine,
} from '@8f4e/compiler-spec';
import { getInstructionSpec } from '@8f4e/compiler-spec';
import { analyzeCall } from './call';
import { analyzeExitIfTrue, analyzeReturn } from './controlFlow';
import { analyzeFunctionEnd } from './functionEnd';
import { analyzeLocalSet } from './localSet';
import { analyzeLoopIndex } from './loopIndex';
import { analyzeMapEnd } from './mapEnd';
import { analyzeClampAddress } from './memory';
import {
	analyzeAbs,
	analyzeAdd,
	analyzeBitwiseShift,
	analyzeDiv,
	analyzeMulMinMax,
	analyzeOrXor,
	analyzeRemainder,
	analyzeSub,
} from './numeric';
import { analyzePush } from './push';
import { analyzeFromSpec } from './spec';
import type { InstructionAnalysisResult } from './types';

export function analyzeByInstruction(line: CompilerASTLine, context: CompilationContext): InstructionAnalysisResult {
	const specResult = analyzeFromSpec(line, context, getInstructionSpec(line.instruction));
	if (specResult) {
		return specResult;
	}

	switch (line.instruction) {
		case 'push': {
			return {
				consumed: [],
				produced: analyzePush(line as NormalizedPushLine, context),
			};
		}
		case 'add':
			return analyzeAdd(line, context);
		case 'sub':
			return analyzeSub(line, context);
		case 'min':
		case 'max':
		case 'mul':
			return analyzeMulMinMax(line, context);
		case 'div':
			return analyzeDiv(line, context);
		case 'and':
		case 'shiftLeft':
		case 'shiftRight':
		case 'shiftRightUnsigned':
			return analyzeBitwiseShift(line, context);
		case 'or':
		case 'xor':
			return analyzeOrXor(line, context);
		case 'remainder':
			return analyzeRemainder(line, context);
		case 'abs':
			return analyzeAbs(line, context);
		case 'clampAddress':
		case 'clampModuleAddress':
		case 'clampGlobalAddress':
			return analyzeClampAddress(line, context);
		case 'localSet':
			return analyzeLocalSet(line, context);
		case 'exitIfTrue':
			return analyzeExitIfTrue(line, context);
		case 'return':
			return analyzeReturn(line, context);
		case 'functionEnd':
			return { consumed: analyzeFunctionEnd(line, context), produced: [] };
		case 'call':
			return analyzeCall(line as ResolvedCallLine, context);
		case 'loopIndex':
			return analyzeLoopIndex(context);
		case 'mapEnd':
			return analyzeMapEnd(line as MapEndLine, context);
		default:
			return { consumed: [], produced: [] };
	}
}
