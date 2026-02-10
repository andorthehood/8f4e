import parseLine from './parseLine';

import type { Command, CompileError } from '../types';

/**
 * Parses a source string into an array of commands
 */
export default function parse(
	source: string,
	lineMetadata?: Array<{ callSiteLineNumber: number; macroId?: string }>
): { commands: Command[]; errors: CompileError[] } {
	const lines = source.split('\n');
	const commands: Command[] = [];
	const errors: CompileError[] = [];

	for (let i = 0; i < lines.length; i++) {
		// Use callSiteLineNumber from metadata if available, otherwise use actual line number (1-based)
		const actualLineNumber = lineMetadata?.[i]?.callSiteLineNumber ?? i;
		const macroId = lineMetadata?.[i]?.macroId;

		const result = parseLine(lines[i], actualLineNumber + 1, macroId);

		if (result === null) continue;

		if ('message' in result) {
			errors.push(result);
		} else {
			commands.push(result);
		}
	}

	return { commands, errors };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parse', () => {
		it('should parse empty source', () => {
			expect(parse('')).toEqual({ commands: [], errors: [] });
		});

		it('should parse single command', () => {
			const result = parse('push 42');
			expect(result.commands).toHaveLength(1);
			expect(result.commands[0].type).toBe('push');
			expect(result.errors).toHaveLength(0);
		});

		it('should parse multiple commands', () => {
			const result = parse('scope "name"\npush "test"\nset');
			expect(result.commands).toHaveLength(3);
			expect(result.errors).toHaveLength(0);
		});

		it('should skip comments and empty lines', () => {
			const result = parse('; comment\n\npush 1');
			expect(result.commands).toHaveLength(1);
		});

		it('should collect errors', () => {
			const result = parse('unknown\npush 1\ninvalid');
			expect(result.commands).toHaveLength(1);
			expect(result.errors).toHaveLength(2);
		});

		it('should track correct line numbers', () => {
			const result = parse('\n\npush 1');
			expect(result.commands[0].lineNumber).toBe(3);
		});
	});
}
