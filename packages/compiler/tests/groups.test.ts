import { ErrorCode } from '@8f4e/language-spec';
import { promises as fs } from 'fs';
import { describe, expect, it } from 'vitest';
import { compileProject, parseProjectSource } from '../src';

async function readProject(relativePath: string) {
	return parseProjectSource(await fs.readFile(new URL(relativePath, import.meta.url), 'utf8'));
}

describe('group compiler metadata and cache', () => {
	it('re-resolves scalar initializers and restores declaration defaults when removed', async () => {
		const project = await readProject('./groups/scalar-initializers.test.8f4e');
		const group = project.groups[0]!;
		const first = await compileProject(project, { disableSharedMemory: true });
		const previousHits = first.cache.ast.stats.hits;
		const initializerRow = group.code.findIndex(line => line.startsWith('init &foo '));
		group.code[initializerRow] = 'init &foo 22';

		const second = await compileProject(project, { disableSharedMemory: true, cache: first.cache });
		expect(second.cache.ast.stats.hits).toBeGreaterThan(previousHits);
		expect(first.memoryDefaultsByModuleId['values/processor']!.foo!.value).toBe(11);
		expect(second.memoryDefaultsByModuleId['values/processor']!.foo!.value).toBe(22);
		expect(group.modules[0]!.code).toContain('int foo 3');

		group.code.splice(initializerRow, 1);
		const restored = await compileProject(project, { disableSharedMemory: true, cache: second.cache });
		expect(restored.memoryDefaultsByModuleId['values/processor']!.foo!.value).toBe(3);
	});

	it('re-resolves group initializers without changing cached declaration source', async () => {
		const project = await readProject('./groups/pointer-initializers.test.8f4e');
		const group = project.groups[0]!;
		const first = await compileProject(project, { disableSharedMemory: true });
		const previousHits = first.cache.ast.stats.hits;
		const initializerRow = group.code.findIndex(line => line.startsWith('init '));
		group.code[initializerRow] = 'init &input &source:alternate';

		const second = await compileProject(project, { disableSharedMemory: true, cache: first.cache });
		expect(second.cache.ast.stats.hits).toBeGreaterThan(previousHits);
		expect(second.memoryDefaultsByModuleId['synth/processor']!.input!.value).toBe(
			second.memoryPlan.modules.source!.memory.alternate!.byteAddress
		);
		expect(first.pointerMetadataByModuleId['synth/processor']!.input!.pointeeElementCount).toBe(3);
		expect(second.pointerMetadataByModuleId['synth/processor']!.input!.pointeeElementCount).toBe(2);
		expect(group.modules.find(module => module.code[0] === 'module processor')!.code).toContain('int* input &fallback');

		group.code.splice(initializerRow, 1);
		const restored = await compileProject(project, { disableSharedMemory: true, cache: second.cache });
		expect(restored.memoryDefaultsByModuleId['synth/processor']!.input!.value).toBe(
			restored.memoryPlan.modules['synth/processor']!.memory.fallback!.byteAddress
		);
		expect(restored.pointerMetadataByModuleId['synth/processor']!.input!.pointeeElementCount).toBe(2);
	});

	it('re-resolves passed namespaces when cached child ASTs are unchanged', async () => {
		const project = await readProject('./groups/constant-namespace-passes.test.8f4e');
		const first = await compileProject(project, { disableSharedMemory: true });
		const previousHits = first.cache.ast.stats.hits;
		project.constants[0]!.code = [
			'constants env',
			'const SAMPLE_RATE 96000',
			'const BLOCK_SIZE SAMPLE_RATE/1000',
			'constantsEnd',
		];

		const second = await compileProject(project, { disableSharedMemory: true, cache: first.cache });

		expect(second.cache.ast.stats.hits).toBeGreaterThan(previousHits);
		expect(second.memoryDefaultsByModuleId['audio/voice']!.rate!.value).toBe(96_000);
		expect(second.memoryDefaultsByModuleId['audio/nested/nestedVoice']!.blockSize!.value).toBe(96);
	});

	it('indexes recursively owned group blocks by their canonical paths', async () => {
		const project = await readProject('./groups/recursive-ordering.test.8f4e');
		expect(project.groups).toHaveLength(1);
		const group = project.groups[0]!;
		expect(group).toMatchObject({ name: 'audio', entry: 'test' });
		expect(group.modules).toHaveLength(1);

		const result = await compileProject(project, { disableSharedMemory: true });
		const compiledModules = Object.values(result.compiledModules).sort((left, right) => left.index - right.index);
		expect(compiledModules).toMatchObject([
			{ id: 'audio/grouped', ast: { projectBlockId: group.modules[0]!.id }, executionEntryName: 'test' },
			{ id: 'root', executionEntryName: 'test' },
		]);
		expect(result.compiledModules['audio/grouped']).toBe(compiledModules[0]);
		expect(result.memoryPlan.modules['audio/grouped']).toBeDefined();
		expect(result.memoryDefaultsByModuleId['audio/grouped']).toBeDefined();
		expect(result.pointerMetadataByModuleId['audio/grouped']).toBeDefined();
	});

	it('resolves exposure metadata to the backing declaration without allocating alias memory', async () => {
		const project = await readProject('./groups/memory-exposures.test.8f4e');
		const result = await compileProject(project, { disableSharedMemory: true });
		const exposure = result.projectMemoryExposuresByGroupPath['processing/audio'][0]!;
		const targetMemory = result.memoryPlan.modules['processing/audio/source']!.memory.value!;

		expect(exposure).toMatchObject({
			name: 'exposedValue',
			groupPath: 'processing/audio',
			targetModuleId: 'processing/audio/source',
			targetMemoryName: 'value',
		});
		expect(exposure.targetMemory).toBe(targetMemory);
		expect(result.memoryPlan.modules['processing/audio']).toBeUndefined();
	});

	it.each([
		{ fixture: 'missing-exposure-module', targetModuleId: 'audio/missing', targetMemoryId: 'value' },
		{ fixture: 'missing-exposure-memory', targetModuleId: 'audio/source', targetMemoryId: 'missing' },
	])('reports invalid unused group exposure targets without an AST line: $fixture', async testCase => {
		const project = await readProject(`./errors/groups/${testCase.fixture}.error.8f4e`);
		const compilation = compileProject(project, { disableSharedMemory: true });

		await expect(compilation).rejects.toMatchObject({
			code: ErrorCode.INVALID_PROJECT_MEMORY_EXPOSURE_TARGET,
			context: { projectGroupPath: 'audio', projectMemoryExposureName: 'publicValue' },
			message: expect.stringContaining(`${testCase.targetModuleId}:${testCase.targetMemoryId}`),
		});
		await expect(compilation).rejects.not.toHaveProperty('line');
	});
});
