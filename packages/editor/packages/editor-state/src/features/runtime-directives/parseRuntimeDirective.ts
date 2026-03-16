/**
 * Parses a single code line for a runtime directive comment.
 * Runtime directives use `; ~<name> [args...]` syntax, distinct from editor directives (`; @<name>`).
 */
export function parseRuntimeDirective(line: string): { name: string; args: string[] } | undefined {
	const match = line.match(/^\s*;\s*~(\w+)(?:\s+(.*))?$/);
	if (!match) {
		return undefined;
	}

	const [, name, rawArgs] = match;
	return {
		name,
		args: rawArgs ? rawArgs.trim().split(/\s+/) : [],
	};
}
