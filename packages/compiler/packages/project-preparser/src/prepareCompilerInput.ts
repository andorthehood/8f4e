import type { CompileInput, Module } from '@8f4e/language-spec';
import { documentBlockInstructionByType } from '@8f4e/language-spec';
import { getDocumentProjectBlockType, getProjectBlockType } from './blockClassification';
import type { ProjectIncludeResolverAsync } from './functionIncludes';
import { resolveProjectIncludesAsync } from './functionIncludes';
import { parseProjectSource } from './parseProjectSource';
import type { ProjectBlock, ProjectDocument } from './types';

export interface PrepareCompilerInputOptions {
	resolveInclude?: ProjectIncludeResolverAsync;
}

const constantsBlockType = documentBlockInstructionByType.constants.type;
const functionBlockType = documentBlockInstructionByType.function.type;
const includesBlockType = documentBlockInstructionByType.includes.type;
const moduleBlockType = documentBlockInstructionByType.module.type;
const prototypeBlockType = documentBlockInstructionByType.prototype.type;

function assertProjectBlockId(block: ProjectBlock): void {
	if (!Number.isInteger(block.id)) {
		throw new Error('Project block is missing numeric id');
	}
}

function toCompilerModule(block: ProjectBlock): Module {
	return {
		code: block.code,
		projectBlockId: block.id,
	};
}

async function resolveIncludesBlock(
	block: ProjectBlock,
	resolveInclude: ProjectIncludeResolverAsync | undefined
): Promise<Module[]> {
	if (!resolveInclude) {
		return resolveProjectIncludesAsync([block], () => undefined);
	}

	return resolveProjectIncludesAsync([block], resolveInclude);
}

export async function prepareCompilerInputFromProjectBlocksAsync(
	blocks: readonly ProjectBlock[],
	options: PrepareCompilerInputOptions = {}
): Promise<CompileInput> {
	const entries: CompileInput['entries'] = { main: [] };
	const constants: Module[] = [];
	const functions: Module[] = [];
	const prototypes: Module[] = [];

	for (const block of blocks) {
		assertProjectBlockId(block);

		if (block.disabled) {
			continue;
		}

		const blockType = getProjectBlockType(block.code);
		if (blockType === moduleBlockType) {
			if (!block.entry) {
				throw new Error('Project module block is missing entry');
			}
			entries[block.entry] ??= [];
			entries[block.entry].push(toCompilerModule(block));
			continue;
		}
		if (blockType === constantsBlockType) {
			constants.push(toCompilerModule(block));
			continue;
		}
		if (blockType === functionBlockType) {
			functions.push(toCompilerModule(block));
			continue;
		}
		if (blockType === prototypeBlockType) {
			prototypes.push(toCompilerModule(block));
			continue;
		}
		if (getDocumentProjectBlockType(block.code) === includesBlockType) {
			functions.push(...(await resolveIncludesBlock(block, options.resolveInclude)));
		}
	}

	return { entries, functions, constants, prototypes };
}

export async function prepareCompilerInputAsync(
	project: ProjectDocument,
	options: PrepareCompilerInputOptions = {}
): Promise<CompileInput> {
	return prepareCompilerInputFromProjectBlocksAsync(project.codeBlocks, options);
}

export async function prepareCompilerInputFromProjectSourceAsync(
	source: string,
	options: PrepareCompilerInputOptions = {}
): Promise<CompileInput> {
	return prepareCompilerInputAsync(parseProjectSource(source), options);
}
