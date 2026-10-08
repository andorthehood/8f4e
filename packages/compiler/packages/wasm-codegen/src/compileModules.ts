import type {
	CompiledModule,
	CompileOptions,
	FunctionRegistry,
	FunctionTypeRegistry,
	MemoryLayoutPlan,
	Namespaces,
} from '@8f4e/language-spec';
import type { ModuleSemanticReferences } from '@8f4e/semantic-reference-resolver';
import type { StackAnalysisSubProgramReport } from '@8f4e/stack-analyzer';
import { compileModule } from './compileModule';

/**
 * Compiles resolved module bodies using a shared namespace and function type registry.
 *
 * @param modules - Resolved modules in execution order.
 * @param options - Compiler options for this compilation pass.
 * @param namespaces - Collected namespaces used for symbol and memory resolution.
 * @param compiledFunctions - Function registry available to module compilation.
 * @param typeRegistry - Function type registry used for WASM block signatures.
 * @param stackReport - Sub-program stack-analysis report.
 * @returns The compiled module artifact.
 */
export function compileModules(
	modules: readonly ModuleSemanticReferences[],
	options: CompileOptions,
	namespaces: Namespaces,
	memoryPlan: MemoryLayoutPlan,
	stackReport: StackAnalysisSubProgramReport,
	compiledFunctions?: FunctionRegistry,
	typeRegistry?: FunctionTypeRegistry
): CompiledModule[] {
	return modules.map((resolved, index) =>
		compileModule(
			resolved,
			namespaces,
			memoryPlan,
			index,
			compiledFunctions,
			stackReport.modules[resolved.ast.id],
			options,
			typeRegistry
		)
	);
}
