import { ErrorCode } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import { compileProject, parseProjectSource } from '../src';

const includeSource = [
	'function increment',
	'#export inc',
	'param int value',
	'call helper value',
	'functionEnd int',
	'function increment',
	'#export inc',
	'param float value',
	'call helper value',
	'functionEnd float',
	'function twice',
	'#export',
	'param int value',
	'call inc value',
	'call increment',
	'functionEnd int',
	'function helper',
	'param int value',
	'push value',
	'push 1',
	'add',
	'functionEnd int',
	'function helper',
	'param float value',
	'push value',
	'push 1.0',
	'add',
	'functionEnd float',
].join('\n');

function projectSource(declarations: string[], body: string[]) {
	return [
		'8f4e/v1',
		'includes',
		...declarations,
		'includesEnd',
		'entry main',
		'module result',
		...body,
		'moduleEnd',
		'entryEnd',
	].join('\n');
}

describe('include export selection compilation', () => {
	it('executes renamed overloads, multiple selections, and aliases sharing private helpers', async () => {
		const loads: string[] = [];
		const result = await compileProject(
			parseProjectSource(
				projectSource(
					[
						'include test/math inc addOne',
						'include test/math twice addTwo',
						'include test/math inc incrementAgain',
						'include test/math inc addOne',
					],
					[
						'int integerResult',
						'float floatResult',
						'int twiceResult',
						'int aliasResult',
						'push &integerResult',
						'call addOne 10',
						'store',
						'push &floatResult',
						'call addOne 1.5',
						'store',
						'push &twiceResult',
						'call addTwo 20',
						'store',
						'push &aliasResult',
						'call incrementAgain 30',
						'store',
					]
				)
			),
			{
				disableSharedMemory: true,
				resolveInclude: async includeId => {
					loads.push(includeId);
					return includeSource;
				},
			}
		);
		const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
		const { instance } = await WebAssembly.instantiate(result.codeBuffer, { host: { memory } });
		(instance.exports.initDefaults as CallableFunction)();
		(instance.exports.main as CallableFunction)();
		const fields = result.memoryPlan.modules.result!.memory;
		expect(new Int32Array(memory.buffer)[fields.integerResult!.wordAlignedAddress]).toBe(11);
		expect(new Float32Array(memory.buffer)[fields.floatResult!.wordAlignedAddress]).toBe(2.5);
		expect(new Int32Array(memory.buffer)[fields.twiceResult!.wordAlignedAddress]).toBe(22);
		expect(new Int32Array(memory.buffer)[fields.aliasResult!.wordAlignedAddress]).toBe(31);
		expect(loads).toEqual(['test/math']);
	});

	it('keeps unselected exports available to internal calls', async () => {
		const result = await compileProject(
			parseProjectSource(
				projectSource(['include test/math twice addTwo'], ['int output', 'push &output', 'call addTwo 5', 'store'])
			),
			{
				disableSharedMemory: true,
				resolveInclude: () => includeSource,
			}
		);
		const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
		const { instance } = await WebAssembly.instantiate(result.codeBuffer, { host: { memory } });
		(instance.exports.main as CallableFunction)();
		expect(new Int32Array(memory.buffer)[result.memoryPlan.modules.result!.memory.output!.wordAlignedAddress]).toBe(7);
	});

	it.each(['inc', 'twice', 'helper'])('does not expose an unselected or renamed name: %s', name => {
		return expect(
			compileProject(parseProjectSource(projectSource(['include test/math inc addOne'], [`call ${name} 1`, 'drop'])), {
				disableSharedMemory: true,
				resolveInclude: () => includeSource,
			})
		).rejects.toMatchObject({ code: ErrorCode.UNDEFINED_FUNCTION });
	});

	it('rejects local names with duplicate function signatures', async () => {
		await expect(
			compileProject(
				parseProjectSource(
					projectSource(['include test/math inc same', 'include test/math twice same'], ['call same 1', 'drop'])
				),
				{
					disableSharedMemory: true,
					resolveInclude: () => includeSource,
				}
			)
		).rejects.toMatchObject({ code: ErrorCode.DUPLICATE_FUNCTION_SIGNATURE });
	});
});
