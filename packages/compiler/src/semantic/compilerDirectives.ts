import { compilerSourceBlockInstructionByType, ErrorCode } from '@8f4e/compiler-spec';

import { getError } from '../compilerError';

import type { AST, CompilerSourceBlockType } from '@8f4e/compiler-spec';

const moduleBlock = compilerSourceBlockInstructionByType.module;
const functionBlock = compilerSourceBlockInstructionByType.function;

export const moduleCompilerDirectives = ['#skipExecution', '#initOnly', '#loopCap'] as const;
export const functionCompilerDirectives = ['#impure', '#export', '#loopCap'] as const;

const compilerDirectivesByBlockType = {
	[moduleBlock.type]: new Set<string>(moduleCompilerDirectives),
	[functionBlock.type]: new Set<string>(functionCompilerDirectives),
} as const;

function getAstBlockType(ast: AST): CompilerSourceBlockType | undefined {
	const firstInstruction = ast[0]?.instruction;

	if (firstInstruction === moduleBlock.start) {
		return moduleBlock.type;
	}
	if (firstInstruction === functionBlock.start) {
		return functionBlock.type;
	}

	return undefined;
}

export function validateCompilerDirectivePrologue(ast: AST, blockType = getAstBlockType(ast)): void {
	if (blockType !== moduleBlock.type && blockType !== functionBlock.type) {
		return;
	}

	const blockDirectives = compilerDirectivesByBlockType[blockType];
	let prologueOpen = true;

	for (const line of ast.slice(1)) {
		if (blockDirectives.has(line.instruction)) {
			if (!prologueOpen) {
				throw getError(ErrorCode.COMPILER_DIRECTIVE_MUST_BE_PROLOGUE, line);
			}
			continue;
		}

		prologueOpen = false;
	}
}
