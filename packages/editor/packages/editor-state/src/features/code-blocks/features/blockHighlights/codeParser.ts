import { stackBlockInstructionPairs } from '@8f4e/compiler-spec';
import { instructionParser } from '@8f4e/tokenizer';

const endInstructionByStartInstruction = new Map<string, string>(
	stackBlockInstructionPairs.map(({ start, end }) => [start, end])
);
const endInstructions = new Set<string>(stackBlockInstructionPairs.map(({ end }) => end));

interface CodeBlock {
	startInstruction: string;
	endInstruction: string;
	startLineNumber: number;
	endLineNumber?: number;
	depth: number;
}

function countOpenBlocks(blocks: CodeBlock[]) {
	return blocks.reduce((count, block) => (block.endLineNumber === undefined ? count + 1 : count), 0);
}

function getLastOpenBlockByEndInstruction(blocks: CodeBlock[], instruction: string) {
	return blocks
		.slice()
		.reverse()
		.find(block => block.endInstruction === instruction && block.endLineNumber === undefined);
}

export default function parseCodeBlocks(code: string[]) {
	const blocks: CodeBlock[] = [];

	code.forEach((line, lineIndex) => {
		const [, instruction] = (line.match(instructionParser) || []) as [never, string];

		const openBlockCount = countOpenBlocks(blocks);

		const endInstruction = endInstructionByStartInstruction.get(instruction);
		if (endInstruction) {
			blocks.push({
				startInstruction: instruction,
				endInstruction,
				startLineNumber: lineIndex,
				endLineNumber: undefined,
				depth: openBlockCount,
			});
		}

		if (instruction === 'else') {
			const lastOpenIfBlock = blocks
				.slice()
				.reverse()
				.find(
					block =>
						block.startInstruction === 'if' && block.endInstruction === 'ifEnd' && block.endLineNumber === undefined
				);

			if (lastOpenIfBlock) {
				lastOpenIfBlock.endLineNumber = lineIndex;
				blocks.push({
					startInstruction: 'else',
					endInstruction: 'ifEnd',
					startLineNumber: lineIndex,
					endLineNumber: undefined,
					depth: lastOpenIfBlock.depth,
				});
			}
		}

		if (endInstructions.has(instruction)) {
			const lastOpenBlock = getLastOpenBlockByEndInstruction(blocks, instruction);

			if (lastOpenBlock) {
				lastOpenBlock.endLineNumber = lineIndex;
			}
		}
	});

	return blocks;
}
