import { formatTestFailures, runTestProject } from '@8f4e/test-runner';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { compileProject, parseProjectSource } from '../src';
import { runFixtureProgramFile } from './testUtils';

describe('shared test runner', () => {
	it('reports original sites for scalar and pointer overloads, skipped branches, loops, and helper functions', async () => {
		const original = parseProjectSource(`8f4e/v1
entry test
module assertions
int value 7
push 1
push 2
add
call assert 3
push 9
push 10
call assert
push &value
call assert &value
push 3.14
call assert 3.14
push 2.5f64
call assert 2.5f64
push 0
if
push 99
call assert 99
ifEnd
loop 2
push 7
call assert 8
loopEnd
call helper
moduleEnd
entryEnd
function helper
push 5
call assert
- 5
functionEnd`);
		const saved = structuredClone(original);
		const result = await runTestProject(original, {
			compile: project => compileProject(project, { disableSharedMemory: true }),
		});
		const { assertionSites, assertions: events } = result;
		expect(original).toEqual(saved);
		expect(result.assertionCount).toBe(8);
		expect(result.failures.map(failure => failure.site.siteId)).toEqual([1, 6, 6]);
		expect(result.failures.map(failure => failure.assertIndex)).toEqual([1, 5, 6]);

		expect(assertionSites).toHaveLength(8);
		expect(events.map(event => event.site.siteId)).toEqual([0, 1, 2, 3, 4, 6, 6, 7]);
		expect(events.filter(event => !event.passed).map(event => event.site.siteId)).toEqual([1, 6, 6]);
		expect(events.find(event => event.site.siteId === 5)).toBeUndefined();
		for (const event of events) {
			const site = assertionSites[event.site.siteId];
			const block = [...original.modules, ...original.functions].find(block => block.id === site.projectBlockId)!;
			expect(block.code[site.lineNumber]).toMatch(/^call assert/);
		}
		expect(assertionSites[7]).toMatchObject({ codeBlockType: 'function', codeBlockId: 'helper', lineNumber: 2 });
		expect(formatTestFailures(result.failures)).toContain(
			'assert #5 expected 8, received 7 at module assertions, block line 23 (site 6)'
		);
	});

	it('resolves assertions in isolated nested groups and distinguishes same-named blocks', async () => {
		const project = parseProjectSource(`8f4e/v1
entry test
group parent
module repeated
call helper
moduleEnd
function helper
call assert 1 2
functionEnd
group child
module repeated
call assert 3 4
moduleEnd
groupEnd
groupEnd
entryEnd`);
		const result = await runTestProject(project, {
			compile: instrumented => compileProject(instrumented, { disableSharedMemory: true }),
		});
		expect(result.failures.map(failure => failure.site)).toMatchObject([
			{ projectGroupPath: 'parent/child', codeBlockId: 'repeated', lineNumber: 1, siteId: 1 },
			{ projectGroupPath: 'parent', codeBlockId: 'helper', codeBlockType: 'function', lineNumber: 1, siteId: 0 },
		]);
		expect(formatTestFailures(result.failures)).toContain('module parent/child/repeated, block line 2 (site 1)');
		expect(formatTestFailures(result.failures)).toContain('function parent/helper, block line 2 (site 0)');
	});

	it('executes exported test functions and reports NaN comparisons as failures', async () => {
		const project = parseProjectSource(`8f4e/v1
function test
#export
push -1.0
sqrt
call assert 0.0
functionEnd`);
		const result = await runTestProject(project, {
			compile: instrumented => compileProject(instrumented, { disableSharedMemory: true }),
		});
		expect(result.assertionCount).toBe(1);
		expect(result.failures).toMatchObject([
			{ received: Number.NaN, passed: false, site: { codeBlockType: 'function', codeBlockId: 'test', lineNumber: 4 } },
		]);
	});

	it('reports source sites through the compiler fixture adapter', async () => {
		const directory = await fs.mkdtemp(path.join(tmpdir(), '8f4e-assertion-'));
		const filePath = path.join(directory, 'failing.8f4e');
		try {
			await fs.writeFile(
				filePath,
				`8f4e/v1
entry test
module failure
call assert 3 4
moduleEnd
entryEnd`
			);
			await expect(runFixtureProgramFile(filePath)).rejects.toThrow(
				'failing.8f4e: 1 assertion failed:\n  assert #0 expected 4, received 3 at module failure, block line 2 (site 0)'
			);
		} finally {
			await fs.rm(directory, { recursive: true, force: true });
		}
	});
});
