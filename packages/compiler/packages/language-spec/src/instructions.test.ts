import { describe, expect, it } from 'vitest';
import {
	compiledModuleBlockTypes,
	compilerBlockInstructionPairs,
	compilerSourceBlockInstructionPairs,
	functionPreBodyInstructionNames,
	importedFunctionDeclarationInstructionNames,
	isFunctionBodyInstructionName,
	isFunctionPreBodyInstructionName,
	isImportedFunctionDeclarationInstructionName,
	stackBlockInstructionPairs,
} from './instructions';

describe('instruction block classification', () => {
	it('derives compiler block pairs from instruction specs', () => {
		expect(compilerBlockInstructionPairs).toEqual([
			{ start: 'block', end: 'blockEnd' },
			{ start: 'constants', end: 'constantsEnd' },
			{ start: 'function', end: 'functionEnd' },
			{ start: 'if', end: 'ifEnd' },
			{ start: 'loop', end: 'loopEnd' },
			{ start: 'mapBegin', end: 'mapEnd' },
			{ start: 'module', end: 'moduleEnd' },
			{ start: 'prototype', end: 'prototypeEnd' },
		]);
	});

	it('derives stack and source block tables from instruction specs', () => {
		expect(stackBlockInstructionPairs).toEqual([
			{ start: 'block', end: 'blockEnd' },
			{ start: 'if', end: 'ifEnd' },
			{ start: 'loop', end: 'loopEnd' },
		]);
		expect(compilerSourceBlockInstructionPairs).toEqual([
			{
				type: 'constants',
				start: 'constants',
				end: 'constantsEnd',
				compilesToModule: false,
				compilationMode: null,
			},
			{
				type: 'function',
				start: 'function',
				end: 'functionEnd',
				compilesToModule: false,
				compilationMode: 'function',
			},
			{
				type: 'module',
				start: 'module',
				end: 'moduleEnd',
				compilesToModule: true,
				compilationMode: 'module',
			},
			{
				type: 'prototype',
				start: 'prototype',
				end: 'prototypeEnd',
				compilesToModule: false,
				compilationMode: null,
			},
		]);
		expect(compiledModuleBlockTypes).toEqual(['module']);
	});
});

describe('function instruction classification', () => {
	it('classifies function pre-body instructions', () => {
		expect(functionPreBodyInstructionNames).toContain('const');
		expect(functionPreBodyInstructionNames).toContain('use');
		expect(isFunctionPreBodyInstructionName('param')).toBe(true);
		expect(isFunctionPreBodyInstructionName('paramShape')).toBe(true);
		expect(isFunctionPreBodyInstructionName('functionEnd')).toBe(true);
	});

	it('classifies executable function body instructions', () => {
		expect(isFunctionBodyInstructionName('push')).toBe(true);
		expect(isFunctionBodyInstructionName('local')).toBe(true);
		expect(isFunctionBodyInstructionName('call')).toBe(true);
		expect(isFunctionBodyInstructionName('param')).toBe(false);
		expect(isFunctionBodyInstructionName('const')).toBe(false);
		expect(isFunctionBodyInstructionName('use')).toBe(false);
	});

	it('classifies imported function declaration instructions', () => {
		expect(importedFunctionDeclarationInstructionNames).toContain('#import');
		expect(isImportedFunctionDeclarationInstructionName('param')).toBe(true);
		expect(isImportedFunctionDeclarationInstructionName('functionEnd')).toBe(true);
		expect(isImportedFunctionDeclarationInstructionName('#export')).toBe(false);
		expect(isImportedFunctionDeclarationInstructionName('push')).toBe(false);
	});
});
