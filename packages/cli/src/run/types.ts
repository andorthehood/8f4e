import type { CompiledModuleLookup, DataStructure } from '@8f4e/compiler-types';

export interface RuntimeRunner {
	initialize(): void;
	runCycles(count: number): void;
	read(id: string): number | number[];
	readBytes(id: string): Uint8Array;
	write(id: string, value: number | number[]): void;
	writeBytes(id: string, bytes: Uint8Array): void;
}

export interface ResolvedMemoryReference {
	key: string;
	moduleId: string;
	memoryId: string;
	data: DataStructure;
}

export interface MemoryLookup {
	resolve(id: string): ResolvedMemoryReference;
}

export interface CreateRuntimeRunnerOptions {
	compiledWasmBase64: string;
	compiledModules: CompiledModuleLookup;
	requiredMemoryBytes: number;
}
