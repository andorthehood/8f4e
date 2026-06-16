import { describe, expect, it } from 'vitest';
import {
	functionPreBodyInstructionNames,
	importedFunctionDeclarationInstructionNames,
	isFunctionBodyInstructionName,
	isFunctionPreBodyInstructionName,
	isImportedFunctionDeclarationInstructionName,
} from './instructions';

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
