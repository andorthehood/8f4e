import type { CodeBlockGraphicData, ParsedDirectiveRecord } from '~/types';

export const PRESENTATION_DIRECTIVE_NAME = 'stop';

export interface PresentationStop {
	codeBlock: CodeBlockGraphicData;
	order: number;
	seconds: number;
}

function parseStrictInteger(value: string | undefined): number | undefined {
	if (!value || !/^-?\d+$/.test(value)) {
		return undefined;
	}

	return Number(value);
}

function parsePositiveSeconds(value: string | undefined): number | undefined {
	if (!value || !/^\d+(?:\.\d+)?$/.test(value)) {
		return undefined;
	}

	const seconds = Number(value);
	return seconds > 0 ? seconds : undefined;
}

export function parsePresentationDirective(
	parsedDirectives: ParsedDirectiveRecord[]
): { order: number; seconds: number } | undefined {
	const directive = parsedDirectives.find(
		record => record.prefix === '@' && record.name === PRESENTATION_DIRECTIVE_NAME && !record.isTrailing
	);
	if (!directive || directive.args.length !== 2) {
		return undefined;
	}

	const order = parseStrictInteger(directive.args[0]);
	const seconds = parsePositiveSeconds(directive.args[1]);
	if (order === undefined || order < 0 || seconds === undefined) {
		return undefined;
	}

	return { order, seconds };
}

export function getPresentationStops(codeBlocks: CodeBlockGraphicData[]): PresentationStop[] {
	return codeBlocks
		.flatMap(codeBlock => {
			const directive = parsePresentationDirective(codeBlock.parsedDirectives);
			return directive ? [{ codeBlock, ...directive }] : [];
		})
		.sort((a, b) => a.order - b.order || a.codeBlock.creationIndex - b.codeBlock.creationIndex);
}
