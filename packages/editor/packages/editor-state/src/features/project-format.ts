import { documentBlockInstructionPairs } from '@8f4e/compiler-spec';

export const FORMAT_HEADER = '8f4e/v1';

export const BLOCK_DELIMITERS = documentBlockInstructionPairs.map(({ type, start, end }) => ({
	type,
	opener: start,
	closer: end,
}));

function matchesKeyword(line: string, keyword: string): boolean {
	return line === keyword || line.startsWith(keyword + ' ');
}

export function getOpenerKeyword(line: string): string | null {
	for (const { opener } of BLOCK_DELIMITERS) {
		if (matchesKeyword(line, opener)) {
			return opener;
		}
	}

	return null;
}

export function getCloserKeyword(line: string): string | null {
	for (const { closer } of BLOCK_DELIMITERS) {
		if (matchesKeyword(line, closer)) {
			return closer;
		}
	}

	return null;
}

export function getExpectedCloserPrefix(opener: string): string {
	return BLOCK_DELIMITERS.find(delimiter => delimiter.opener === opener)?.closer ?? opener + 'End';
}
