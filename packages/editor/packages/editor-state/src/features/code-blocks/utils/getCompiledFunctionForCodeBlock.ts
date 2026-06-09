import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';

export type CompiledFunction = NonNullable<NonNullable<State['compiler']['compiledFunctions']>[string]>;

export function getCompiledFunctionForCodeBlock(
	graphicData: CodeBlockGraphicData,
	state: State
): CompiledFunction | undefined {
	return Object.values(state.compiler.compiledFunctions ?? {}).find(
		func => func.ast.projectBlockId === graphicData.creationIndex
	);
}
