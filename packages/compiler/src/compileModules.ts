import type {
	CompiledModule,
	CompileOptions,
	FunctionMetadataLookup,
	FunctionTypeRegistry,
	Namespaces,
	ValidatedConstantsAST,
	ValidatedModuleAST,
	ValidatedPrototypeAST,
} from '@8f4e/compiler-spec';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/compiler-spec';
import { compileModule } from './compileModule';
import { collectNamespacesFromASTs } from './semantic/buildNamespace';

/** Compiles validated module ASTs using a shared namespace, allocator, and function type registry. */
export function compileModules(
	modules: Array<ValidatedModuleAST | ValidatedConstantsAST>,
	options: CompileOptions,
	namespaces?: Namespaces,
	compiledFunctions?: FunctionMetadataLookup,
	internalAllocator?: { nextByteAddress: number },
	typeRegistry?: FunctionTypeRegistry,
	prototypeShapes?: Readonly<Record<string, ValidatedPrototypeAST>>
): CompiledModule[] {
	const startingByteAddress = (options.startingMemoryWordAddress ?? 0) * GLOBAL_ALIGNMENT_BOUNDARY;
	const ns: Namespaces =
		namespaces ??
		collectNamespacesFromASTs(modules, startingByteAddress, compiledFunctions, modules, options, prototypeShapes);
	const allocator = internalAllocator ?? {
		nextByteAddress: Object.values(ns).reduce((max, namespace) => {
			if (namespace.memoryIndex !== 0) {
				return max;
			}
			const byteAddress = namespace.byteAddress ?? 0;
			const wordAlignedSize = namespace.wordAlignedSize ?? 0;
			return Math.max(max, byteAddress + wordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY);
		}, 0),
	};

	return modules.map((ast, index) => {
		const moduleStartingByteAddress =
			ns[ast.id]?.byteAddress !== undefined ? ns[ast.id].byteAddress : startingByteAddress;
		const module = compileModule(
			ast,
			ns,
			moduleStartingByteAddress,
			index,
			compiledFunctions,
			allocator,
			options,
			typeRegistry,
			prototypeShapes
		);
		return module;
	});
}
