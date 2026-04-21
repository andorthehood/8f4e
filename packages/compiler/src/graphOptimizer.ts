import { isMemoryDeclarationInstruction } from './semantic/declarations';
import { ErrorCode, getError } from './compilerError';
import { ArgumentType } from './types';

import type { AST, Argument } from './types';

function getIntermodularReferenceModules(argument: Argument | undefined): string[] {
	if (!argument) {
		return [];
	}

	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		return [...argument.intermoduleIds];
	}

	if (argument.type !== ArgumentType.IDENTIFIER) {
		return [];
	}

	if (argument.scope === 'intermodule' && argument.targetModuleId) {
		return [argument.targetModuleId];
	}

	return [];
}

export function getIdentifierValue(argument: Argument | undefined): string {
	return argument?.type === ArgumentType.IDENTIFIER ? argument.value : '';
}

interface ModuleSortMetadata {
	ast: AST;
	moduleId: string;
	isConstantsBlock: boolean;
	referencedModuleIds: string[];
	index: number;
	followLine?: AST[number];
	followTargetModuleId?: string;
}

interface ModuleSegment {
	moduleIds: string[];
	modules: ModuleSortMetadata[];
}

function extractIntermodularDependencies(ast: AST): string[] {
	return ast
		.filter(({ instruction }) => isMemoryDeclarationInstruction(instruction))
		.flatMap(({ arguments: args }) => args.flatMap(arg => getIntermodularReferenceModules(arg)));
}

function getFollowDirective(ast: AST): { line: AST[number]; targetModuleId: string } | undefined {
	const followLines = ast.filter(line => line.instruction === '#follow');

	if (followLines.length === 0) {
		return undefined;
	}

	if (followLines.length > 1) {
		throw getError(ErrorCode.MODULE_FOLLOW_MULTIPLE_TARGETS, followLines[1], undefined, {
			identifier: getIdentifierValue(ast.find(line => line.instruction === 'module')?.arguments[0]),
		});
	}

	return {
		line: followLines[0],
		targetModuleId: getIdentifierValue(followLines[0].arguments[0]),
	};
}

function getModuleSortMetadata(ast: AST, index: number): ModuleSortMetadata {
	const isConstantsBlock = ast.some(line => line.instruction === 'constants');
	const moduleId = getIdentifierValue(ast.find(line => line.instruction === 'module')?.arguments[0]);
	const referencedModuleIds = isConstantsBlock ? [] : extractIntermodularDependencies(ast);
	const followDirective = isConstantsBlock ? undefined : getFollowDirective(ast);
	return {
		ast,
		moduleId,
		isConstantsBlock,
		referencedModuleIds,
		index,
		followLine: followDirective?.line,
		followTargetModuleId: followDirective?.targetModuleId,
	};
}

function createModuleSegments(regularMetadata: ModuleSortMetadata[]): ModuleSegment[] {
	const modulesByIdMap = new Map<string, ModuleSortMetadata>();
	const followerByTarget = new Map<string, ModuleSortMetadata>();

	for (const module of regularMetadata) {
		modulesByIdMap.set(module.moduleId, module);
	}

	for (const module of regularMetadata) {
		if (!module.followTargetModuleId || !module.followLine) {
			continue;
		}

		if (module.followTargetModuleId === module.moduleId) {
			throw getError(ErrorCode.MODULE_FOLLOW_SELF, module.followLine, undefined, {
				identifier: module.moduleId,
			});
		}

		if (!modulesByIdMap.has(module.followTargetModuleId)) {
			throw getError(ErrorCode.MODULE_FOLLOW_TARGET_NOT_FOUND, module.followLine, undefined, {
				identifier: module.followTargetModuleId,
			});
		}

		const existingFollower = followerByTarget.get(module.followTargetModuleId);
		if (existingFollower) {
			throw getError(ErrorCode.MODULE_FOLLOW_DUPLICATE_FOLLOWER, module.followLine, undefined, {
				identifier: module.followTargetModuleId,
			});
		}

		followerByTarget.set(module.followTargetModuleId, module);
	}

	const heads = regularMetadata
		.filter(module => !module.followTargetModuleId)
		.sort((a, b) => {
			if (a.moduleId < b.moduleId) return -1;
			if (a.moduleId > b.moduleId) return 1;
			return a.index - b.index;
		});
	const segments: ModuleSegment[] = [];
	const assigned = new Set<string>();

	for (const head of heads) {
		if (assigned.has(head.moduleId)) {
			continue;
		}

		const modules: ModuleSortMetadata[] = [];
		let current: ModuleSortMetadata | undefined = head;

		while (current && !assigned.has(current.moduleId)) {
			modules.push(current);
			assigned.add(current.moduleId);
			current = followerByTarget.get(current.moduleId);
		}

		segments.push({
			moduleIds: modules.map(module => module.moduleId),
			modules,
		});
	}

	if (assigned.size !== regularMetadata.length) {
		const cycleModule = regularMetadata.find(module => !assigned.has(module.moduleId));
		throw getError(
			ErrorCode.MODULE_FOLLOW_CYCLE,
			cycleModule?.followLine ?? cycleModule?.ast[0] ?? regularMetadata[0].ast[0]
		);
	}

	return segments;
}

function validateSegmentDependencyOrder(segments: ModuleSegment[]): void {
	for (const segment of segments) {
		const positionByModuleId = new Map(segment.moduleIds.map((moduleId, index) => [moduleId, index]));

		for (const module of segment.modules) {
			const modulePosition = positionByModuleId.get(module.moduleId) ?? 0;
			const conflictingDependency = module.referencedModuleIds.find(depId => {
				const dependencyPosition = positionByModuleId.get(depId);
				return dependencyPosition !== undefined && dependencyPosition > modulePosition;
			});

			if (conflictingDependency) {
				throw getError(
					ErrorCode.MODULE_FOLLOW_DEPENDENCY_CONFLICT,
					module.followLine ?? module.ast.find(line => line.instruction === 'module') ?? module.ast[0],
					undefined,
					{ identifier: conflictingDependency }
				);
			}
		}
	}
}

export default function sortModules(modules: AST[]): AST[] {
	const metadata = modules.map((ast, index) => getModuleSortMetadata(ast, index));

	const constantsBlocks = metadata.filter(m => m.isConstantsBlock).map(m => m.ast);
	const regularMetadata = metadata.filter(m => !m.isConstantsBlock);
	const segments = createModuleSegments(regularMetadata);
	validateSegmentDependencyOrder(segments);

	const segmentByModuleId = new Map<string, ModuleSegment>();
	for (const segment of segments) {
		for (const moduleId of segment.moduleIds) {
			segmentByModuleId.set(moduleId, segment);
		}
	}

	const segmentDependencies = new Map<ModuleSegment, Set<ModuleSegment>>();
	for (const segment of segments) {
		const deps = new Set<ModuleSegment>();
		for (const module of segment.modules) {
			for (const depId of module.referencedModuleIds) {
				const dependencySegment = segmentByModuleId.get(depId);
				if (dependencySegment && dependencySegment !== segment) {
					deps.add(dependencySegment);
				}
			}
		}
		segmentDependencies.set(segment, deps);
	}

	const visited = new Set<ModuleSegment>();
	const sorted: ModuleSegment[] = [];

	function visit(segment: ModuleSegment): void {
		if (visited.has(segment)) return;
		visited.add(segment);
		for (const dependencySegment of segmentDependencies.get(segment) ?? []) {
			visit(dependencySegment);
		}
		sorted.push(segment);
	}

	const alphabeticalSegments = [...segments].sort((a, b) => {
		if (a.moduleIds[0] < b.moduleIds[0]) return -1;
		if (a.moduleIds[0] > b.moduleIds[0]) return 1;
		return a.modules[0].index - b.modules[0].index;
	});

	for (const segment of alphabeticalSegments) {
		visit(segment);
	}

	return [...constantsBlocks, ...sorted.flatMap(segment => segment.modules.map(module => module.ast))];
}
