import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import { createChildProjectGroupPath, type ResolvedProjectMemoryExposure } from '@8f4e/language-spec';
import { tryParseProjectMemoryExposureLine } from '@8f4e/project-preparser';
import gapCalculator from '~/features/code-editing/gapCalculator';

export interface ProjectMemoryExposureConnector {
	exposure: ResolvedProjectMemoryExposure;
	row: number;
}

/** Matches the group block's source rows to compiler-resolved exposure targets. */
export function getProjectMemoryExposureConnectors(
	graphicData: CodeBlockGraphicData,
	state: State
): ProjectMemoryExposureConnector[] {
	if (graphicData.nestedProjectCodeBlocks === undefined) {
		return [];
	}

	const groupPath = createChildProjectGroupPath(graphicData.projectPath, graphicData.name);
	const resolvedByName = new Map(
		(state.compiler.projectMemoryExposuresByGroupPath[groupPath] ?? []).map(exposure => [exposure.name, exposure])
	);

	return graphicData.code.flatMap((line, rawRow) => {
		const parsed = tryParseProjectMemoryExposureLine(line);
		const exposure = parsed ? resolvedByName.get(parsed.name) : undefined;
		return exposure ? [{ exposure, row: gapCalculator(rawRow, graphicData.gaps) }] : [];
	});
}

export function isProjectMemoryExposureInput(exposure: ResolvedProjectMemoryExposure): boolean {
	return exposure.type.includes('*');
}
