import type {
	CompiledModule,
	CompileOptions,
	ConstantsAST,
	FunctionMetadataLookup,
	FunctionTypeRegistry,
	ModuleAST,
	Namespaces,
} from '@8f4e/compiler-spec';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/compiler-spec';
import { compileModule } from './compileModule';
import { collectNamespacesFromASTs } from './semantic/buildNamespace';

export function compileModules(
	modules: Array<ModuleAST | ConstantsAST>,
	options: CompileOptions,
	namespaces?: Namespaces,
	compiledFunctions?: FunctionMetadataLookup,
	internalAllocator?: { nextByteAddress: number },
	typeRegistry?: FunctionTypeRegistry
): CompiledModule[] {
	const startingByteAddress = (options.startingMemoryWordAddress ?? 0) * GLOBAL_ALIGNMENT_BOUNDARY;
	const ns: Namespaces =
		namespaces ?? collectNamespacesFromASTs(modules, startingByteAddress, compiledFunctions, modules, options);
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
			typeRegistry
		);
		return module;
	});
}
