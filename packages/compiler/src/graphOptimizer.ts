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
	headModuleId: string;
	moduleIds: string[];
	modules: ModuleSortMetadata[];
	dependencyIds: string[];
}

interface FollowGraph {
	followerByTarget: Map<string, ModuleSortMetadata>;
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

function compareModulesAlphabetically(a: ModuleSortMetadata, b: ModuleSortMetadata): number {
	if (a.moduleId < b.moduleId) return -1;
	if (a.moduleId > b.moduleId) return 1;
	return a.index - b.index;
}

function getModuleLine(module: ModuleSortMetadata): AST[number] {
	return module.ast.find(line => line.instruction === 'module') ?? module.ast[0];
}

function buildFollowGraph(regularMetadata: ModuleSortMetadata[]): FollowGraph {
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

	return {
		followerByTarget,
	};
}

function getFollowChainHeads(regularMetadata: ModuleSortMetadata[]): ModuleSortMetadata[] {
	return regularMetadata.filter(module => !module.followTargetModuleId).sort(compareModulesAlphabetically);
}

function createSegmentFromHead(
	head: ModuleSortMetadata,
	followerByTarget: Map<string, ModuleSortMetadata>,
	assigned: Set<string>
): ModuleSegment {
	const modules: ModuleSortMetadata[] = [];
	let current: ModuleSortMetadata | undefined = head;

	while (current && !assigned.has(current.moduleId)) {
		modules.push(current);
		assigned.add(current.moduleId);
		current = followerByTarget.get(current.moduleId);
	}

	return {
		headModuleId: head.moduleId,
		moduleIds: modules.map(module => module.moduleId),
		modules,
		dependencyIds: [],
	};
}

function getCycleErrorModule(regularMetadata: ModuleSortMetadata[], assigned: Set<string>): ModuleSortMetadata {
	return regularMetadata.find(module => !assigned.has(module.moduleId)) ?? regularMetadata[0];
}

function createModuleSegments(regularMetadata: ModuleSortMetadata[]): ModuleSegment[] {
	const { followerByTarget } = buildFollowGraph(regularMetadata);
	const heads = getFollowChainHeads(regularMetadata);
	const segments: ModuleSegment[] = [];
	const assigned = new Set<string>();

	for (const head of heads) {
		if (assigned.has(head.moduleId)) {
			continue;
		}

		segments.push(createSegmentFromHead(head, followerByTarget, assigned));
	}

	if (assigned.size !== regularMetadata.length) {
		const cycleModule = getCycleErrorModule(regularMetadata, assigned);
		throw getError(ErrorCode.MODULE_FOLLOW_CYCLE, cycleModule.followLine ?? getModuleLine(cycleModule));
	}

	return segments;
}

function getConflictingDependencyId(
	module: ModuleSortMetadata,
	positionByModuleId: Map<string, number>
): string | undefined {
	const modulePosition = positionByModuleId.get(module.moduleId) ?? 0;

	return module.referencedModuleIds.find(depId => {
		const dependencyPosition = positionByModuleId.get(depId);
		return dependencyPosition !== undefined && dependencyPosition > modulePosition;
	});
}

function validateSegmentDependencyOrder(segment: ModuleSegment): void {
	const positionByModuleId = new Map(segment.moduleIds.map((moduleId, index) => [moduleId, index]));

	for (const module of segment.modules) {
		const conflictingDependency = getConflictingDependencyId(module, positionByModuleId);
		if (!conflictingDependency) {
			continue;
		}

		throw getError(ErrorCode.MODULE_FOLLOW_DEPENDENCY_CONFLICT, module.followLine ?? getModuleLine(module), undefined, {
			identifier: conflictingDependency,
		});
	}
}

function createSegmentLookup(segments: ModuleSegment[]): Map<string, ModuleSegment> {
	const segmentByModuleId = new Map<string, ModuleSegment>();

	for (const segment of segments) {
		for (const moduleId of segment.moduleIds) {
			segmentByModuleId.set(moduleId, segment);
		}
	}

	return segmentByModuleId;
}

function collectDependencyIdsForSegment(
	segment: ModuleSegment,
	segmentByModuleId: Map<string, ModuleSegment>
): string[] {
	const dependencyIds = new Set<string>();

	for (const module of segment.modules) {
		for (const depId of module.referencedModuleIds) {
			const dependencySegment = segmentByModuleId.get(depId);
			if (dependencySegment && dependencySegment !== segment) {
				dependencyIds.add(dependencySegment.headModuleId);
			}
		}
	}

	return [...dependencyIds];
}

function attachSegmentDependencies(segments: ModuleSegment[]): ModuleSegment[] {
	const segmentByModuleId = createSegmentLookup(segments);

	return segments.map(segment => {
		validateSegmentDependencyOrder(segment);
		return {
			...segment,
			dependencyIds: collectDependencyIdsForSegment(segment, segmentByModuleId),
		};
	});
}

function createSegmentsByHeadId(segments: ModuleSegment[]): Map<string, ModuleSegment> {
	return new Map(segments.map(segment => [segment.headModuleId, segment]));
}

function topologicallySortSegments(segments: ModuleSegment[]): ModuleSegment[] {
	const segmentsByHeadId = createSegmentsByHeadId(segments);
	const visited = new Set<ModuleSegment>();
	const sorted: ModuleSegment[] = [];

	function visit(segment: ModuleSegment): void {
		if (visited.has(segment)) return;
		visited.add(segment);
		for (const dependencyId of segment.dependencyIds) {
			const dependencySegment = segmentsByHeadId.get(dependencyId);
			if (!dependencySegment) {
				continue;
			}
			visit(dependencySegment);
		}
		sorted.push(segment);
	}

	for (const segment of [...segments].sort((a, b) => compareModulesAlphabetically(a.modules[0], b.modules[0]))) {
		visit(segment);
	}

	return sorted;
}

function splitModuleMetadata(metadata: ModuleSortMetadata[]): {
	constantsBlocks: AST[];
	regularMetadata: ModuleSortMetadata[];
} {
	return {
		constantsBlocks: metadata.filter(module => module.isConstantsBlock).map(module => module.ast),
		regularMetadata: metadata.filter(module => !module.isConstantsBlock),
	};
}

export default function sortModules(modules: AST[]): AST[] {
	const metadata = modules.map((ast, index) => getModuleSortMetadata(ast, index));
	const { constantsBlocks, regularMetadata } = splitModuleMetadata(metadata);
	const segments = attachSegmentDependencies(createModuleSegments(regularMetadata));
	const sortedSegments = topologicallySortSegments(segments);

	return [...constantsBlocks, ...sortedSegments.flatMap(segment => segment.modules.map(module => module.ast))];
}
