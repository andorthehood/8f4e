/**
 * Checks if a line contains the #skipExecution compiler directive.
 * @param line - The line to check.
 * @returns True if the line is a #skipExecution directive, false otherwise.
 */
export default function isSkipExecutionDirective(line: string): boolean {
	return /^\s*#skipExecution(?:\s+;.*|\s*)$/.test(line);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isSkipExecutionDirective', () => {
		it('matches #skipExecution directive', () => {
			expect(isSkipExecutionDirective('#skipExecution')).toBe(true);
			expect(isSkipExecutionDirective('  #skipExecution')).toBe(true);
			expect(isSkipExecutionDirective('\t#skipExecution')).toBe(true);
		});

		it('matches #skipExecution with trailing semicolon comment', () => {
			expect(isSkipExecutionDirective('#skipExecution ; comment')).toBe(true);
			expect(isSkipExecutionDirective('  #skipExecution ; skip this module')).toBe(true);
		});

		it('matches #skipExecution with trailing whitespace', () => {
			expect(isSkipExecutionDirective('#skipExecution  ')).toBe(true);
			expect(isSkipExecutionDirective('#skipExecution\t')).toBe(true);
		});

		it('returns false for other directives', () => {
			expect(isSkipExecutionDirective('#someOtherDirective')).toBe(false);
			expect(isSkipExecutionDirective('#skip')).toBe(false);
		});

		it('returns false for non-directive lines', () => {
			expect(isSkipExecutionDirective('add 1 2')).toBe(false);
			expect(isSkipExecutionDirective('; comment')).toBe(false);
			expect(isSkipExecutionDirective('module test')).toBe(false);
		});

		it('returns false when #skipExecution has arguments', () => {
			expect(isSkipExecutionDirective('#skipExecution arg')).toBe(false);
			expect(isSkipExecutionDirective('#skipExecution 123')).toBe(false);
		});
	});
}
