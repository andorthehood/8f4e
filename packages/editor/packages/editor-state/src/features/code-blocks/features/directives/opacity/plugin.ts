import { createDirectivePlugin } from '../utils';

function parseOpacity(value: string | undefined): number | undefined {
	if (value === undefined) {
		return undefined;
	}

	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
		return undefined;
	}

	return parsed;
}

export default createDirectivePlugin('opacity', (directive, draft) => {
	const draftWithMarker = draft as typeof draft & { _opacitySeen?: boolean };

	// Only process the first valid @opacity directive.
	if (draftWithMarker._opacitySeen) {
		return;
	}

	const opacity = parseOpacity(directive.args[0]);
	if (opacity === undefined) {
		return;
	}

	draftWithMarker._opacitySeen = true;
	draft.blockState.opacity = opacity;
});
