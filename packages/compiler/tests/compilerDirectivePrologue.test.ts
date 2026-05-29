import { describe, expect, test } from 'vitest';
import { SyntaxErrorCode } from '@8f4e/tokenizer';

import compile from '../src/index';

const defaultOptions = {
	startingMemoryWordAddress: 1,
	environmentExtensions: {
		constants: {},
	},
	disableSharedMemory: true,
	includeAST: true,
};

describe('compiler directive prologue validation', () => {
	test('accepts module directives immediately after module', () => {
		expect(() =>
			compile(
				{
					groups: {
						main: [
							{
								code: ['module metadataOnly', '#skipExecution', '#loopCap 64', 'int counter 0', 'moduleEnd'],
							},
						],
					},
				},
				defaultOptions
			)
		).not.toThrow();
	});

	test('rejects module directives after declarations', () => {
		expect(() =>
			compile(
				{
					groups: {
						main: [
							{
								code: ['module lateDirective', 'int counter 0', '#skipExecution', 'moduleEnd'],
							},
						],
					},
				},
				defaultOptions
			)
		).toThrow(expect.objectContaining({ code: SyntaxErrorCode.COMPILER_DIRECTIVE_MUST_BE_PROLOGUE }));
	});

	test('rejects module loop caps after executable instructions', () => {
		expect(() =>
			compile(
				{
					groups: {
						main: [
							{
								code: ['module lateLoopCap', 'loop', 'loopEnd', '#loopCap 64', 'moduleEnd'],
							},
						],
					},
				},
				defaultOptions
			)
		).toThrow(expect.objectContaining({ code: SyntaxErrorCode.COMPILER_DIRECTIVE_MUST_BE_PROLOGUE }));
	});

	test('accepts function directives immediately after function', () => {
		expect(() =>
			compile(
				{
					groups: { main: [{ code: ['module test', 'moduleEnd'] }] },
					functions: [
						{
							code: [
								'function writeValue',
								'#export writeValue',
								'#impure',
								'#loopCap 64',
								'param int address',
								'param int value',
								'push address',
								'push value',
								'store',
								'functionEnd',
							],
						},
					],
				},
				defaultOptions
			)
		).not.toThrow();
	});

	test('rejects function directives after params', () => {
		expect(() =>
			compile(
				{
					groups: { main: [{ code: ['module test', 'moduleEnd'] }] },
					functions: [
						{
							code: ['function lateImpure', 'param int address', '#impure', 'push address', 'load', 'functionEnd int'],
						},
					],
				},
				defaultOptions
			)
		).toThrow(expect.objectContaining({ code: SyntaxErrorCode.COMPILER_DIRECTIVE_MUST_BE_PROLOGUE }));
	});

	test('rejects function exports after executable instructions', () => {
		expect(() =>
			compile(
				{
					groups: { main: [{ code: ['module test', 'moduleEnd'] }] },
					functions: [
						{
							code: ['function lateExport', 'push 1', '#export lateExport', 'functionEnd int'],
						},
					],
				},
				defaultOptions
			)
		).toThrow(expect.objectContaining({ code: SyntaxErrorCode.COMPILER_DIRECTIVE_MUST_BE_PROLOGUE }));
	});
});
