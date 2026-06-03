import type { CompilationContext, ResolvedCallLine, Stack } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';
import { getError } from '../../compilerError';
import { functionValueTypeToStackItem, stackItemMatchesFunctionValueType } from '../../utils/functionValueType';
import { analyzePush } from './push';
import { consume, produce } from './stack';

export function analyzeCall(line: ResolvedCallLine, context: CompilationContext): { consumed: Stack; produced: Stack } {
	const { parameters, returns } = line.targetFunction.signature;

	for (const inlinePushLine of line.inlineArgumentPushes ?? []) {
		analyzePush(inlinePushLine, context);
	}

	if (context.stack.length < parameters.length) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	for (let i = 0; i < parameters.length; i++) {
		const stackIndex = context.stack.length - parameters.length + i;
		const stackItem = context.stack[stackIndex];
		if (!stackItemMatchesFunctionValueType(stackItem, parameters[i])) {
			throw getError(ErrorCode.TYPE_MISMATCH, line, context);
		}
	}

	const consumed = consume(context, parameters.length);
	const produced = returns.map(returnType => functionValueTypeToStackItem(returnType));
	produce(context, produced);
	return { consumed, produced };
}
