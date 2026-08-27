import { createFunctionId, type ProjectObjectModel } from '@8f4e/language-spec';
import { composeProgram } from '@8f4e/program-composer/internal';
import { describe, expect, it } from 'vitest';
import { compileSubProgram } from '.';

const emptyProject: ProjectObjectModel = {
	code: [],
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
		const compiled = compileSubProgram(composeProgram(emptyProject), { disableSharedMemory: true });

		expect(compiled.entryNames).toEqual(['main']);
		expect(compiled.compiledModules).toEqual([]);
		expect(compiled.compiledFunctions).toEqual([]);
		expect(compiled.memoryPlan.moduleList).toEqual([]);
	});

	it('starts defined function indexes at the configured global index', () => {
		const project: ProjectObjectModel = {
			...emptyProject,
			functions: [
				{ id: 1, code: ['function one', 'push 1', 'functionEnd int'] },
				{ id: 2, code: ['function two', 'call one', 'functionEnd int'] },
			],
			modules: [{ id: 3, entry: 'main', code: ['module caller', 'call two', 'drop', 'moduleEnd'] }],
		};

		const compiled = compileSubProgram(composeProgram(project), {
			disableSharedMemory: true,
			startingFunctionIndex: 20,
		});

		expect(compiled.compiledFunctions[0].wasmIndex).toBe(20);
		expect(compiled.compiledFunctions[0].id).toBe(createFunctionId('one', []));
		expect(compiled.compiledFunctions[1].wasmIndex).toBe(21);
		expect(
			compiled.compiledFunctions[1].body.some((byte, index, body) => byte === 0x10 && body[index + 1] === 20)
		).toBe(true);
		expect(
			compiled.compiledModules[0].cycleFunction.some((byte, index, body) => byte === 0x10 && body[index + 1] === 21)
		).toBe(true);
	});
});
