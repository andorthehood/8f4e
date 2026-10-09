import { compileProject, parseProjectSource, serializeDiagnostic } from '@8f4e/compiler';
import type { ProjectObjectModel } from '@8f4e/language-spec';
import { compileToAST } from '@8f4e/tokenizer';
import { describe, expect, it } from 'vitest';
import { precompileTestProject } from './index';

function projectWithModule(code: string[]): ProjectObjectModel {
	return {
		...parseProjectSource('8f4e/v1'),
		modules: [{ id: 7, entry: 'test', code: ['module example', ...code, 'moduleEnd'] }],
	};
}

describe('precompileTestProject', () => {
	it('instruments inline and stack arguments while retaining the original source', () => {
		const original = projectWithModule(['push 2', 'call assert 2 ; expected', 'push 4', 'push 4', 'call assert']);
		const saved = structuredClone(original);
		const { project, assertionSites } = precompileTestProject(original);

		expect(project.modules[0].code).toEqual([
			'module example',
			'push 2',
			'call assert 2 0 ; expected',
			'push 4',
			'push 4',
			'call assert 1',
			'moduleEnd',
		]);
		expect(assertionSites).toEqual([
			{
				siteId: 0,
				projectBlockId: 7,
				projectGroupPath: '',
				codeBlockType: 'module',
				codeBlockId: 'example',
				lineNumber: 2,
			},
			{
				siteId: 1,
				projectBlockId: 7,
				projectGroupPath: '',
				codeBlockType: 'module',
				codeBlockId: 'example',
				lineNumber: 5,
			},
		]);
		expect(original).toEqual(saved);
		expect(precompileTestProject(original)).toEqual({ project, assertionSites });
	});

	it('assigns distinct sites to same-named blocks in nested groups and overloaded functions', () => {
		const original = parseProjectSource(`8f4e/v1
function helper
param int value
push value
call assert 1
functionEnd

function helper
param float value
push value
call assert 1.0
functionEnd

entry test
group parent
module repeated
push 1
call assert 1
moduleEnd
group child
module repeated
push 2
call assert 2
moduleEnd
groupEnd
groupEnd
group sibling
module repeated
push 3
call assert 3
moduleEnd
groupEnd
entryEnd`);
		const { assertionSites, project } = precompileTestProject(original);

		expect(assertionSites.map(site => site.siteId)).toEqual([0, 1, 2, 3, 4]);
		expect(assertionSites.map(site => site.projectGroupPath)).toEqual(['', '', 'parent', 'parent/child', 'sibling']);
		expect(assertionSites.slice(0, 2).map(site => site.codeBlockType)).toEqual(['function', 'function']);
		expect(assertionSites.slice(0, 2).map(site => site.projectBlockId)).toEqual(
			original.functions.map(block => block.id)
		);
		expect(project.groups[0].groups[0].modules[0].code[2]).toBe('call assert 2 3');
		expect(project.functions[0].code[3]).toBe('call assert 1 0');
	});

	it('preserves line positions and appends IDs after continued arguments', () => {
		const original = projectWithModule([
			'call assert',
			'; comment between arguments',
			'  - 3 ; received',
			'',
			'  - 3 ; expected',
			'call assert 4',
			'  - 4',
		]);
		const { project, assertionSites } = precompileTestProject(original);
		const code = project.modules[0].code;

		expect(code).toEqual([
			'module example',
			'call assert 3 3 0',
			'; comment between arguments',
			'  ; - 3 ; received',
			'',
			'  ; - 3 ; expected',
			'call assert 4 4 1',
			'  ; - 4',
			'moduleEnd',
		]);
		expect(code).toHaveLength(original.modules[0].code.length);
		expect(assertionSites.map(site => site.lineNumber)).toEqual([1, 6]);
		const calls = compileToAST(code).lines.filter(line => line.instruction === 'call');
		expect(
			calls.map(line => line.arguments.slice(1).map(argument => ('value' in argument ? argument.value : argument)))
		).toEqual([
			[3, 3, 0],
			[4, 4, 1],
		]);
		expect(calls.map(line => line.lineNumber)).toEqual([1, 6]);
	});

	it('normalizes CRLF for compilation while retaining quoted semicolons, escaped quotes, and inline comments', () => {
		const original = projectWithModule(['call assert "a;\\"b"  ; expected\r', 'call assert -3\r']);
		const { project } = precompileTestProject(original);
		expect(project.modules[0].code[1]).toBe('call assert "a;\\"b" 0  ; expected');
		expect(project.modules[0].code[2]).toBe('call assert -3 1');
		expect(compileToAST(project.modules[0].code).lines.filter(line => line.instruction === 'call')).toHaveLength(2);
	});

	it('retains inline comments when folding a continued assertion', () => {
		const { project } = precompileTestProject(projectWithModule(['call assert ; assertion', '- 2 ; value', '- 2']));
		expect(project.modules[0].code[1]).toBe('call assert 2 2 0 ; assertion');
		expect(project.modules[0].code[2]).toBe('; - 2 ; value');
		expect(project.modules[0].code[3]).toBe('; - 2');
	});

	it('ignores disabled blocks, notes, comments, includes, and other call targets', () => {
		const original = projectWithModule(['; call assert 1', 'call assertSomething 1', 'call log "call assert 1"']);
		original.modules.push({ id: 8, entry: 'test', disabled: true, code: ['module disabled', 'call', 'moduleEnd'] });
		original.notes.push({ id: 9, code: ['note', 'call assert 1', 'noteEnd'] });
		original.includes.push({ id: 10, code: ['includes', 'include helpers', 'includesEnd'] });
		const { project, assertionSites } = precompileTestProject(original);
		expect(project).toEqual(original);
		expect(assertionSites).toEqual([]);
	});

	it('keeps original source context on tokenizer errors', () => {
		try {
			precompileTestProject(projectWithModule(['call']));
			expect.fail('Expected a syntax error');
		} catch (error) {
			expect(serializeDiagnostic(error)).toMatchObject({
				line: { lineNumber: 1, instruction: 'call' },
				context: { projectBlockId: 7, projectGroupPath: '' },
			});
		}
	});
});

describe('compiled assertions', () => {
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
		const { project, assertionSites } = precompileTestProject(original);
		project.functions.push(
			...['int', 'float', 'float64', 'int*'].map((type, index) => ({
				id: -1 - index,
				code: [
					'function assert',
					'#import assert',
					`param ${type} received`,
					`param ${type} expected`,
					'param int siteId',
					'functionEnd',
				],
			}))
		);
		const compiled = await compileProject(project, { disableSharedMemory: true });
		const events: Array<{ siteId: number; received: number; expected: number; passed: boolean }> = [];
		const { instance } = await WebAssembly.instantiate(new Uint8Array(compiled.codeBuffer), {
			host: {
				memory: new WebAssembly.Memory({ initial: 1, maximum: 1 }),
				assert(received: number, expected: number, siteId: number) {
					events.push({ siteId, received, expected, passed: Math.abs(received - expected) <= 0.001 });
				},
			},
		});
		(instance.exports.initDefaults as CallableFunction)();
		(instance.exports.test as CallableFunction)();

		expect(assertionSites).toHaveLength(8);
		expect(events.map(event => event.siteId)).toEqual([0, 1, 2, 3, 4, 6, 6, 7]);
		expect(events.filter(event => !event.passed).map(event => event.siteId)).toEqual([1, 6, 6]);
		expect(events.find(event => event.siteId === 5)).toBeUndefined();
		for (const event of events) {
			const site = assertionSites[event.siteId];
			const block = [...original.modules, ...original.functions].find(block => block.id === site.projectBlockId)!;
			expect(block.code[site.lineNumber]).toMatch(/^call assert/);
		}
		expect(assertionSites[7]).toMatchObject({ codeBlockType: 'function', codeBlockId: 'helper', lineNumber: 2 });
	});
});
