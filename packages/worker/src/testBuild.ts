import compile, { Module } from '@8f4e/compiler';

export default async function testBuild(memoryRef: WebAssembly.Memory, modules: Module[]): Promise<void> {
	const { codeBuffer } = compile(modules);
	await WebAssembly.instantiate(codeBuffer, {
		js: {
			memory: memoryRef,
		},
	});
}
