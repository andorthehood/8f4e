import { arrayMemoryDeclarationInstructions, ErrorCode } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import { compileProject, parseProjectSource } from '../src';

describe('array sizes', () => {
	it.each([
		'int[] values 0.5',
		'const SIZE 0.5\nint[] values SIZE',
		'const SIZE 3\nint[] values SIZE/2',
		'int[] values -1 0',
		'int[] values 2^1024',
		'int[] values -1^0.5',
	])('rejects invalid resolved sizes in %s', async declaration => {
		const project = parseProjectSource(`8f4e/v1
entry main
module example
${declaration}
moduleEnd
entryEnd`);

		await expect(compileProject(project, { disableSharedMemory: true })).rejects.toMatchObject({
			code: ErrorCode.INVALID_ARRAY_SIZE,
			message: expect.stringContaining('Array size must be a finite nonnegative integer.'),
			line: { instruction: 'int[]', lineNumber: declaration.split('\n').length },
			context: { codeBlockId: 'example', codeBlockType: 'module', projectBlockId: project.modules[0]!.id },
		});
	});

	it.each([
		['0.5', '0.5'],
		['SIZE', '0.5'],
		['SIZE/2', '3'],
	])('rejects prototype array size %s with namespace constant %s', async (size, constant) => {
		const project = parseProjectSource(`8f4e/v1
constants sizes
const SIZE ${constant}
constantsEnd
prototype state
use sizes
int[] values ${size}
prototypeEnd
entry main
module example
shape state
moduleEnd
entryEnd`);

		await expect(compileProject(project, { disableSharedMemory: true })).rejects.toMatchObject({
			code: ErrorCode.INVALID_ARRAY_SIZE,
			line: { instruction: 'int[]', lineNumber: 2 },
			context: { codeBlockId: 'state', codeBlockType: 'prototype', projectBlockId: project.prototypes[0]!.id },
		});
	});

	it.each(
		arrayMemoryDeclarationInstructions.flatMap(instruction =>
			['0', '1.0', '3'].map(size => [instruction, size] as const)
		)
	)('preserves valid %s element count %s', async (instruction, size) => {
		const project = parseProjectSource(`8f4e/v1
entry main
module example
${instruction} values ${size}
moduleEnd
entryEnd`);
		const result = await compileProject(project, { disableSharedMemory: true });
		const values = result.memoryPlan.modules.example!.memory.values!;
		expect(values.numberOfElements).toBe(Number(size));
		expect(values.elementByteLength).toBe(Number(size) * values.elementWordSize);
	});
});
