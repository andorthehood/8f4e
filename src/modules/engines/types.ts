export type MemoryBuffer = Int32Array;

export type ModuleStateExtractor<T> = (memoryBuffer: MemoryBuffer, moduleAddress: number) => T;
export type ModuleStateInserter<T> = (moduleState: T, memoryBuffer: MemoryBuffer, moduleAddress: number) => void;
