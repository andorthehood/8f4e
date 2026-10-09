import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { AssertionSite } from '@8f4e/language-spec';
import gapCalculator from '../../../code-editing/gapCalculator';

export default function deriveAssertionMarkers(
	codeBlock: CodeBlockGraphicData,
	state: State
): CodeBlockGraphicData['widgets']['assertions'] {
	const result = state.runtime.values.TestRuntime;
	if (
		state.compiler.isCompiling ||
		codeBlock.disabled ||
		!result ||
		(result.status !== 'passed' && result.status !== 'failed')
	)
		return [];

	const sites = new Map<number, { site: AssertionSite; passed: boolean }>();
	for (const assertion of result.assertions) {
		const { site } = assertion;
		if (
			site.projectBlockId !== codeBlock.creationIndex ||
			site.projectGroupPath !== codeBlock.projectPath ||
			site.codeBlockType !== codeBlock.blockType ||
			site.source
		)
			continue;
		const previous = sites.get(site.siteId);
		if (previous) previous.passed &&= assertion.passed;
		else sites.set(site.siteId, { site, passed: assertion.passed });
	}

	return [...sites.values()].flatMap(({ site, passed }) => {
		const displayRow = codeBlock.displayModel.rawRowToDisplayRow[site.lineNumber];
		if (displayRow === undefined || codeBlock.displayModel.lines[displayRow].isPlaceholder) return [];
		return [
			{
				lineNumber: site.lineNumber,
				passed,
				x: state.viewport.vGrid,
				y: gapCalculator(displayRow, codeBlock.gaps) * state.viewport.hGrid,
				width: codeBlock.lineNumberColumnWidth * state.viewport.vGrid,
				height: state.viewport.hGrid,
			},
		];
	});
}
