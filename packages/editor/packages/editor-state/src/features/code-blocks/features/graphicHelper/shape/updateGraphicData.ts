import type { CodeBlockGraphicData } from '@8f4e/editor-state-types';
import { getPrototypeId, instructionParser, isMemoryDeclarationInstruction } from '@8f4e/tokenizer';
import type { DirectiveDerivedState } from '../../directives/registry';

function getInstructionParts(line: string): { instruction: string | undefined; argumentText: string } {
	const [, instruction, argumentText = ''] = line.match(instructionParser) ?? [];
	return { instruction, argumentText };
}

function getFirstArgument(argumentText: string): string | undefined {
	return argumentText.trim().split(/\s+/, 1)[0];
}

function countPrototypeMemoryDeclarations(code: string[]): number {
	return code.reduce((count, line) => {
		const { instruction } = getInstructionParts(line);
		return instruction && isMemoryDeclarationInstruction(instruction) ? count + 1 : count;
	}, 0);
}

function getPrototypeDeclarationCounts(codeBlocks: CodeBlockGraphicData[]): Map<string, number> {
	const counts = new Map<string, number>();

	for (const block of codeBlocks) {
		if (block.disabled || block.blockType !== 'prototype') {
			continue;
		}

		const prototypeId = getPrototypeId(block.code);
		if (!prototypeId) {
			continue;
		}

		counts.set(prototypeId, countPrototypeMemoryDeclarations(block.code));
	}

	return counts;
}

export default function shape(
	graphicData: CodeBlockGraphicData,
	codeBlocks: CodeBlockGraphicData[],
	directiveState: DirectiveDerivedState
): void {
	if (graphicData.disabled || graphicData.blockType !== 'module') {
		return;
	}

	const prototypeDeclarationCounts = getPrototypeDeclarationCounts(codeBlocks);
	graphicData.code.forEach((line, rawRow) => {
		const { instruction, argumentText } = getInstructionParts(line);
		if (instruction !== 'shape') {
			return;
		}

		const prototypeId = getFirstArgument(argumentText);
		const inheritedDeclarationCount = prototypeId ? prototypeDeclarationCounts.get(prototypeId) : undefined;
		if (!inheritedDeclarationCount) {
			return;
		}

		directiveState.layoutContributions.push({ rawRow, rows: inheritedDeclarationCount });
	});
}
