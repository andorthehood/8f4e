import type { ProjectObjectModel } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import { compileSubProgram } from '.';

const emptyProject: ProjectObjectModel = {
	modules: [],
	functions: [],
	constants: [],
	prototypes: [],
	includes: [],
	notes: [],
	unknown: [],
	groups: [],
};

describe('compileSubProgram', () => {
	it('compiles one closed source unit into emission-ready artifacts', () => {
		const compiled = compileSubProgram(emptyProject, { disableSharedMemory: true });

		expect(compiled.entryNames).toEqual(['main']);
		expect(compiled.compiledModules).toEqual([]);
		expect(compiled.compiledFunctions).toEqual([]);
		expect(compiled.memoryPlan.moduleList).toEqual([]);
	});
});
