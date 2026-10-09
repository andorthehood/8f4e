import type {
	AST,
	AssertionCodegenSites,
	CompiledModule,
	CompileOptions,
	FunctionRegistry,
	FunctionTypeRegistry,
} from '@8f4e/language-spec';
import type { ModuleSemanticReferences } from '@8f4e/semantic-reference-resolver';
import type { StackAnalysisSubProgramReport } from '@8f4e/stack-analyzer';
import { compileModule } from './compileModule';

/**
 * Compiles resolved module bodies using a shared function type registry.
 *
 * @param modules - Resolved modules in execution order.
 * @param options - Compiler options for this compilation pass.
 * @param compiledFunctions - Function registry available to module compilation.
 * @param typeRegistry - Function type registry used for WASM block signatures.
 * @param stackReport - Sub-program stack-analysis report.
 * @returns The compiled module artifact.
 */
export function compileModules(
	modules: readonly ModuleSemanticReferences[],
	options: CompileOptions,
	stackReport: StackAnalysisSubProgramReport,
	compiledFunctions?: FunctionRegistry,
	typeRegistry?: FunctionTypeRegistry,
	assertionCalls?: ReadonlyMap<AST, AssertionCodegenSites>
): CompiledModule[] {
	return modules.map((resolved, index) =>
		compileModule(
			resolved,
			index,
			compiledFunctions,
			stackReport.modules[resolved.ast.id],
			options,
			typeRegistry,
			assertionCalls?.get(resolved.ast)
		)
	);
}
