import type { ParsedDirectiveRecord } from '~/types';

const DIRECTIVE_PATTERN = /^\s*;\s*([@~])(\w+)(?:\s+(.*))?$/;

/**
 * Scans every line of a code block's raw source and returns a flat array of
 * parsed directive records for both editor (`; @name`) and runtime (`; ~name`)
 * directive comments.
 *
 * One record is emitted per matching line in raw row order.
 */
export function parseBlockDirectives(code: string[]): ParsedDirectiveRecord[] {
	const records: ParsedDirectiveRecord[] = [];

	for (let rawRow = 0; rawRow < code.length; rawRow++) {
		const match = code[rawRow].match(DIRECTIVE_PATTERN);
		if (!match) {
			continue;
		}

		const [, prefix, name, rawArgs] = match;
		records.push({
			prefix: prefix as '@' | '~',
			name,
			args: rawArgs ? rawArgs.trim().split(/\s+/) : [],
			rawRow,
		});
	}

	return records;
}
