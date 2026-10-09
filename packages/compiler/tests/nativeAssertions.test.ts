import { type CompileResult, ErrorCode } from '@8f4e/language-spec';
import { describe, expect, it, vi } from 'vitest';
import { compileProject, parseProjectSource } from '../src';

async function instantiate(result: CompileResult, callbacks: Record<string, CallableFunction> = {}) {
	const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
	const { instance } = await WebAssembly.instantiate(new Uint8Array(result.codeBuffer), {
		host: { memory, ...callbacks },
	});
	return { memory, exports: instance.exports as Record<string, CallableFunction> };
}

function compile(source: string, enableAssertions?: boolean) {
	return compileProject(parseProjectSource(`8f4e/v1\n${source}`), { disableSharedMemory: true, enableAssertions });
}

function imports(result: CompileResult) {
	return WebAssembly.Module.imports(new WebAssembly.Module(new Uint8Array(result.codeBuffer)))
		.filter(item => item.kind === 'function')
		.map(item => item.name);
}

describe('native compiler assertions', () => {
	it.each([undefined, false])(
		'consumes operands without imports or sites when enableAssertions is %s',
		async enabled => {
			const result = await compile(
				`function tick
#import tick
functionEnd int
function calculate
#export
push 40
call tick
assert
push 2.0
push 2.0
assertEqual
push 3.0f64
push 3.0f64
assertEqual
push 2
add
functionEnd int`,
				enabled
			);
			expect(imports(result)).toEqual(['tick']);
			expect(result.assertionSites).toBeUndefined();
			const tick = vi.fn(() => 0);
			const runtime = await instantiate(result, { tick });
			expect(runtime.exports.calculate()).toBe(42);
			expect(tick).toHaveBeenCalledOnce();
		}
	);

	it('reports all typed operands and static sites without stopping after a failure', async () => {
		const project = parseProjectSource(`8f4e/v1
entry main
module checks
int first 7
int second 7
push 0
assert
push -3
assert
push 3
push 4
assertEqual
push 1.25
push 1.2501
assertEqual
push 1.25f64
push 1.25f64
assertEqual
push &first
push &second
assertEqual
push &first
push &first
assertEqual
moduleEnd
entryEnd`);
		const original = structuredClone(project);
		const result = await compileProject(project, { enableAssertions: true, disableSharedMemory: true });
		expect(project).toEqual(original);
		expect(imports(result)).toEqual(['assertCondition', 'assertEqualI32', 'assertEqualF32', 'assertEqualF64']);
		const events: Array<{ siteId: number; received: number; expected?: number; passed: boolean }> = [];
		const equal = (received: number, expected: number, siteId: number) => {
			events.push({ received, expected, siteId, passed: received === expected });
		};
		const runtime = await instantiate(result, {
			assertCondition: (received: number, siteId: number) => events.push({ received, siteId, passed: received !== 0 }),
			assertEqualI32: equal,
			assertEqualF32: equal,
			assertEqualF64: equal,
		});
		runtime.exports.initDefaults();
		runtime.exports.main();
		expect(events.map(event => event.passed)).toEqual([false, true, false, false, true, false, true]);
		expect(events.map(event => event.siteId)).toEqual([0, 1, 2, 3, 4, 5, 6]);
		expect(events[3].expected).toBe(Math.fround(1.2501));
		for (const site of result.assertionSites!) {
			expect(site).toMatchObject({
				projectBlockId: project.modules[0].id,
				projectGroupPath: '',
				codeBlockType: 'module',
				codeBlockId: 'checks',
			});
			expect(project.modules[0].code[site.lineNumber]).toBe(site.instruction);
		}
	});

	it('asserts supplied current state without initializing or resetting memory', async () => {
		const result = await compile(
			`entry main
module state
int value 1
push value
push 9
assertEqual
moduleEnd
entryEnd`,
			true
		);
		const equal = vi.fn();
		const runtime = await instantiate(result, { assertEqualI32: equal });
		const index = result.memoryPlan.modules.state.memory.value.wordAlignedAddress;
		new Int32Array(runtime.memory.buffer)[index] = 9;
		runtime.exports.main();
		expect(equal).toHaveBeenCalledWith(9, 9, 0);
		expect(new Int32Array(runtime.memory.buffer)[index]).toBe(9);
	});

	it('keeps user import, function, entry, and initDefaults indices correct', async () => {
		const result = await compile(
			`function twice
#import twice
param int value
functionEnd int
function helper
#export
param int value
push value
push 3
assertEqual
call twice value
functionEnd int
entry test
module checks
int output 17
push &output
call helper 3
store
push output
push 6
assertEqual
moduleEnd
entryEnd`,
			true
		);
		expect(imports(result)).toEqual(['twice', 'assertEqualI32']);
		const equal = vi.fn();
		const twice = vi.fn((value: number) => value * 2);
		const runtime = await instantiate(result, { twice, assertEqualI32: equal });
		runtime.exports.initDefaults();
		expect(equal).not.toHaveBeenCalled();
		const view = new Int32Array(runtime.memory.buffer);
		const index = result.memoryPlan.modules.checks.memory.output.wordAlignedAddress;
		expect(view[index]).toBe(17);
		runtime.exports.main();
		expect(twice).not.toHaveBeenCalled();
		runtime.exports.test();
		expect(view[index]).toBe(6);
		expect(equal.mock.calls).toEqual([
			[3, 3, 1],
			[6, 6, 0],
		]);
		expect(runtime.exports.helper(3)).toBe(6);
		runtime.exports.initDefaults();
		expect(view[index]).toBe(17);
	});

	it('calls a generated entry dispatcher from a defined function after native imports are planned', async () => {
		const result = await compile(
			`function invoke
#export
call test
functionEnd
entry test
module checks
push 1
assert
moduleEnd
entryEnd`,
			true
		);
		const condition = vi.fn();
		const runtime = await instantiate(result, { assertCondition: condition });
		runtime.exports.main();
		expect(condition).not.toHaveBeenCalled();
		runtime.exports.invoke();
		expect(condition).toHaveBeenCalledWith(1, 0);
	});

	it('coexists with an ordinary imported assert function', async () => {
		const result = await compile(
			`function assert
#import assert
param int received
param int expected
functionEnd
entry main
module checks
call assert 7 7
push 1
assert
push 2
push 2
assertEqual
moduleEnd
entryEnd`,
			true
		);
		const legacy = vi.fn();
		const condition = vi.fn();
		const equal = vi.fn();
		const runtime = await instantiate(result, { assert: legacy, assertCondition: condition, assertEqualI32: equal });
		runtime.exports.main();
		expect(legacy).toHaveBeenCalledWith(7, 7);
		expect(condition).toHaveBeenCalledWith(1, 0);
		expect(equal).toHaveBeenCalledWith(2, 2, 1);
	});

	it('tracks physical lines, nested names, skipped sites, and repeated invocations across cached compilations', async () => {
		const project = parseProjectSource(`8f4e/v1
entry main
group parent
group child
module repeated
; A physical comment line.
push
- 0
if
push 1
assert
ifEnd
loop 2
call helper
loopEnd
moduleEnd
function helper
#export
; Export removal must not shift the source line.
push 1
assert
functionEnd
groupEnd
module repeated
push 2
assert
moduleEnd
groupEnd
entryEnd`);
		const options = { enableAssertions: true, disableSharedMemory: true };
		const result = await compileProject(project, options);
		const cached = await compileProject(project, { ...options, cache: result.cache });
		expect(cached.codeBuffer).toEqual(result.codeBuffer);
		expect(cached.assertionSites).toEqual(result.assertionSites);
		expect(result.assertionSites).toMatchObject([
			{ siteId: 0, codeBlockId: 'repeated', projectGroupPath: 'parent/child', lineNumber: 6 },
			{ siteId: 1, codeBlockId: 'repeated', projectGroupPath: 'parent', lineNumber: 2 },
			{ siteId: 2, codeBlockId: 'helper', codeBlockType: 'function', projectGroupPath: 'parent/child', lineNumber: 4 },
		]);
		const condition = vi.fn();
		const runtime = await instantiate(cached, { assertCondition: condition });
		runtime.exports.main();
		expect(condition.mock.calls).toEqual([
			[1, 2],
			[1, 2],
			[2, 1],
		]);
	});

	it('maps assertions in included functions back to their original source symbol', async () => {
		const project = parseProjectSource(`8f4e/v1
entry main
group included
includes
include checking-helper
includesEnd
module caller
call includedCheck
moduleEnd
groupEnd
entryEnd`);
		const result = await compileProject(project, {
			enableAssertions: true,
			disableSharedMemory: true,
			resolveInclude: () => `function originalCheck
#export includedCheck
; Source identity survives renaming and group qualification.
push 1
assert
functionEnd`,
		});
		expect(result.assertionSites).toEqual([
			{
				siteId: 0,
				instruction: 'assert',
				projectGroupPath: 'included',
				codeBlockType: 'function',
				codeBlockId: 'originalCheck',
				functionId: 'included/includedCheck__void',
				lineNumber: 4,
				source: { kind: 'include', includeId: 'checking-helper', symbolName: 'originalCheck' },
			},
		]);
		const condition = vi.fn();
		const runtime = await instantiate(result, { assertCondition: condition });
		runtime.exports.main();
		expect(condition).toHaveBeenCalledWith(1, 0);
	});

	it.each(['float', 'float64'])('preserves %s NaN, infinities, signed zero, and close unequal values', async type => {
		const result = await compile(
			`function check
#export
param ${type} received
param ${type} expected
push received
push expected
assertEqual
functionEnd`,
			true
		);
		const values: Array<[number, number, boolean]> = [];
		const callback = (received: number, expected: number) => values.push([received, expected, received === expected]);
		const runtime = await instantiate(result, { [type === 'float' ? 'assertEqualF32' : 'assertEqualF64']: callback });
		for (const pair of [
			[NaN, NaN],
			[Infinity, Infinity],
			[Infinity, -Infinity],
			[-0, 0],
			[1, 1.0001],
		]) {
			runtime.exports.check(...pair);
		}
		expect(values.map(item => item[2])).toEqual([false, true, false, true, false]);
		expect(Object.is(values[3][0], -0)).toBe(true);
	});

	it.each(['int*', 'float64**'])('compares %s parameter addresses without accessing memory', async type => {
		const result = await compile(
			`function check
#export
param ${type} left
param ${type} right
push left
push right
assertEqual
functionEnd`,
			true
		);
		const equal = vi.fn();
		const runtime = await instantiate(result, { assertEqualI32: equal });
		runtime.exports.check(-1, -1);
		expect(equal).toHaveBeenCalledWith(-1, -1, 0);
		expect(result.assertionSites![0].functionId).toBe(Object.keys(result.compiledFunctions!)[0]);
	});

	it('supports the default shared-memory compilation mode', async () => {
		const result = await compileProject(
			parseProjectSource(`8f4e/v1
entry main
module checks
push 1
assert
moduleEnd
entryEnd`),
			{ enableAssertions: true }
		);
		const condition = vi.fn();
		const memory = new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true });
		const { instance } = await WebAssembly.instantiate(new Uint8Array(result.codeBuffer), {
			host: { memory, assertCondition: condition },
		});
		(instance.exports.main as CallableFunction)();
		expect(condition).toHaveBeenCalledWith(1, 0);
	});

	it('requires only used callbacks and produces an empty lookup for an assertion-free enabled program', async () => {
		const result = await compile('entry main\nmodule empty\nmoduleEnd\nentryEnd', true);
		expect(result.assertionSites).toEqual([]);
		expect(imports(result)).toEqual([]);
		(await instantiate(result)).exports.main();
		const condition = await compile('entry main\nmodule condition\npush 1\nassert\nmoduleEnd\nentryEnd', true);
		expect(imports(condition)).toEqual(['assertCondition']);
		await expect(instantiate(condition)).rejects.toBeInstanceOf(WebAssembly.LinkError);
	});

	it.each([false, true])('rejects invalid operand counts/types with assertions enabled=%s', async enabled => {
		for (const [body, code] of [
			['assert', ErrorCode.INSUFFICIENT_OPERANDS],
			['push 1\nassertEqual', ErrorCode.INSUFFICIENT_OPERANDS],
			['push 1.0\nassert', ErrorCode.ONLY_INTEGERS],
			['push 1\npush 1.0\nassertEqual', ErrorCode.UNMATCHING_OPERANDS],
			['push 1.0\npush 1.0f64\nassertEqual', ErrorCode.UNMATCHING_OPERANDS],
			['int x\npush &x\npush 1\nassertEqual', ErrorCode.UNMATCHING_OPERANDS],
			['int x\nfloat y\npush &x\npush &y\nassertEqual', ErrorCode.UNMATCHING_OPERANDS],
		] as const) {
			await expect(compile(`entry main\nmodule invalid\n${body}\nmoduleEnd\nentryEnd`, enabled)).rejects.toMatchObject({
				code,
			});
		}
	});
});
