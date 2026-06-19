import type { CompileInput, Module } from '@8f4e/language-spec';
import { documentBlockInstructionByType } from '@8f4e/language-spec';
import { getDocumentProjectBlockType, getProjectBlockType } from './blockClassification';
import { resolveFunctionIncludeSource } from './functionIncludes';
import { parseProjectSource } from './parseProjectSource';
import type { ProjectBlock } from './types';

export interface ProjectSourceTreeNode {
	includeId: string;
	source: string;
	children: readonly ProjectSourceTreeNode[];
}

export interface ProjectSourceTree {
	source: string;
	children: readonly ProjectSourceTreeNode[];
}

export interface PrepareCompilerInputFromProjectSourceTreeOptions {
	extraBlocks?: readonly ProjectBlock[];
}

const constantsBlockType = documentBlockInstructionByType.constants.type;
const functionBlockType = documentBlockInstructionByType.function.type;
const includesBlockType = documentBlockInstructionByType.includes.type;
const moduleBlockType = documentBlockInstructionByType.module.type;
const prototypeBlockType = documentBlockInstructionByType.prototype.type;

type IncludeSourceTreeChildren = Pick<ProjectSourceTree, 'children'>;

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

function lowerIncludeSourceTreeChildrenToFunctions(tree: IncludeSourceTreeChildren): Module[] {
	return tree.children.flatMap(child => resolveFunctionIncludeSource(child.includeId, child.source));
}

async function prepareCompilerInputFromProjectBlocksCoreAsync(
	blocks: readonly ProjectBlock[],
	resolveIncludesBlockForCompilerInput?: (block: ProjectBlock) => Module[] | Promise<Module[]>
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
			if (resolveIncludesBlockForCompilerInput) {
				functions.push(...(await resolveIncludesBlockForCompilerInput(block)));
			}
		}
	}

	return { entries, functions, constants, prototypes };
}

export async function prepareCompilerInputFromProjectBlocksAsync(
	blocks: readonly ProjectBlock[]
): Promise<CompileInput> {
	return prepareCompilerInputFromProjectBlocksCoreAsync(blocks);
}

export async function prepareCompilerInputFromProjectBlocksWithIncludeSourceTreeAsync(
	blocks: readonly ProjectBlock[],
	tree: IncludeSourceTreeChildren,
	options: PrepareCompilerInputFromProjectSourceTreeOptions = {}
): Promise<CompileInput> {
	const includeFunctions = lowerIncludeSourceTreeChildrenToFunctions(tree);
	const compilerBlocks = [...blocks, ...(options.extraBlocks ?? [])];
	let hasConsumedIncludeTree = false;

	return prepareCompilerInputFromProjectBlocksCoreAsync(compilerBlocks, () => {
		if (hasConsumedIncludeTree) {
			return [];
		}
		hasConsumedIncludeTree = true;
		return includeFunctions;
	});
}

export async function prepareCompilerInputFromProjectSourceTreeAsync(
	tree: ProjectSourceTree,
	options: PrepareCompilerInputFromProjectSourceTreeOptions = {}
): Promise<CompileInput> {
	return prepareCompilerInputFromProjectBlocksWithIncludeSourceTreeAsync(
		parseProjectSource(tree.source).codeBlocks,
		tree,
		options
	);
}
