import type { ParsedDirectiveRecord } from '../types';

export type ParsedDirectiveLineRecord = { prefix: '@'; name: string; args: string[]; isTrailing: boolean };

function parseDirectiveCommentSegment(segment: string, isTrailing: boolean): ParsedDirectiveLineRecord[] {
	const trimmed = segment.trim();
	if (!trimmed) {
		return [];
	}

	const tokens = trimmed.split(/\s+/);
	const directives: ParsedDirectiveLineRecord[] = [];
	let current: ParsedDirectiveLineRecord | undefined;

	for (const token of tokens) {
		const directiveMatch = token.match(/^@(\w+)$/);
		if (directiveMatch) {
			const [, name] = directiveMatch;

			if (current) {
				directives.push(current);
			}

			current = {
				prefix: '@',
				name,
				args: [],
				isTrailing,
			};
			continue;
		}

		if (!current) {
			return [];
		}

		current.args.push(token);
	}

	if (current) {
		directives.push(current);
	}

	return directives;
}

function parseDirectiveContinuationArgs(line: string): string[] | undefined {
	const continuationMatch = line.match(/^\s*;\s*-(?:\s+(.*))?$/);
	if (!continuationMatch) {
		return undefined;
	}

	const argsSegment = continuationMatch[1]?.trim();
	return argsSegment ? argsSegment.split(/\s+/) : [];
}

export function parseDirectiveLineRecords(line: string): ParsedDirectiveLineRecord[] {
	if (/^\s*;/.test(line)) {
		return parseDirectiveCommentSegment(line.replace(/^\s*;\s*/, ''), false);
	}

	const commentStart = line.indexOf(';');
	if (commentStart === -1) {
		return [];
	}

	return parseDirectiveCommentSegment(line.slice(commentStart + 1), true);
}

export function parseDirectiveRecords(code: string[]): ParsedDirectiveRecord[] {
	const records: ParsedDirectiveRecord[] = [];
	let previousRecord: ParsedDirectiveRecord | undefined;

	for (let rawRow = 0; rawRow < code.length; rawRow++) {
		const line = code[rawRow];
		const continuationArgs = parseDirectiveContinuationArgs(line);
		if (continuationArgs) {
			if (previousRecord && continuationArgs.length > 0) {
				previousRecord.args.push(...continuationArgs);
			}
			continue;
		}

		const lineRecords = parseDirectiveLineRecords(line).map(parsed => ({
			prefix: parsed.prefix,
			name: parsed.name,
			args: parsed.args,
			rawRow,
			sourceLine: line,
			isTrailing: parsed.isTrailing,
		}));

		if (lineRecords.length === 0) {
			previousRecord = undefined;
			continue;
		}

		records.push(...lineRecords);
		previousRecord = lineRecords[lineRecords.length - 1];
	}

	return records;
}
