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
		expect({
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
