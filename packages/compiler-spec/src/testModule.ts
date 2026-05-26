import type { CompilerASTGroup } from './ast';
import type { MemoryBuffer, MemoryMap } from './memory';

export interface TestModule {
	memory: MemoryBuffer & {
		get: (address: number | string) => number;
		byteAddress: (address: number | string) => number;
		set: (address: number | string, value: number | number[]) => void;
		allocMemoryForPointer: (address: number | string) => number;
	};
	test: CallableFunction;
	reset: () => void;
	wat: string;
	program: Uint8Array;
	memoryMap: MemoryMap;
	ast: CompilerASTGroup;
}
