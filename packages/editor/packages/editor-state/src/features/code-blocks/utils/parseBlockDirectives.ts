import { parseDirectiveLineRecords } from '../features/directives/utils';

import type { ParsedDirectiveRecord } from '@8f4e/editor-state-types';

/**
 * Scans every line of a code block's raw source and returns a flat array of
 * parsed directive records for both editor (`; @name`) and runtime (`; ~name`)
 * directive comments.
 *
 * One record is emitted per matching directive in raw row order.
 */
export function parseBlockDirectives(code: string[]): ParsedDirectiveRecord[] {
	const records: ParsedDirectiveRecord[] = [];

	for (let rawRow = 0; rawRow < code.length; rawRow++) {
		records.push(
			...parseDirectiveLineRecords(code[rawRow]).map(parsed => ({
				prefix: parsed.prefix,
				name: parsed.name,
				args: parsed.args,
				rawRow,
				sourceLine: code[rawRow],
				isTrailing: parsed.isTrailing,
			}))
		);
	}

	return records;
}
