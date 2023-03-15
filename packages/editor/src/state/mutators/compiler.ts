import { State } from '../types';

export function recompile(state: State): void {
	state.compiler.isCompiling = true;
	state.compiler.lastCompilationStart = performance.now();
}
