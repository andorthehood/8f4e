import type { CompilationContext, Stack } from '@8f4e/compiler-spec';
import { createStackValue, produce } from './stack';

/** Produces the current loop index value after tokenizer placement has guaranteed a loop. */
export function analyzeLoopIndex(context: CompilationContext): { consumed: Stack; produced: Stack } {
	const produced: Stack = [createStackValue('int', { isNonZero: false })];
	produce(context, produced);
	return { consumed: [], produced };
}
