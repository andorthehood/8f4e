import type { Module } from '@8f4e/compiler-spec';
import { documentBlockInstructionByType } from '@8f4e/compiler-spec';
import { getProjectBlockType } from './blockClassification';
import type {
	ProjectCodeBlock,
	ProjectCodeGroup,
	ProjectCompilerBlocks,
	ProjectCompilerGroup,
	ProjectInput,
} from './types';

const functionBlockType = documentBlockInstructionByType.function.type;
const moduleBlockType = documentBlockInstructionByType.module.type;
const prototypeBlockType = documentBlockInstructionByType.prototype.type;

type ProjectCompilerBlockTarget = {
	constantsBlocks: Module[];
	functionBlocks: Module[];
	prototypeBlocks: Module[];
};

function assertProjectBlockId(block: ProjectCodeBlock): void {
	if (!Number.isInteger(block.id)) {
		throw new Error('Project code block is missing numeric id');
	}
}

function toCompilerModule(block: ProjectCodeBlock): Module {
	return {
		code: block.code,
		projectBlockId: block.id,
	};
}

function addCompilerBlockToTarget(
	block: ProjectCodeBlock,
	target: ProjectCompilerBlockTarget,
	moduleBlocks?: Module[]
): void {
	assertProjectBlockId(block);

	if (block.disabled) {
		return;
	}

	const blockType = getProjectBlockType(block.code);
	if (blockType === moduleBlockType) {
		if (!block.entry) {
			throw new Error('Project module block is missing entry');
		}
		moduleBlocks?.push(toCompilerModule(block));
		return;
	}
	if (blockType === documentBlockInstructionByType.constants.type) {
		target.constantsBlocks.push(toCompilerModule(block));
		return;
	}
	if (blockType === functionBlockType) {
		target.functionBlocks.push(toCompilerModule(block));
		return;
	}
	if (blockType === prototypeBlockType) {
		target.prototypeBlocks.push(toCompilerModule(block));
	}
}

function pickProjectCompilerGroup(group: ProjectCodeGroup): ProjectCompilerGroup {
	const result: ProjectCompilerGroup = {
		name: group.name,
		entry: group.entry,
		modules: [],
		constantsBlocks: [],
		functionBlocks: [],
		prototypeBlocks: [],
		groups: group.groups.map(pickProjectCompilerGroup),
	};

	for (const block of group.codeBlocks) {
		addCompilerBlockToTarget(block, result, result.modules);
	}

	return result;
}

/**
 * Runs pick project compiler blocks.
 *
 * @param project - Parsed project input to split into compiler block collections.
 * @returns Compiler blocks grouped by execution entry and project groups.
 */
export function pickProjectCompilerBlocks(project: ProjectInput): ProjectCompilerBlocks {
	const entries: Record<string, Module[]> = { main: [] };
	const constantsBlocks: Module[] = [];
	const functionBlocks: Module[] = [...(project.includedFunctionBlocks ?? [])];
	const prototypeBlocks: Module[] = [];
	const target = { constantsBlocks, functionBlocks, prototypeBlocks };

	for (const block of project.codeBlocks) {
		assertProjectBlockId(block);

		if (block.disabled) {
			continue;
		}

		const blockType = getProjectBlockType(block.code);
		if (blockType === moduleBlockType) {
			if (!block.entry) {
				throw new Error('Project module block is missing entry');
			}
			const entryName = block.entry;
			entries[entryName] ??= [];
			entries[entryName].push(toCompilerModule(block));
			continue;
		}
		addCompilerBlockToTarget(block, target);
	}

	return {
		entries,
		constantsBlocks,
		functionBlocks,
		prototypeBlocks,
		groups: project.groups.map(pickProjectCompilerGroup),
	};
}
