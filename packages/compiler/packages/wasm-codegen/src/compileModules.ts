import type {
	CompiledModule,
	CompileOptions,
	FunctionRegistry,
	FunctionTypeRegistry,
	MemoryLayoutPlan,
	Namespaces,
	ValidatedModuleAST,
	ValidatedPrototypeAST,
} from '@8f4e/language-spec';
import type { SemanticReferenceReport } from '@8f4e/semantic-reference-resolver';
import type { StackAnalysisProjectReport } from '@8f4e/stack-analyzer';
import { compileModule } from './compileModule';

/**
 * Compiles validated module ASTs using a shared namespace and function type registry.
 *
 * @param modules - modules value to use.
 * @param options - Compiler options for this compilation pass.
 * @param namespaces - Collected namespaces used for symbol and memory resolution.
 * @param compiledFunctions - Function registry available to module compilation.
 * @param typeRegistry - Function type registry used for WASM block signatures.
 * @param prototypeShapes - Prototype shape ASTs available during semantic layout.
 * @param stackReport - Project stack-analysis report.
 * @returns The compiled module artifact.
 */
export function compileModules(
	modules: ValidatedModuleAST[],
	options: CompileOptions,
	namespaces: Namespaces,
	memoryPlan: MemoryLayoutPlan,
	semanticReferences: SemanticReferenceReport,
	stackReport: StackAnalysisProjectReport,
	compiledFunctions?: FunctionRegistry,
	typeRegistry?: FunctionTypeRegistry,
	prototypeShapes?: Readonly<Record<string, ValidatedPrototypeAST>>
): CompiledModule[] {
	return modules.map((ast, index) => {
		const module = compileModule(
			ast,
			namespaces,
			memoryPlan,
			index,
			compiledFunctions,
			semanticReferences.modules[ast.id],
			stackReport.modules[ast.id],
			options,
			typeRegistry,
			prototypeShapes
		);
		return module;
	});
}
