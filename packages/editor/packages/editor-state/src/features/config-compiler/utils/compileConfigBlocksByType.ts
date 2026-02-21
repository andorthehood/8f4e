import { ConfigType } from './combineConfigBlocks';
import { collectConfigBlocks } from './collectConfigBlocks';
import isPlainObject from './isPlainObject';

import type { JSONSchemaLike } from '@8f4e/stack-config-compiler';
import type { CodeBlockGraphicData, CodeError, State } from '~/types';

type CompileConfigFn = NonNullable<State['callbacks']['compileConfig']>;

interface CompileConfigParams {
	codeBlocks: CodeBlockGraphicData[];
	configType: ConfigType;
	schema: JSONSchemaLike;
	compileConfig: CompileConfigFn;
}

interface CompileConfigResult {
	mergedConfig: Record<string, unknown>;
	errors: CodeError[];
	hasSource: boolean;
}

export async function compileConfigBlocksByType({
	codeBlocks,
	configType,
	schema,
	compileConfig,
}: CompileConfigParams): Promise<CompileConfigResult> {
	const errors: CodeError[] = [];
	const configBlocks = collectConfigBlocks(codeBlocks)
		.filter(({ configType: blockType }) => blockType === configType)
		.filter(({ source }) => source.trim().length > 0);
	const hasSource = configBlocks.length > 0;

	if (!hasSource) {
		return { mergedConfig: {}, errors, hasSource };
	}

	try {
		const result = await compileConfig(
			configBlocks.map(({ source }) => source),
			schema
		);

		if (result.errors.length > 0) {
			for (const error of result.errors) {
				if (typeof error.blockIndex === 'number' && configBlocks[error.blockIndex]) {
					const block = configBlocks[error.blockIndex];
					errors.push({
						lineNumber: error.line,
						message: error.message,
						codeBlockId: block.block.creationIndex,
					});
				} else if (configBlocks.length > 0) {
					errors.push({
						lineNumber: 1,
						message: error.message,
						codeBlockId: configBlocks[0].block.creationIndex,
					});
				}
			}
		}

		let mergedConfig: Record<string, unknown> = {};
		if (result.config !== null && isPlainObject(result.config)) {
			mergedConfig = result.config as Record<string, unknown>;
		}

		return { mergedConfig, errors, hasSource };
	} catch (error) {
		if (configBlocks.length > 0) {
			errors.push({
				lineNumber: 1,
				message: error instanceof Error ? error.message : String(error),
				codeBlockId: configBlocks[0].block.creationIndex,
			});
		}
		return { mergedConfig: {}, errors, hasSource };
	}
}

if (import.meta.vitest) {
	const { describe, it, expect, vi } = import.meta.vitest;
	const { createMockCodeBlock } = await import('../../../pureHelpers/testingUtils/testUtils');

	describe('compileConfigBlocksByType', () => {
		it('passes block sources as an ordered array', async () => {
			const codeBlocks = [
				createMockCodeBlock({
					code: ['config project', 'scope "a"', 'push 1', 'set', 'configEnd'],
					blockType: 'config',
					creationIndex: 1,
				}),
				createMockCodeBlock({
					code: ['config project', 'scope "b"', 'push 2', 'set', 'configEnd'],
					blockType: 'config',
					creationIndex: 0,
				}),
			];
			const compileConfig = vi.fn().mockResolvedValue({ config: {}, errors: [] });

			await compileConfigBlocksByType({
				codeBlocks,
				configType: 'project',
				schema: { type: 'object' },
				compileConfig,
			});

			expect(compileConfig).toHaveBeenCalledTimes(1);
			expect(compileConfig).toHaveBeenCalledWith(['scope "b"\npush 2\nset', 'scope "a"\npush 1\nset'], {
				type: 'object',
			});
		});

		it('maps errors by blockIndex', async () => {
			const first = createMockCodeBlock({
				code: ['config project', 'push 1', 'configEnd'],
				blockType: 'config',
				creationIndex: 0,
			});
			const second = createMockCodeBlock({
				code: ['config project', 'set', 'configEnd'],
				blockType: 'config',
				creationIndex: 1,
			});
			const compileConfig = vi.fn().mockResolvedValue({
				config: null,
				errors: [{ line: 1, message: 'Cannot set: data stack is empty', blockIndex: 1 }],
			});

			const result = await compileConfigBlocksByType({
				codeBlocks: [first, second],
				configType: 'project',
				schema: { type: 'object' },
				compileConfig,
			});

			expect(result.errors).toEqual([
				{
					lineNumber: 1,
					message: 'Cannot set: data stack is empty',
					codeBlockId: 1,
				},
			]);
		});
	});
}
