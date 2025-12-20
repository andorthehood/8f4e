import { FunctionBody } from '../../src/wasmUtils/typeHelpers';
import type { CompiledModule, TestModule } from '../../src/types';
export declare function getInitialMemory(module: CompiledModule): number[];
export declare function createSingleFunctionWASMProgram(functionBody: FunctionBody): Uint8Array;
export declare function setInitialMemory(memory: DataView, module: CompiledModule): void;
export declare function createTestModule(sourceCode: string): Promise<TestModule>;
export declare function moduleTester(description: string, moduleCode: string, ...tests: [inputs: Record<string, number>, outputs: Record<string, number>][][]): void;
export declare function createTestModuleWithFunctions(moduleCode: string, functionCodes?: string[]): Promise<TestModule>;
export declare function moduleTesterWithFunctions(description: string, moduleCode: string, functionCodes: string[], ...tests: [inputs: Record<string, number>, outputs: Record<string, number>][][]): void;
export declare function expectModuleToThrow(description: string, moduleCode: string, errorMessage: string): void;
//# sourceMappingURL=testUtils.d.ts.map