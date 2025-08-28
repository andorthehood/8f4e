/**
 * Factory functions for creating test Project objects and related data
 */

import { Project, CodeBlock, BinaryAsset, EMPTY_DEFAULT_PROJECT } from '../../state/types';

/**
 * Create a test project with customizable properties
 */
export function createTestProject(overrides: Partial<Project> = {}): Project {
	return {
		...EMPTY_DEFAULT_PROJECT,
		title: 'Test Project',
		author: 'Test Author',
		description: 'A test project for unit testing',
		...overrides,
	};
}

/**
 * Create a project with multiple code blocks
 */
export function createProjectWithCodeBlocks(codeBlocks: Partial<CodeBlock>[] = []): Project {
	const defaultCodeBlocks: CodeBlock[] = codeBlocks.map((block, index) => ({
		code: [`// Code block ${index + 1}`, 'test code'],
		isOpen: true,
		x: index * 100,
		y: index * 50,
		viewport: { x: 0, y: 0 },
		...block,
	}));

	return createTestProject({
		codeBlocks: defaultCodeBlocks,
	});
}

/**
 * Create a project with binary assets
 */
export function createProjectWithBinaryAssets(assets: Partial<BinaryAsset>[] = []): Project {
	const defaultAssets: BinaryAsset[] = assets.map((asset, index) => ({
		moduleId: `module${index + 1}`,
		memoryId: `memory${index + 1}`,
		data: btoa(`test binary data ${index + 1}`),
		fileName: `asset${index + 1}.bin`,
		...asset,
	}));

	return createTestProject({
		binaryAssets: defaultAssets,
	});
}

/**
 * Create a project with specific runtime settings
 */
export function createProjectWithRuntime(runtimeType: string = 'WebWorkerLogicRuntime', sampleRate: number = 50): Project {
	return createTestProject({
		selectedRuntime: 0,
		runtimeSettings: [
			{
				runtime: runtimeType as any,
				sampleRate,
			},
		],
	});
}

/**
 * Create a project with custom viewport
 */
export function createProjectWithViewport(x: number = 0, y: number = 0): Project {
	return createTestProject({
		viewport: { x, y },
	});
}

/**
 * Create a code block for testing
 */
export function createTestCodeBlock(overrides: Partial<CodeBlock> = {}): CodeBlock {
	return {
		code: ['// Test code block', 'test instruction'],
		isOpen: true,
		x: 0,
		y: 0,
		viewport: { x: 0, y: 0 },
		...overrides,
	};
}

/**
 * Create nested code blocks for testing hierarchical structures
 */
export function createNestedCodeBlocks(depth: number = 2): CodeBlock {
	const createNestedBlock = (currentDepth: number): CodeBlock => {
		const block: CodeBlock = {
			code: [`// Level ${depth - currentDepth + 1} block`],
			isOpen: true,
			x: (depth - currentDepth) * 50,
			y: (depth - currentDepth) * 30,
			viewport: { x: 0, y: 0 },
		};

		if (currentDepth > 1) {
			block.codeBlocks = [createNestedBlock(currentDepth - 1)];
		}

		return block;
	};

	return createNestedBlock(depth);
}

/**
 * Create binary asset for testing
 */
export function createTestBinaryAsset(overrides: Partial<BinaryAsset> = {}): BinaryAsset {
	return {
		moduleId: 'testModule',
		memoryId: 'testMemory',
		data: btoa('test binary data'),
		fileName: 'test.bin',
		...overrides,
	};
}

/**
 * Create a complex project for integration testing
 */
export function createComplexTestProject(): Project {
	return createTestProject({
		title: 'Complex Test Project',
		author: 'Integration Test Suite',
		description: 'A complex project with multiple features for testing',
		codeBlocks: [
			createTestCodeBlock({ 
				code: ['// Main block', 'main function'],
				x: 0, y: 0,
				codeBlocks: [
					createTestCodeBlock({ 
						code: ['// Nested block', 'nested function'],
						x: 100, y: 100,
					}),
				],
			}),
			createTestCodeBlock({ 
				code: ['// Secondary block', 'secondary function'],
				x: 200, y: 0,
			}),
		],
		viewport: { x: 50, y: 25 },
		binaryAssets: [
			createTestBinaryAsset({ fileName: 'sound.wav' }),
			createTestBinaryAsset({ fileName: 'texture.png' }),
		],
		runtimeSettings: [
			{ runtime: 'WebWorkerLogicRuntime', sampleRate: 44100 },
			{ runtime: 'AudioWorkletRuntime', sampleRate: 44100 },
		],
	});
}