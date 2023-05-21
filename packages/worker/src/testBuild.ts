import compile, { CompiledModuleLookup, CompileOptions, Module } from '@8f4e/compiler';

export default async function testBuild(
	memoryRef: WebAssembly.Memory,
	modules: Module[],
	compilerOptions: CompileOptions
): Promise<{ codeBuffer: Uint8Array; compiledModules: CompiledModuleLookup }> {
	const { codeBuffer, compiledModules } = compile(modules, compilerOptions);
	const { instance } = await WebAssembly.instantiate(codeBuffer, {
		js: {
			memory: memoryRef,
		},
	});

	const init = instance.exports.init as CallableFunction;

	init();

	return { codeBuffer, compiledModules };
}
