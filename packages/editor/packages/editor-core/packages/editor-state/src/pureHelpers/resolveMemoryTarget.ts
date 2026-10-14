import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import {
	createProjectModuleId,
	getProjectGroupPathFromModuleId,
	type PlannedMemoryDeclaration,
	type ResolvedProjectMemoryExposure,
} from '@8f4e/language-spec';
import getCodeBlockModuleId from './getCodeBlockModuleId';

/** A canonical module identity, or a block whose group scope must be preserved. */
export type MemoryResolutionScope =
	| string
	| Pick<CodeBlockGraphicData, 'name' | 'projectPath' | 'nestedProjectCodeBlocks'>;

export interface ResolvedMemoryTarget {
	publicModuleId: string;
	publicName: string;
	moduleId: string;
	memory: PlannedMemoryDeclaration;
	exposure?: ResolvedProjectMemoryExposure;
}

// Compilation replaces exposure arrays; weak keys release indexes from previous compilations and projects.
const exposureIndexes = new WeakMap<ResolvedProjectMemoryExposure[], Map<string, ResolvedProjectMemoryExposure>>();

/** Resolves a plain memory reference once for widgets, connectors, and environment bindings. */
export default function resolveMemoryTarget(
	state: Pick<State, 'compiler'>,
	scope: MemoryResolutionScope,
	reference: string | undefined
): ResolvedMemoryTarget | undefined {
	if (!reference) return;

	const namespaceId = typeof scope === 'string' ? scope : getCodeBlockModuleId(scope);
	const projectPath =
		typeof scope === 'string'
			? getProjectGroupPathFromModuleId(scope)
			: scope.nestedProjectCodeBlocks === undefined
				? scope.projectPath
				: namespaceId;
	const separator = reference.indexOf(':');
	const publicName = separator === -1 ? reference : reference.slice(separator + 1);
	const referencedNamespace = separator === -1 ? undefined : reference.slice(0, separator);
	const publicModuleId =
		referencedNamespace === undefined
			? namespaceId
			: referencedNamespace.includes('/')
				? referencedNamespace
				: createProjectModuleId(projectPath, referencedNamespace);

	const memory = state.compiler.memoryPlan.modules[publicModuleId]?.memory[publicName];
	const isGroup = typeof scope !== 'string' && scope.nestedProjectCodeBlocks !== undefined;
	const directTarget = memory ? { publicModuleId, publicName, moduleId: publicModuleId, memory } : undefined;
	if (separator === -1 && !isGroup && directTarget) return directTarget;

	const exposures = state.compiler.projectMemoryExposuresByGroupPath[publicModuleId];
	if (!exposures) return directTarget;
	let byName = exposureIndexes.get(exposures);
	if (!byName) {
		byName = new Map(exposures.map(exposure => [exposure.name, exposure]));
		exposureIndexes.set(exposures, byName);
	}
	const exposure = byName.get(publicName);
	if (!exposure) return directTarget;

	return { publicModuleId, publicName, moduleId: exposure.targetModuleId, memory: exposure.targetMemory, exposure };
}
