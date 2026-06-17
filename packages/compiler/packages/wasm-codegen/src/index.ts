export { deriveEffectiveMemorySize } from '@8f4e/compiler-wasm-utils';
export { compileFunction } from './compileFunction';
export { compileCodegenLine } from './compileLine';
export { compileModule } from './compileModule';
export { compileModules } from './compileModules';
export type { WasmProgramInput } from './emitWasmProgram';
export { emitWasmProgram, getRequiredMemoryBytesByIndex, getRequiredMemoryBytesByRegion } from './emitWasmProgram';
export { default as createInitialMemoryDataSegments } from './initialMemoryDataSegments/createInitialMemoryDataSegments';
export type {
	InitialMemoryDataSegment,
	InitialMemoryDataSegmentCandidate,
} from './initialMemoryDataSegments/types';
