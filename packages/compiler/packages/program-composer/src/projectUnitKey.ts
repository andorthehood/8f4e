import type { ProjectObjectModel } from '@8f4e/language-spec';
import type { ProjectUnitKey } from './types';

export const ROOT_PROJECT_UNIT_KEY: ProjectUnitKey = 'root';

/** Returns the deterministic traversal key for a nested project. */
export function getChildProjectUnitKey(
	parentKey: ProjectUnitKey,
	group: ProjectObjectModel,
	groupIndex: number
): ProjectUnitKey {
	const identity = group.id === undefined ? String(groupIndex) : `id:${encodeURIComponent(group.id)}`;
	return `${parentKey}/groups/${identity}`;
}

/** Creates the compiler-owned symbol prefix for a nested project unit. */
export function createUnitSymbolPrefix(unitKey: ProjectUnitKey): string {
	const path = unitKey
		.slice(ROOT_PROJECT_UNIT_KEY.length)
		.replaceAll('/groups/', '$')
		.replace(/[^a-zA-Z0-9_$]+/g, '$');
	return `__8f4e$group$${path}__`;
}
