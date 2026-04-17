import { validateArgumentByRule } from './validateArgumentByRule';

import { type CompilationContext, type InstructionCompiler } from '../types';

import type { ArgumentRule } from './types';

export function validateArgumentTypes(
	argumentsList: Parameters<InstructionCompiler>[0]['arguments'],
	rules: ArgumentRule[] | ArgumentRule,
	line: Parameters<InstructionCompiler>[0],
	context: CompilationContext
): void {
	if (Array.isArray(rules)) {
		for (let i = 0; i < rules.length; i++) {
			const argument = argumentsList[i];
			if (!argument) {
				return;
			}
			validateArgumentByRule(argument, rules[i], line, context);
		}
		return;
	}

	for (const argument of argumentsList) {
		validateArgumentByRule(argument, rules, line, context);
	}
}
