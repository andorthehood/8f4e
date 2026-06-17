import { describe, expect, it } from 'vitest';
import { instructionSpecs } from './instructionSpecs';
import {
	compiledModuleBlockTypes,
	compilerBlockInstructionPairs,
	compilerSourceBlockInstructionPairs,
	functionPreBodyInstructionNames,
	hasBinaryMatchingOperands,
	importedFunctionDeclarationInstructionNames,
	isFunctionBodyInstructionName,
	isFunctionPreBodyInstructionName,
	isImportedFunctionDeclarationInstructionName,
	stackBlockInstructionPairs,
} from './instructions';

const functionInstructionClassificationSamples = [
	'push',
	'local',
	'call',
	'param',
	'paramShape',
	'functionEnd',
	'const',
	'use',
	'#import',
	'#impure',
	'#loopCap',
	'#export',
] as const;

describe('instruction block classification', () => {
	it('snapshots derived block tables', () => {
		const binaryMatchingInstructionNames = Object.entries(instructionSpecs)
			.filter(([, spec]) => hasBinaryMatchingOperands(spec))
			.map(([instruction]) => instruction);

		expect({
			binaryMatchingInstructionNames,
			compiledModuleBlockTypes,
			compilerBlockInstructionPairs,
			compilerSourceBlockInstructionPairs,
			stackBlockInstructionPairs,
		}).toMatchSnapshot();
	});
});

describe('function instruction classification', () => {
	it('snapshots function classification tables', () => {
		expect({
			functionPreBodyInstructionNames,
			importedFunctionDeclarationInstructionNames,
			samples: Object.fromEntries(
				functionInstructionClassificationSamples.map(instruction => [
					instruction,
					{
						isFunctionBody: isFunctionBodyInstructionName(instruction),
						isFunctionPreBody: isFunctionPreBodyInstructionName(instruction),
						isImportedFunctionDeclaration: isImportedFunctionDeclarationInstructionName(instruction),
					},
				])
			),
		}).toMatchSnapshot();
	});
});
