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
push 3
assertEqual
push 9
push 10
assertEqual
push &value
push &value
assertEqual
push 3.14
push 3.14
assertEqual
push 2.5f64
push 2.5f64
assertEqual
push 0
if
push 99
push 99
assertEqual
ifEnd
loop 2
push 7
push 8
assertEqual
loopEnd
call helper
moduleEnd
entryEnd
function helper
push 5
push 5
assertEqual
functionEnd`);
		const saved = structuredClone(original);
		const result = await runTestProject(original, {
			compile: (project, options) => compileProject(project, options),
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
			expect(block.code[site.lineNumber]).toMatch(/^assertEqual/);
		}
		expect(assertionSites[7]).toMatchObject({ codeBlockType: 'function', codeBlockId: 'helper', lineNumber: 3 });
		expect(formatTestFailures(result.failures)).toContain(
			'assertEqual #5 expected 8, received 7 at module assertions, block line 29 (site 6)'
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
push 1
push 2
assertEqual
functionEnd
group child
module repeated
push 3
push 4
assertEqual
moduleEnd
groupEnd
groupEnd
entryEnd`);
		const result = await runTestProject(project, {
			compile: (project, options) => compileProject(project, options),
		});
		expect(result.failures.map(failure => failure.site)).toMatchObject([
			{ projectGroupPath: 'parent/child', codeBlockId: 'repeated', lineNumber: 3, siteId: 0 },
			{ projectGroupPath: 'parent', codeBlockId: 'helper', codeBlockType: 'function', lineNumber: 3, siteId: 1 },
		]);
		expect(formatTestFailures(result.failures)).toContain('module parent/child/repeated, block line 4 (site 0)');
		expect(formatTestFailures(result.failures)).toContain('function parent/helper, block line 4 (site 1)');
	});

	it('executes exported test functions and reports NaN comparisons as failures', async () => {
		const project = parseProjectSource(`8f4e/v1
function test
#export
push -1.0
sqrt
push 0.0
assertEqual
functionEnd`);
		const result = await runTestProject(project, {
			compile: (project, options) => compileProject(project, options),
		});
		expect(result.assertionCount).toBe(1);
		expect(result.failures).toMatchObject([
			{ received: Number.NaN, passed: false, site: { codeBlockType: 'function', codeBlockId: 'test', lineNumber: 5 } },
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
push 3
push 4
assertEqual
moduleEnd
entryEnd`
			);
			await expect(runFixtureProgramFile(filePath)).rejects.toThrow(
				'failing.8f4e: 1 assertion failed:\n  assertEqual #0 expected 4, received 3 at module failure, block line 4 (site 0)'
			);
		} finally {
			await fs.rm(directory, { recursive: true, force: true });
		}
	});
});

describe('native assertion source reporting', () => {
	it('reports assertions from included helpers with physical source lines', async () => {
		const included = [
			'function verify',
			'#export',
			'; source comment',
			'push',
			'- 0',
			'assert',
			'push 3',
			'push 4',
			'assertEqual',
			'functionEnd',
		].join('\n');
		const result = await runTestProject(
			parseProjectSource(`8f4e/v1
includes
include tests/verify
includesEnd
entry test
module driver
call verify
moduleEnd
entryEnd`),
			{
				compile: (project, options) => compileProject(project, { ...options, resolveInclude: () => included }),
			}
		);
		expect(result.failures).toHaveLength(2);
		expect(result.assertionSites.map(site => site.lineNumber)).toEqual([5, 8]);
		expect(result.failures[0].site.source).toEqual({
			kind: 'include',
			includeId: 'tests/verify',
			symbolName: 'verify',
		});
		expect(formatTestFailures(result.failures)).toContain('include tests/verify (verify)');
	});

	it('requires the compile callback to enable native assertions', async () => {
		const project = parseProjectSource(`8f4e/v1
entry test
module check
push 1
assert
moduleEnd
entryEnd`);
		await expect(
			runTestProject(project, {
				compile: project => compileProject(project, { disableSharedMemory: true }),
			})
		).rejects.toThrow('enableAssertions: true');
	});
});

it('initializes fresh memory once per project run and executes only the test entry', async () => {
	const project = parseProjectSource(`8f4e/v1
entry init
module resetCounter
push &counter:value
push 99
store
moduleEnd
entryEnd
entry test
module counter
int value 7
push value
push 7
assertEqual
push &value
push 11
store
moduleEnd
entryEnd`);
	const options = {
		compile: (project: Parameters<typeof compileProject>[0], options: Parameters<typeof compileProject>[1]) =>
			compileProject(project, options),
	};
	const first = await runTestProject(project, options);
	const second = await runTestProject(project, options);
	const address = first.compileResult.memoryPlan.modules.counter.memory.value.wordAlignedAddress;
	expect(first.failures).toHaveLength(0);
	expect(second.failures).toHaveLength(0);
	expect(first.assertionCount).toBe(1);
	expect(first.host.memory).not.toBe(second.host.memory);
	expect(new Int32Array((first.host.memory as WebAssembly.Memory).buffer)[address]).toBe(11);
});
