import type { SubProgramSource } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import { compileSubProgram } from '.';

const emptySubProgram: SubProgramSource = {
	entries: { main: [] },
	functions: [],
	constants: [],
	prototypes: [],
};

describe('compileSubProgram', () => {
	it('compiles one closed source unit into emission-ready artifacts', () => {
		const compiled = compileSubProgram(emptySubProgram, { disableSharedMemory: true });

		expect(compiled.entryNames).toEqual(['main']);
		expect(compiled.compiledModules).toEqual([]);
		expect(compiled.compiledFunctions).toEqual([]);
		expect(compiled.memoryPlan.moduleList).toEqual([]);
	});
});
