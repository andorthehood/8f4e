import type { InfoRecord, State } from '@8f4e/editor-state-types';

export function getInfoRecord(state: Pick<State, 'info'> | undefined, id: string): InfoRecord | undefined {
	const record = state?.info[id];

	if (!record || typeof record !== 'object' || Array.isArray(record)) {
		return undefined;
	}

	return record;
}

export function getInfoEntryCount(state: Pick<State, 'info'> | undefined, id: string): number {
	return Object.keys(getInfoRecord(state, id) ?? {}).length;
}
