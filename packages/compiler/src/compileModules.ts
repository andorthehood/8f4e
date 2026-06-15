import type {
	CompiledModule,
	CompileOptions,
	FunctionRegistry,
	FunctionTypeRegistry,
	Namespaces,
	ValidatedModuleAST,
	ValidatedPrototypeAST,
} from '@8f4e/compiler-spec';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/compiler-spec';
import { compileModule } from './compileModule';
import { assertUniqueModuleIds, collectNamespacesFromASTs } from './semantic/buildNamespace';

/**
 * Compiles validated module ASTs using a shared namespace and function type registry.
 *
 * @param modules - modules value to use.
 * @param options - Compiler options for this compilation pass.
 * @param namespaces - Collected namespaces used for symbol and memory resolution.
 * @param compiledFunctions - Function registry available to module compilation.
 * @param typeRegistry - Function type registry used for WASM block signatures.
 * @param prototypeShapes - Prototype shape ASTs available during semantic layout.
 * @returns The compiled module artifact.
 */
export function compileModules(
	modules: ValidatedModuleAST[],
	options: CompileOptions,
	namespaces?: Namespaces,
	compiledFunctions?: FunctionRegistry,
	typeRegistry?: FunctionTypeRegistry,
	prototypeShapes?: Readonly<Record<string, ValidatedPrototypeAST>>
): CompiledModule[] {
	const startingByteAddress = (options.startingMemoryWordAddress ?? 0) * GLOBAL_ALIGNMENT_BOUNDARY;
	if (!namespaces) {
		assertUniqueModuleIds(modules);
	}
	const ns: Namespaces =
		namespaces ??
		collectNamespacesFromASTs(modules, startingByteAddress, compiledFunctions, modules, options, prototypeShapes);

	return modules.map((ast, index) => {
		const moduleStartingByteAddress =
			ns[ast.id]?.byteAddress !== undefined ? ns[ast.id].byteAddress : startingByteAddress;
		const module = compileModule(
			ast,
			ns,
			moduleStartingByteAddress,
			index,
			compiledFunctions,
			options,
			typeRegistry,
			prototypeShapes
		);
		return module;
	});
}
