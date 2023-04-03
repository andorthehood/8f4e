import compile, { CompileOptions, Module } from '@8f4e/compiler';

export default async function testBuild(
	memoryRef: WebAssembly.Memory,
	modules: Module[],
	compilerOptions: CompileOptions
): Promise<void> {
	const { codeBuffer } = compile(modules, compilerOptions);
	await WebAssembly.instantiate(codeBuffer, {
		js: {
			memory: memoryRef,
		},
	});
}
